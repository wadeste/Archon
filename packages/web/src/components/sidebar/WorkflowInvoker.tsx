import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { listWorkflows, createConversation, runWorkflow, deleteConversation } from '@/lib/api';
import { useProject } from '@/contexts/ProjectContext';

interface WorkflowInvokerProps {
  codebaseId?: string;
}

export function WorkflowInvoker({ codebaseId }: WorkflowInvokerProps): React.ReactElement | null {
  const navigate = useNavigate();
  const { codebases } = useProject();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cwd = codebaseId ? codebases?.find(cb => cb.id === codebaseId)?.default_cwd : undefined;

  const { data: workflows, isError: isErrorWorkflows } = useQuery({
    queryKey: ['workflows', cwd ?? null],
    queryFn: () => listWorkflows(cwd),
    refetchInterval: 30_000,
  });

  if (isErrorWorkflows) {
    return (
      <p className="mx-1 font-mono text-[10px] text-[#ff0000]">
        Failed to load workflows — retrying
      </p>
    );
  }

  if (!workflows || workflows.length === 0) return null;

  const handleRun = async (): Promise<void> => {
    if (!selectedWorkflow || !message.trim() || running) return;
    setRunning(true);
    setError(null);
    let conversationId: string | undefined;
    let workflowStarted = false;
    try {
      ({ conversationId } = await createConversation(codebaseId ?? undefined));
      await runWorkflow(selectedWorkflow, conversationId, message.trim());
      workflowStarted = true;
      setSelectedWorkflow(null);
      setMessage('');
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      console.error('[WorkflowInvoker] Failed to start workflow', { err });
      setError(err instanceof Error ? err.message : 'Failed to start workflow');
      if (conversationId !== undefined && !workflowStarted) {
        void deleteConversation(conversationId).catch((cleanupErr: unknown) => {
          console.warn('[WorkflowInvoker] Failed to clean up orphan conversation', {
            conversationId,
            error: cleanupErr,
          });
        });
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 mx-1">
      <select
        value={selectedWorkflow ?? ''}
        onChange={(e): void => {
          setSelectedWorkflow(e.target.value || null);
          setError(null);
        }}
        className="w-full rounded-none border-[3px] border-black bg-[#f0f0f0] px-2 py-1.5 font-mono text-xs text-black outline-none focus-visible:border-[5px] focus-visible:-m-[2px]"
      >
        <option value="">Run workflow...</option>
        {workflows.map(entry => (
          <option key={entry.workflow.name} value={entry.workflow.name}>
            {entry.workflow.name}
          </option>
        ))}
      </select>
      {selectedWorkflow && (
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={message}
            onChange={(e): void => {
              setMessage(e.target.value);
            }}
            onKeyDown={(e): void => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleRun();
              }
            }}
            placeholder="Enter message..."
            name="workflow-message"
            autoComplete="off"
            disabled={running}
            className="w-full rounded-none border-[3px] border-black bg-[#f0f0f0] px-2 py-1 font-mono text-xs text-black placeholder:text-[var(--text-tertiary)] outline-none focus-visible:border-[5px] focus-visible:-m-[2px] disabled:bg-[#f5f5f5] disabled:border-[#cccccc] disabled:cursor-not-allowed"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            {error && (
              <span className="font-mono text-[10px] text-[#ff0000] flex-1 line-clamp-1">
                {error}
              </span>
            )}
            <button
              onClick={(): void => {
                void handleRun();
              }}
              disabled={running || !message.trim()}
              className="flex items-center gap-1 rounded-none border-[3px] border-black bg-black px-2 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.05em] text-white transition-colors hover:bg-white hover:text-black active:border-[5px] disabled:bg-[#f0f0f0] disabled:text-[var(--text-tertiary)] disabled:border-[#cccccc] disabled:cursor-not-allowed"
            >
              {running && <Loader2 className="h-3 w-3 animate-spin" />}
              {running ? 'Starting...' : 'Run'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
