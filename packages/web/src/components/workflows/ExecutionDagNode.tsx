import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { DagNodeData } from './DagNodeComponent';
import type { WorkflowStepStatus } from '@/lib/types';
import { formatDurationMs } from '@/lib/format';
import { StatusIcon } from './StatusIcon';

export interface ExecutionNodeData extends DagNodeData {
  status?: WorkflowStepStatus;
  duration?: number;
  error?: string;
  selected?: boolean;
  currentIteration?: number;
  maxIterations?: number;
}

export type ExecutionFlowNode = Node<ExecutionNodeData>;

const STATUS_STYLES: Partial<Record<WorkflowStepStatus, string>> = {
  completed: 'border-l-[5px] border-[#008000]',
  running: 'border-l-[5px] border-black',
  failed: 'border-l-[5px] border-[#ff0000]',
  skipped: 'border-l-[5px] border-[#cccccc] text-[var(--text-tertiary)]',
};
const DEFAULT_STYLE = 'border-l-[5px] border-black';

const TYPE_COLORS: Record<string, string> = {
  command: 'text-black',
  prompt: 'text-[#ff0000]',
  bash: 'text-[#ffa500]',
  loop: 'text-[#008000]',
};

const TYPE_LABELS: Record<string, string> = {
  command: 'CMD',
  bash: 'BASH',
  prompt: 'PROMPT',
  loop: 'LOOP',
};

function ExecutionDagNodeRender({ data }: NodeProps<ExecutionFlowNode>): React.ReactElement {
  const style = (data.status && STATUS_STYLES[data.status]) ?? DEFAULT_STYLE;
  const typeLabel = TYPE_LABELS[data.nodeType] ?? 'PROMPT';

  return (
    <div
      className={`rounded-none border-[3px] border-black bg-white px-3 py-2 min-w-[140px] transition-all duration-300 ${style}${data.selected ? ' border-[5px]' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-black !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <StatusIcon status={data.status ?? 'pending'} />
        <span
          className={`font-display text-[10px] uppercase tracking-[0.05em] ${TYPE_COLORS[data.nodeType] ?? 'text-black'}`}
        >
          {typeLabel}
        </span>
        <span className="font-sans text-xs font-semibold text-black truncate max-w-[100px]">
          {data.label}
        </span>
        {data.duration !== undefined && (
          <span className="font-mono text-[10px] text-[var(--text-tertiary)] ml-auto shrink-0">
            {formatDurationMs(data.duration)}
          </span>
        )}
      </div>
      {data.currentIteration !== undefined && data.maxIterations !== undefined && (
        <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5">
          {data.currentIteration}/{data.maxIterations} iterations
        </div>
      )}
      {data.error && (
        <div className="font-mono text-[10px] text-[#ff0000] mt-1 truncate" title={data.error}>
          {data.error.slice(0, 60)}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-black !w-2 !h-2" />
    </div>
  );
}

export const executionDagNode = memo(ExecutionDagNodeRender);
