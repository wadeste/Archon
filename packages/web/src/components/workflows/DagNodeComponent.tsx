import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { DagNode } from '@/lib/api';
import { cn } from '@/lib/utils';

export type NodeType = 'command' | 'prompt' | 'bash' | 'loop';

export interface DagNodeData extends DagNode {
  /** For command nodes: the command name. For prompt nodes: display label ("Prompt"). For bash: display label ("Shell"). */
  label: string;
  nodeType: NodeType;
  promptText?: string;
  bashScript?: string;
  bashTimeout?: number;
  /** Required by React Flow's Node<T> constraint — do not rely on this for typed access. */
  [key: string]: unknown;
}

export type DagFlowNode = Node<DagNodeData>;

const TYPE_CONFIG = {
  command: {
    badge: 'CMD',
    stripeColor: 'bg-black',
    badgeBg: 'bg-white border-[2px] border-black',
    badgeText: 'text-black',
  },
  prompt: {
    badge: 'PROMPT',
    stripeColor: 'bg-[#ff0000]',
    badgeBg: 'bg-white border-[2px] border-[#ff0000]',
    badgeText: 'text-[#ff0000]',
  },
  bash: {
    badge: 'BASH',
    stripeColor: 'bg-[#ffa500]',
    badgeBg: 'bg-white border-[2px] border-[#ffa500]',
    badgeText: 'text-[#ffa500]',
  },
  loop: {
    badge: 'LOOP',
    stripeColor: 'bg-[#008000]',
    badgeBg: 'bg-white border-[2px] border-[#008000]',
    badgeText: 'text-[#008000]',
  },
} as const;

function getContentPreview(data: DagNodeData): string {
  switch (data.nodeType) {
    case 'command':
      return data.label;
    case 'prompt':
      return data.promptText?.split('\n')[0] ?? '';
    case 'bash':
      return data.bashScript?.split('\n')[0] ?? '';
    case 'loop':
      return data.loop?.prompt.split('\n')[0] ?? '';
  }
}

function MetadataPill({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-none border-[1px] border-black bg-[#f0f0f0] font-mono text-[9px] text-black">
      {children}
    </span>
  );
}

function DagNodeRender({ data, selected }: NodeProps<DagFlowNode>): React.ReactElement {
  const config = TYPE_CONFIG[data.nodeType];
  const preview = getContentPreview(data);
  const hasPills =
    data.model ||
    data.output_format ||
    data.when ||
    (data.trigger_rule && data.trigger_rule !== 'all_success') ||
    (data.skills && data.skills.length > 0) ||
    data.mcp;

  return (
    <div
      className={cn(
        'w-[180px] bg-white border-[3px] border-black rounded-none overflow-hidden cursor-pointer transition-all flex',
        selected && 'border-[5px]'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-black !w-2 !h-2" />

      {/* Left color stripe */}
      <div className={cn('w-[5px] shrink-0', config.stripeColor)} />

      {/* Content area */}
      <div className="flex-1 min-w-0 px-2.5 py-2">
        {/* Header: badge + label */}
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className={cn(
              'font-display text-[9px] uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-none shrink-0',
              config.badgeBg,
              config.badgeText
            )}
          >
            {config.badge}
          </span>
          <span className="font-sans text-xs font-semibold text-black truncate">{data.label}</span>
        </div>

        {/* Content preview */}
        {preview && (
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] truncate mb-1">
            {preview}
          </div>
        )}

        {/* Metadata pills */}
        {hasPills && (
          <div className="flex flex-wrap gap-1">
            {data.model && <MetadataPill>{data.model}</MetadataPill>}
            {data.output_format && <MetadataPill>{'{}'} JSON</MetadataPill>}
            {data.when && <MetadataPill>when</MetadataPill>}
            {data.trigger_rule && data.trigger_rule !== 'all_success' && (
              <MetadataPill>{data.trigger_rule}</MetadataPill>
            )}
            {data.skills && data.skills.length > 0 && <MetadataPill>skills</MetadataPill>}
            {data.mcp && <MetadataPill>mcp</MetadataPill>}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-black !w-2 !h-2" />
    </div>
  );
}

// memo() for React Flow performance; exported as a named function component
export const dagNodeComponent = memo(DagNodeRender);
