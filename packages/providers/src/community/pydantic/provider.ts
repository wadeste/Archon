/**
 * Pydantic community provider — typed answer-node worker bridge.
 *
 * Runs a KL answer-node as ONE spawned Python worker call (stdio JSON
 * contract) instead of a headless coding-agent session. The worker
 * (`.claude/scripts/kl_answer_worker.py` in the second-brain repo) makes a
 * schema-validated Pydantic AI call against MiniMax-M3's Anthropic-style
 * endpoint, with worker-internal chunking for batch classification (per-chunk
 * ID-set completeness, merge in input order).
 *
 * Node wiring (all optional except output_format for structured nodes):
 *
 *   provider: pydantic
 *   output_format: { ...JSON schema... }
 *   provider_options:
 *     context_artifacts: [focus.md]  # inlined above the prompt (no Read tool)
 *     batch:                      # omit for plain single-call nodes
 *       items_artifact: items.json   # resolved against the run's artifacts dir
 *       chunk_size: 20
 *       concurrency: 1
 *     timeout_s: 600
 *
 * `provider_options` and `artifactsDir` reach nodeConfig via the small
 * dag-executor forwarding added alongside this provider.
 *
 * Plan: second-brain docs/plans/kairon-lite-pydantic-answer-provider.md §4b.
 */
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';

import type {
  IAgentProvider,
  MessageChunk,
  ProviderCapabilities,
  SendQueryOptions,
} from '../../types';

import { PYDANTIC_CAPABILITIES } from './capabilities';

const DEFAULT_WORKER_PATH = join(
  homedir(),
  'wadevault-second-brain',
  '.claude',
  'scripts',
  'kl_answer_worker.py'
);

/** uv provisions the pinned deps from its cache — no venv to manage. */
const DEFAULT_WORKER_COMMAND = [
  'uv',
  'run',
  '--with',
  'pydantic-ai-slim[anthropic]>=2.1.0',
  'python',
];

/** Keep-alive cadence — a long chunked batch emits nothing until it finishes,
 *  and the dag-executor's idle timeout must not read that silence as a hang. */
const HEARTBEAT_MS = 30_000;

interface PydanticBatchOptions {
  items_artifact?: string;
  chunk_size?: number;
  concurrency?: number;
}

interface PydanticProviderOptions {
  batch?: PydanticBatchOptions;
  timeout_s?: number;
  /** Artifact files whose content is inlined ABOVE the prompt as context
   *  blocks (e.g. focus.md). Replaces the coding-agent's Read-tool access:
   *  answer-nodes get inputs inlined, they don't browse the filesystem. */
  context_artifacts?: string[];
}

interface WorkerResponse {
  text?: string;
  structured_output?: unknown;
  usage?: { input_tokens?: number; output_tokens?: number; requests?: number };
  session_id?: string;
  error?: string;
  kind?: string;
}

function errorChunk(message: string, kind: string): MessageChunk {
  return { type: 'result', isError: true, errors: [message], errorSubtype: kind };
}

export class PydanticProvider implements IAgentProvider {
  getType(): string {
    return 'pydantic';
  }

  getCapabilities(): ProviderCapabilities {
    return PYDANTIC_CAPABILITIES;
  }

  async *sendQuery(
    prompt: string,
    cwd: string,
    _resumeSessionId?: string,
    options?: SendQueryOptions
  ): AsyncGenerator<MessageChunk> {
    const nodeConfig = options?.nodeConfig ?? {};
    const assistantConfig = options?.assistantConfig ?? {};
    const providerOpts = (nodeConfig.provider_options ?? {}) as PydanticProviderOptions;
    const schema =
      options?.outputFormat?.schema ??
      (nodeConfig.output_format as Record<string, unknown> | undefined);

    const request: Record<string, unknown> = {};
    if (schema) request.output_format = schema;
    if (typeof options?.systemPrompt === 'string') request.system_prompt = options.systemPrompt;
    if (typeof providerOpts.timeout_s === 'number') request.timeout_s = providerOpts.timeout_s;
    const modelRef = options?.model;
    if (modelRef) {
      // Accept both bare ('MiniMax-M3') and coding-plan-prefixed
      // ('minimax-code/MiniMax-M3') refs — the worker wants the bare name.
      request.model = { name: modelRef.includes('/') ? modelRef.split('/').pop() : modelRef };
    }

    const artifactsDir = nodeConfig.artifactsDir as string | undefined;

    let effectivePrompt = prompt;
    if (providerOpts.context_artifacts?.length) {
      if (!artifactsDir) {
        yield errorChunk(
          'pydantic context_artifacts needs nodeConfig.artifactsDir — dag-executor did not forward it',
          'validation'
        );
        return;
      }
      const blocks: string[] = [];
      for (const name of providerOpts.context_artifacts) {
        const path = isAbsolute(name) ? name : join(artifactsDir, name);
        try {
          blocks.push(`=== ${name} ===\n${await readFile(path, 'utf8')}`);
        } catch (err) {
          yield errorChunk(
            `pydantic: cannot read context artifact at ${path}: ${String(err)}`,
            'validation'
          );
          return;
        }
      }
      effectivePrompt = `${blocks.join('\n\n')}\n\n${prompt}`;
    }

    if (providerOpts.batch) {
      if (!artifactsDir) {
        yield errorChunk(
          'pydantic batch mode needs nodeConfig.artifactsDir — dag-executor did not forward it',
          'validation'
        );
        return;
      }
      const itemsFile = providerOpts.batch.items_artifact ?? 'items.json';
      const itemsPath = isAbsolute(itemsFile) ? itemsFile : join(artifactsDir, itemsFile);
      let items: unknown;
      try {
        items = JSON.parse(await readFile(itemsPath, 'utf8'));
      } catch (err) {
        yield errorChunk(
          `pydantic batch: cannot read items at ${itemsPath}: ${String(err)}`,
          'validation'
        );
        return;
      }
      request.batch = {
        items,
        prompt_template: effectivePrompt.includes('{items_chunk}')
          ? effectivePrompt
          : `${effectivePrompt}\n\nItems to score (ids verbatim):\n{items_chunk}`,
        ...(providerOpts.batch.chunk_size !== undefined
          ? { chunk_size: providerOpts.batch.chunk_size }
          : {}),
        ...(providerOpts.batch.concurrency !== undefined
          ? { concurrency: providerOpts.batch.concurrency }
          : {}),
      };
    } else {
      request.prompt = effectivePrompt;
    }

    const workerPath =
      (assistantConfig.workerPath as string | undefined) ??
      process.env.KL_PYDANTIC_WORKER ??
      DEFAULT_WORKER_PATH;
    const workerCommand =
      (assistantConfig.workerCommand as string[] | undefined) ?? DEFAULT_WORKER_COMMAND;
    const argv = [...workerCommand, workerPath];

    const child = spawn(argv[0]!, argv.slice(1), {
      cwd,
      env: { ...process.env, ...(options?.env ?? {}) },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString();
    });

    const onAbort = () => child.kill('SIGKILL');
    options?.abortSignal?.addEventListener('abort', onAbort, { once: true });

    const exited = new Promise<number>((resolve) => {
      child.on('close', (code) => resolve(code ?? -1));
      child.on('error', () => resolve(-1));
    });
    child.stdin.write(JSON.stringify(request));
    child.stdin.end();

    let exitCode: number;
    try {
      for (;;) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const heartbeat = new Promise<null>((resolve) => {
          timer = setTimeout(() => resolve(null), HEARTBEAT_MS);
        });
        const winner = await Promise.race([exited.then((code) => ({ code })), heartbeat]);
        if (timer !== undefined) clearTimeout(timer);
        if (winner !== null) {
          exitCode = winner.code;
          break;
        }
        yield { type: 'system', content: 'pydantic answer-worker running…' };
      }
    } finally {
      options?.abortSignal?.removeEventListener('abort', onAbort);
    }

    const lastLine = stdout.trim().split('\n').filter(Boolean).pop() ?? '';
    let response: WorkerResponse | undefined;
    try {
      response = JSON.parse(lastLine) as WorkerResponse;
    } catch {
      response = undefined;
    }

    if (response === undefined) {
      yield errorChunk(
        `pydantic worker exited ${exitCode} without a JSON response; stderr tail: ${stderr.slice(-500)}`,
        options?.abortSignal?.aborted ? 'timeout' : 'transient'
      );
      return;
    }
    if (response.error !== undefined) {
      yield errorChunk(response.error, response.kind ?? 'transient');
      return;
    }

    if (response.text) yield { type: 'assistant', content: response.text };
    yield {
      type: 'result',
      sessionId: response.session_id,
      ...(response.structured_output !== undefined && response.structured_output !== null
        ? { structuredOutput: response.structured_output }
        : {}),
      ...(response.usage
        ? {
            tokens: {
              input: response.usage.input_tokens ?? 0,
              output: response.usage.output_tokens ?? 0,
            },
          }
        : {}),
    };
  }
}
