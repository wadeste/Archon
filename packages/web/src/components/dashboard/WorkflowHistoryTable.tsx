import { Link } from 'react-router';
import { Globe, Terminal, Hash, Send, GitBranch, Trash2 } from 'lucide-react';
import type { DashboardRunResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDuration, formatStarted } from '@/lib/format';
import { ConfirmRunActionDialog } from './ConfirmRunActionDialog';

interface WorkflowHistoryTableProps {
  runs: DashboardRunResponse[];
  onDelete?: (runId: string) => void;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  completed: 'bg-[#008000] border-[#008000]',
  failed: 'bg-[#ff0000] border-[#ff0000]',
  cancelled: 'bg-white border-[#cccccc]',
};

const PLATFORM_ICONS: Record<string, React.ReactElement> = {
  web: <Globe className="h-3 w-3" />,
  cli: <Terminal className="h-3 w-3" />,
  slack: <Hash className="h-3 w-3" />,
  telegram: <Send className="h-3 w-3" />,
  github: <GitBranch className="h-3 w-3" />,
};

export function WorkflowHistoryTable({
  runs,
  onDelete,
}: WorkflowHistoryTableProps): React.ReactElement {
  if (runs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="font-mono text-xs text-[var(--text-tertiary)]">No history</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-none border-[3px] border-black">
      <table className="w-full font-sans text-xs">
        <thead>
          <tr className="border-b-[3px] border-black bg-[#f0f0f0] text-left text-black">
            <th className="px-3 py-2 font-display uppercase tracking-[0.05em] w-8">Status</th>
            <th className="px-3 py-2 font-display uppercase tracking-[0.05em]">Workflow</th>
            <th className="px-3 py-2 font-display uppercase tracking-[0.05em]">Project</th>
            <th className="px-3 py-2 font-display uppercase tracking-[0.05em] w-16">Source</th>
            <th className="px-3 py-2 font-display uppercase tracking-[0.05em] w-20">Duration</th>
            <th className="px-3 py-2 font-display uppercase tracking-[0.05em] w-32">Started</th>
            <th className="px-3 py-2 font-display uppercase tracking-[0.05em] w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {runs.map(run => (
            <tr
              key={run.id}
              className={cn(
                'border-b-[1px] border-black hover:bg-[#f0f0f0] transition-colors last:border-b-0',
                run.status === 'failed' && 'border-l-[5px] border-l-[#ff0000]'
              )}
            >
              <td className="px-3 py-2">
                <div
                  className={cn(
                    'h-2.5 w-2.5 border-[2px] rounded-none',
                    STATUS_DOT_COLORS[run.status] ?? 'bg-white border-[#cccccc]'
                  )}
                />
              </td>
              <td className="px-3 py-2">
                <Link
                  to={`/workflows/runs/${run.id}`}
                  className="text-black hover:underline truncate block"
                >
                  {run.workflow_name}
                </Link>
                {run.user_message && (
                  <p className="font-mono text-[11px] text-[var(--text-tertiary)] truncate max-w-[300px]">
                    {run.user_message}
                  </p>
                )}
              </td>
              <td className="px-3 py-2 text-[var(--text-secondary)] truncate">
                {run.codebase_name ?? '\u2014'}
              </td>
              <td className="px-3 py-2">
                <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                  {PLATFORM_ICONS[run.platform_type ?? ''] ?? null}
                  {run.platform_type ?? '\u2014'}
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-[var(--text-secondary)]">
                {formatDuration(run.started_at, run.completed_at)}
              </td>
              <td className="px-3 py-2 font-mono text-[var(--text-secondary)]">
                {formatStarted(run.started_at)}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/workflows/runs/${run.id}`}
                    className="font-semibold uppercase tracking-[0.05em] text-black hover:underline transition-colors"
                  >
                    View Logs
                  </Link>
                  {onDelete && (
                    <ConfirmRunActionDialog
                      trigger={
                        <button
                          className="rounded-none border-[2px] border-transparent p-0.5 text-black hover:border-[#ff0000] hover:text-[#ff0000] transition-colors"
                          title="Delete run"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      }
                      title="Delete workflow run?"
                      description={
                        <>
                          Permanently delete the run record for <strong>{run.workflow_name}</strong>{' '}
                          and its events. This cannot be undone.
                        </>
                      }
                      confirmLabel="Delete"
                      onConfirm={(): void => {
                        onDelete(run.id);
                      }}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
