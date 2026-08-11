import { describe, expect, it } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { MessageChunk } from '../../types';

import { PydanticProvider } from './provider';

type ResultChunk = Extract<MessageChunk, { type: 'result' }>;
type AssistantChunk = Extract<MessageChunk, { type: 'assistant' }>;

const FIXTURE = join(import.meta.dir, 'test-fixtures', 'fake_worker.ts');
// process.execPath = the bun binary running this test — immune to PATH gaps
// on non-interactive shells.
const assistantConfig = { workerCommand: [process.execPath], workerPath: FIXTURE };

async function collect(gen: AsyncGenerator<MessageChunk>): Promise<MessageChunk[]> {
  const out: MessageChunk[] = [];
  for await (const chunk of gen) out.push(chunk);
  return out;
}

function resultOf(chunks: MessageChunk[]): ResultChunk {
  const result = chunks.find((c) => c.type === 'result') as ResultChunk | undefined;
  if (!result) throw new Error(`no result chunk in ${JSON.stringify(chunks)}`);
  return result;
}

describe('PydanticProvider', () => {
  const provider = new PydanticProvider();

  it('reports type and conservative capabilities', () => {
    expect(provider.getType()).toBe('pydantic');
    expect(provider.getCapabilities().structuredOutput).toBe('enforced');
    expect(provider.getCapabilities().sessionResume).toBe(false);
    expect(provider.getCapabilities().fallbackModel).toBe(false);
  });

  it('plain mode forwards prompt/schema/system/model and maps the response', async () => {
    const chunks = await collect(
      provider.sendQuery('hello', process.cwd(), undefined, {
        model: 'minimax-code/MiniMax-M3',
        outputFormat: { type: 'json_schema', schema: { type: 'object', properties: {} } },
        systemPrompt: 'sys',
        assistantConfig,
        nodeConfig: {},
      })
    );
    const assistant = chunks.find((c) => c.type === 'assistant') as AssistantChunk;
    expect(assistant.content).toBe('fixture-ok');
    const result = resultOf(chunks);
    const echo = (result.structuredOutput as { echo: Record<string, unknown> }).echo;
    expect(echo.prompt).toBe('hello');
    expect(echo.model).toEqual({ name: 'MiniMax-M3' });
    expect(echo.system_prompt).toBe('sys');
    expect(echo.output_format).toEqual({ type: 'object', properties: {} });
    expect(echo.batch).toBeUndefined();
    expect(result.tokens).toEqual({ input: 10, output: 5 });
    expect(result.sessionId).toBe('pydantic-test');
    expect(result.isError).toBeUndefined();
  });

  it('batch mode reads items from artifactsDir and builds the chunk template', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pydantic-test-'));
    writeFileSync(join(dir, 'items.json'), JSON.stringify([{ id: 'a' }, { id: 'b' }]));
    const chunks = await collect(
      provider.sendQuery('Score these.', process.cwd(), undefined, {
        assistantConfig,
        outputFormat: { type: 'json_schema', schema: { type: 'object' } },
        nodeConfig: {
          artifactsDir: dir,
          provider_options: { batch: { chunk_size: 10, concurrency: 2 } },
        },
      })
    );
    const echo = (resultOf(chunks).structuredOutput as { echo: Record<string, unknown> }).echo;
    const batch = echo.batch as Record<string, unknown>;
    expect(batch.items).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(batch.chunk_size).toBe(10);
    expect(batch.concurrency).toBe(2);
    expect(batch.prompt_template as string).toContain('Score these.');
    expect(batch.prompt_template as string).toContain('{items_chunk}');
    expect(echo.prompt).toBeUndefined();
  });

  it('context_artifacts are inlined above the prompt', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pydantic-test-'));
    writeFileSync(join(dir, 'focus.md'), 'FOCUS PROFILE CONTENT');
    writeFileSync(join(dir, 'items.json'), JSON.stringify([{ id: 'a' }]));
    const chunks = await collect(
      provider.sendQuery('Score these.', process.cwd(), undefined, {
        assistantConfig,
        nodeConfig: {
          artifactsDir: dir,
          provider_options: { context_artifacts: ['focus.md'], batch: {} },
        },
      })
    );
    const echo = (resultOf(chunks).structuredOutput as { echo: Record<string, unknown> }).echo;
    const template = (echo.batch as Record<string, unknown>).prompt_template as string;
    expect(template).toContain('=== focus.md ===');
    expect(template).toContain('FOCUS PROFILE CONTENT');
    expect(template.indexOf('FOCUS PROFILE CONTENT')).toBeLessThan(template.indexOf('Score these.'));
  });

  it('missing context artifact fails as validation', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pydantic-test-'));
    const chunks = await collect(
      provider.sendQuery('x', process.cwd(), undefined, {
        assistantConfig,
        nodeConfig: { artifactsDir: dir, provider_options: { context_artifacts: ['nope.md'] } },
      })
    );
    const result = resultOf(chunks);
    expect(result.isError).toBe(true);
    expect(result.errorSubtype).toBe('validation');
  });

  it('batch mode respects an explicit items_artifact name', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pydantic-test-'));
    writeFileSync(join(dir, 'custom.json'), JSON.stringify([{ id: 'z' }]));
    const chunks = await collect(
      provider.sendQuery('go', process.cwd(), undefined, {
        assistantConfig,
        nodeConfig: {
          artifactsDir: dir,
          provider_options: { batch: { items_artifact: 'custom.json' } },
        },
      })
    );
    const echo = (resultOf(chunks).structuredOutput as { echo: Record<string, unknown> }).echo;
    expect((echo.batch as Record<string, unknown>).items).toEqual([{ id: 'z' }]);
  });

  it('batch mode without artifactsDir fails as validation', async () => {
    const chunks = await collect(
      provider.sendQuery('x', process.cwd(), undefined, {
        assistantConfig,
        nodeConfig: { provider_options: { batch: {} } },
      })
    );
    expect(chunks).toHaveLength(1);
    const result = resultOf(chunks);
    expect(result.isError).toBe(true);
    expect(result.errorSubtype).toBe('validation');
  });

  it('batch mode with a missing items file fails as validation', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pydantic-test-'));
    const chunks = await collect(
      provider.sendQuery('x', process.cwd(), undefined, {
        assistantConfig,
        nodeConfig: { artifactsDir: dir, provider_options: { batch: {} } },
      })
    );
    const result = resultOf(chunks);
    expect(result.isError).toBe(true);
    expect(result.errorSubtype).toBe('validation');
  });

  it('maps worker error JSON to an error result with its kind', async () => {
    const chunks = await collect(
      provider.sendQuery('ERR', process.cwd(), undefined, { assistantConfig, nodeConfig: {} })
    );
    const result = resultOf(chunks);
    expect(result.isError).toBe(true);
    expect(result.errors).toEqual(['boom']);
    expect(result.errorSubtype).toBe('auth');
  });

  it('maps a crashed worker (no JSON) to a transient error with stderr tail', async () => {
    const chunks = await collect(
      provider.sendQuery('CRASH', process.cwd(), undefined, { assistantConfig, nodeConfig: {} })
    );
    const result = resultOf(chunks);
    expect(result.isError).toBe(true);
    expect(result.errorSubtype).toBe('transient');
    expect((result.errors ?? [])[0]).toContain('kaboom');
  });
});
