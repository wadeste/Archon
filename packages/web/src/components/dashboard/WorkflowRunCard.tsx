import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Globe,
  Terminal,
  Hash,
  Send,
  GitBranch,
  ExternalLink,
  MessageSquare,
  FileText,
  XCircle,
  PlayCircle,
  Ban,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Pause,
} from 'lucide-react';
import type { DashboardRunResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/format';
import { useWorkflowStore } from '@/stores/workflow-store';
import type { WorkflowState } from '@/lib/types';
import { ConfirmRunActionDialog } from './ConfirmRunActionDialog';

interface WorkflowRunCardProps {
  run: DashboardRunResponse;
  isDocker?: boolean;
  onCancel: (runId: string) => void;
  onResume?: (runId: string) => void;
  onAbandon?: (runId: string) => void;
  onDelete?: (runId: string) => void;
  onApprove?: (runId: string) => void;
  onReject?: (runId: string, reason?: string) => void;
}

const PLATFORM_ICONS: Record<string, React.ReactElement> = {
  web: <Globe className="h-3.5 w-3.5" />,
  cli: <Terminal className="h-3.5 w-3.5" />,
  slack: <Hash className="h-3.5 w-3.5" />,
  telegram: <Send className="h-3.5 w-3.5" />,
  github: <GitBranch className="h-3.5 w-3.5" />,
};

function StepProgress({
  run,
  liveState,
}: {
  run: DashboardRunResponse;
  liveState: WorkflowState | undefined;
}): React.ReactElement | null {
  const dagNodes = liveState?.dagNodes ?? [];
  const runningNode = dagNodes
    .slice()
    .reverse()
    .find(n => n.status === 'running');
  const completedCount = dagNodes.filter(n => n.status === 'completed').length;
  const totalNodes = dagNodes.length || run.total_steps || 0;
  const stepName = runningNode?.name ?? run.current_step_name;
  const currentTool = liveState?.currentTool ?? null;

  const hasProgress = runningNode != null || totalNodes > 0;
  if (!hasProgress && !currentTool) return null;

  return (
    <div className="rounded-none border-[3px] border-black bg-[#f0f0f0] px-3 py-2 space-y-1">
      {hasProgress && (
        <div className="flex items-center gap-2 font-sans text-sm text-black">
          <span className="font-semibold">
            {`${String(completedCount)}${totalNodes ? `/${String(totalNodes)}` : ''} nodes`}
          </span>
          {stepName && <span className="text-[var(--text-secondary)]">{stepName}</span>}
        </div>
      )}
      {currentTool && (
        <div className="flex items-center gap-2">
          {currentTool.status === 'running' && (
            <div className="h-3.5 w-3.5 shrink-0 border-[2px] border-black border-t-transparent animate-spin" />
          )}
          <span
            className={cn(
              'text-sm font-mono truncate',
              currentTool.status === 'running'
                ? 'text-black font-bold'
                : 'text-[var(--text-secondary)]'
            )}
          >
            {currentTool.status === 'running'
              ? currentTool.name
              : `${currentTool.name} (${currentTool.durationMs ? `${(currentTool.durationMs / 1000).toFixed(1)}s` : 'done'})`}
          </span>
        </div>
      )}
    </div>
  );
}

interface NodeCounts {
  completed: number;
  failed: number;
  skipped: number;
  total: number;
}

function isValidNodeCounts(value: unknown): value is NodeCounts {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.completed === 'number' &&
    typeof obj.failed === 'number' &&
    typeof obj.skipped === 'number' &&
    typeof obj.total === 'number'
  );
}

function NodeCountsSummary({ counts }: { counts: NodeCounts }): React.ReactElement {
  const hasFailures = counts.failed > 0 || counts.skipped > 0;
  return (
    <div className="flex items-center gap-1.5 font-sans text-xs">
      {hasFailures ? (
        <AlertTriangle className="h-3.5 w-3.5 text-[#ffa500] shrink-0" />
      ) : (
        <CheckCircle className="h-3.5 w-3.5 text-[#008000] shrink-0" />
      )}
      <span
        className={hasFailures ? 'text-[#ffa500] font-semibold' : 'text-[#008000] font-semibold'}
      >
        {String(counts.completed)}/{String(counts.total)} nodes succeeded
      </span>
      {counts.failed > 0 && (
        <span className="text-[var(--text-secondary)]">
          &middot; {String(counts.failed)} failed
        </span>
      )}
      {counts.skipped > 0 && (
        <span className="text-[var(--text-secondary)]">
          &middot; {String(counts.skipped)} skipped
        </span>
      )}
    </div>
  );
}

export function WorkflowRunCard({
  run,
  isDocker,
  onCancel,
  onResume,
  onAbandon,
  onDelete,
  onApprove,
  onReject,
}: WorkflowRunCardProps): React.ReactElement {
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(() => formatDuration(run.started_at, run.completed_at));

  // Live SSE state from Zustand store — overrides REST-polled data when present
  const liveState = useWorkflowStore(state => state.workflows.get(run.id));

  useEffect(() => {
    if (run.status !== 'running' && run.status !== 'paused') return;
    const interval = setInterval(() => {
      setElapsed(formatDuration(run.started_at, null));
    }, 1000);
    return (): void => {
      clearInterval(interval);
    };
  }, [run.status, run.started_at]);

  const chatId = run.parent_platform_id ?? run.worker_platform_id;
  const [messageExpanded, setMessageExpanded] = useState(false);
  const longMessage = (run.user_message?.length ?? 0) > 80;
  const displayMessage = run.user_message
    ? messageExpanded || !longMessage
      ? run.user_message
      : run.user_message.slice(0, 80) + '…'
    : null;

  return (
    <div className="rounded-none border-[5px] border-black bg-white p-4 space-y-3">
      {/* Header: status dot + name + badge + elapsed */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'h-2.5 w-2.5 shrink-0 border-[2px] rounded-none',
            run.status === 'running' && 'border-black bg-black animate-pulse',
            run.status === 'paused' && 'border-[#ffa500] bg-[#ffa500] animate-pulse',
            run.status === 'pending' && 'border-[#cccccc] bg-white'
          )}
        />
        <span className="font-display text-sm uppercase tracking-[0.05em] text-black truncate flex-1">
          {run.workflow_name}
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded-none border-[2px] bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.045em]',
            run.status === 'running' && 'border-black text-black',
            run.status === 'paused' && 'border-[#ffa500] text-[#ffa500]',
            run.status === 'pending' && 'border-[#cccccc] text-[var(--text-secondary)]'
          )}
        >
          {run.status}
        </span>
        <span className="font-mono text-xs text-[var(--text-tertiary)] shrink-0">{elapsed}</span>
      </div>

      {/* Live progress */}
      <StepProgress run={run} liveState={liveState} />

      {/* Node outcome summary for completed/failed runs */}
      {(run.status === 'completed' || run.status === 'failed') &&
        isValidNodeCounts(run.metadata?.node_counts) && (
          <div className="flex items-center gap-2">
            <NodeCountsSummary counts={run.metadata.node_counts} />
            {typeof run.metadata?.total_cost_usd === 'number' && (
              <span className="text-xs text-text-secondary">
                ${run.metadata.total_cost_usd.toFixed(4)} USD
              </span>
            )}
          </div>
        )}

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          {PLATFORM_ICONS[run.platform_type ?? ''] ?? <Globe className="h-3.5 w-3.5" />}
          {run.platform_type ?? 'unknown'}
        </span>
        <span>{run.codebase_name ?? 'Unknown project'}</span>
        {run.parent_platform_id && run.parent_platform_id !== run.worker_platform_id && (
          <button
            onClick={(): void => {
              navigate(`/chat/${encodeURIComponent(run.parent_platform_id ?? '')}`);
            }}
            className="flex items-center gap-1 text-[#0000ff] hover:underline transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            Parent chat
          </button>
        )}
      </div>

      {/* User message — expandable */}
      {displayMessage && (
        <div className="space-y-0.5">
          <p
            className={cn(
              'font-mono text-xs text-[var(--text-tertiary)] italic',
              !messageExpanded && 'truncate'
            )}
          >
            {displayMessage}
          </p>
          {longMessage && (
            <button
              onClick={(): void => {
                setMessageExpanded(e => !e);
              }}
              className="font-sans text-[10px] font-semibold uppercase tracking-[0.05em] text-black hover:underline"
            >
              {messageExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Approval request message */}
      {run.status === 'paused' && run.metadata?.approval != null && (
        <div className="rounded-none border-l-[5px] border-[#ffa500] bg-white px-3 py-2 flex items-start gap-2">
          <Pause className="h-4 w-4 text-[#ffa500] shrink-0 mt-0.5" />
          <p className="font-sans text-xs text-black">
            {(
              run.metadata.approval as {
                message?: string;
              }
            )?.message ?? 'Waiting for approval'}
          </p>
        </div>
      )}

      {/* Working path */}
      {run.working_path && (
        <p className="font-mono text-[11px] text-[var(--text-tertiary)] truncate">
          Worktree: {run.working_path.split('/').pop()}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={(): void => {
            navigate(`/workflows/runs/${run.id}`);
          }}
          className="flex items-center gap-1 rounded-none border-[2px] border-black bg-white px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.05em] text-black transition-colors hover:bg-black hover:text-white"
        >
          <FileText className="h-3.5 w-3.5" />
          View Logs
        </button>
        {chatId && (
          <button
            onClick={(): void => {
              navigate(`/chat/${encodeURIComponent(chatId)}`);
            }}
            className="flex items-center gap-1 rounded-none border-[2px] border-black bg-white px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.05em] text-black transition-colors hover:bg-black hover:text-white"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Open Chat
          </button>
        )}
        {run.working_path && !isDocker && (
          <a
            href={`vscode://file/${run.working_path.replace(/\\/g, '/')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-none border-[2px] border-black bg-white px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.05em] text-black transition-colors hover:bg-black hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in IDE
          </a>
        )}
        <div className="ml-auto flex items-center gap-1">
          {run.status === 'paused' && onApprove && (
            <button
              onClick={(): void => {
                onApprove(run.id);
              }}
              className="flex items-center gap-1 rounded-none border-[3px] border-[#008000] bg-white px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.05em] text-[#008000] transition-colors hover:bg-[#008000] hover:text-white active:border-[5px]"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve
            </button>
          )}
          {run.status === 'paused' && onReject && (
            <ConfirmRunActionDialog
              trigger={
                <button className="flex items-center gap-1 rounded-none border-[3px] border-[#ff0000] bg-white px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.05em] text-[#ff0000] transition-colors hover:bg-[#ff0000] hover:text-white active:border-[5px]">
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              }
              title="Reject workflow?"
              description={
                <>
                  Reject the paused workflow <strong>{run.workflow_name}</strong>. If the approval
                  node defines an <code>on_reject</code> prompt, it runs with your reason as{' '}
                  <code>$REJECTION_REASON</code>; otherwise the run is cancelled.
                </>
              }
              confirmLabel="Reject"
              reasonInput={{
                label: 'Reason (optional)',
                placeholder: 'Why are you rejecting? Visible to the on_reject prompt.',
              }}
              onConfirm={(reason): void => {
                onReject(run.id, reason);
              }}
            />
          )}
          {run.status === 'failed' && onResume && (
            <button
              onClick={(): void => {
                onResume(run.id);
              }}
              className="flex items-center gap-1 rounded-none border-[3px] border-black bg-black px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.05em] text-white transition-colors hover:bg-white hover:text-black active:border-[5px]"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Resume
            </button>
          )}
          {run.status === 'running' && onAbandon && (
            <ConfirmRunActionDialog
              trigger={
                <button className="flex items-center gap-1 rounded-none border-[3px] border-[#ffa500] bg-white px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.05em] text-[#ffa500] transition-colors hover:bg-[#ffa500] hover:text-white active:border-[5px]">
                  <Ban className="h-3.5 w-3.5" />
                  Abandon
                </button>
              }
              title="Abandon workflow?"
              description={
                <>
                  Mark <strong>{run.workflow_name}</strong> as cancelled. Already-completed nodes
                  remain in the database; the run will not continue.
                </>
              }
              confirmLabel="Abandon"
              onConfirm={(): void => {
                onAbandon(run.id);
              }}
            />
          )}
          {(run.status === 'running' || run.status === 'pending') && (
            <ConfirmRunActionDialog
              trigger={
                <button className="flex items-center gap-1 rounded-none border-[3px] border-[#ff0000] bg-[#ff0000] px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.125em] text-white transition-colors hover:bg-black hover:text-[#ff0000] active:border-[5px]">
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel
                </button>
              }
              title="Cancel workflow?"
              description={
                <>
                  Cancel <strong>{run.workflow_name}</strong>. The run will be marked as cancelled
                  and any in-flight subprocess will be terminated.
                </>
              }
              confirmLabel="Cancel workflow"
              onConfirm={(): void => {
                onCancel(run.id);
              }}
            />
          )}
          {onDelete && run.status !== 'running' && run.status !== 'pending' && (
            <ConfirmRunActionDialog
              trigger={
                <button className="flex items-center gap-1 rounded-none border-[2px] border-black bg-white px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.05em] text-black transition-colors hover:bg-[#ff0000] hover:border-[#ff0000] hover:text-white">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              }
              title="Delete workflow run?"
              description={
                <>
                  Permanently delete the run record for <strong>{run.workflow_name}</strong> and its
                  events. This cannot be undone.
                </>
              }
              confirmLabel="Delete"
              onConfirm={(): void => {
                onDelete(run.id);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
