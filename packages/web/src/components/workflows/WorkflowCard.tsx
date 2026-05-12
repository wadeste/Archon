import { Link } from 'react-router';
import {
  Bug,
  GitMerge,
  Rocket,
  RefreshCw,
  TestTube,
  Workflow,
  Eye,
  Lightbulb,
  Wrench,
  Zap,
  Bot,
  Pencil,
  Play,
  type LucideIcon,
} from 'lucide-react';
import type { WorkflowDefinition } from '@/lib/api';
import {
  parseWorkflowDescription,
  getWorkflowDisplayName,
  getWorkflowCategory,
  getWorkflowTags,
  getWorkflowIconName,
  type WorkflowIconName,
} from '@/lib/workflow-metadata';

const ICON_MAP: Record<WorkflowIconName, LucideIcon> = {
  Bug,
  GitMerge,
  Rocket,
  RefreshCw,
  TestTube,
  Workflow,
  Eye,
  Lightbulb,
  Wrench,
  Zap,
  Bot,
};

interface WorkflowCardProps {
  workflow: WorkflowDefinition;
  isSelected: boolean;
  onToggle: (name: string) => void;
  onRun: (name: string) => void;
}

export function WorkflowCard({
  workflow,
  isSelected,
  onToggle,
  onRun,
}: WorkflowCardProps): React.ReactElement {
  const parsed = parseWorkflowDescription(workflow.description ?? '');
  const displayName = getWorkflowDisplayName(workflow.name);
  const category = getWorkflowCategory(workflow.name, workflow.description ?? '');
  const tags = getWorkflowTags(workflow.name, parsed, workflow.tags);
  const iconName = getWorkflowIconName(workflow.name, category);
  const CARD_ICON = ICON_MAP[iconName];

  const hasSections =
    parsed.whenToUse || parsed.triggers.length > 0 || parsed.does || parsed.constraints;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Select workflow: ${displayName}`}
      aria-pressed={isSelected}
      onClick={(): void => {
        onToggle(workflow.name);
      }}
      onKeyDown={(e): void => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(workflow.name);
        }
      }}
      className={`flex flex-col rounded-none border-[5px] p-4 transition-colors cursor-pointer h-full ${
        isSelected ? 'border-black bg-[#f0f0f0]' : 'border-black bg-white hover:bg-[#f0f0f0]'
      }`}
    >
      {/* Header: Icon + Name + ID */}
      <div className="flex items-start gap-3 mb-3 shrink-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-none border-[3px] border-black bg-white text-black">
          <CARD_ICON className="size-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base uppercase tracking-[0.05em] text-black leading-tight">
            {displayName}
          </h3>
          <p className="font-mono text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
            {workflow.name}
          </p>
        </div>
      </div>

      {/* Metadata sections */}
      {hasSections ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3 text-xs flex-1">
          {/* Left column: When to Use + Does */}
          <div className="space-y-2">
            {parsed.whenToUse && (
              <div>
                <span className="font-display text-[10px] uppercase tracking-[0.05em] text-black">
                  When to use
                </span>
                <p className="font-sans text-[var(--text-secondary)] mt-0.5 line-clamp-3 leading-relaxed">
                  {parsed.whenToUse}
                </p>
              </div>
            )}
            {parsed.does && (
              <div>
                <span className="font-display text-[10px] uppercase tracking-[0.05em] text-black">
                  Does
                </span>
                <p className="font-sans text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                  {parsed.does}
                </p>
              </div>
            )}
          </div>

          {/* Right column: Triggers + Constraints */}
          <div className="space-y-2">
            {parsed.triggers.length > 0 && (
              <div>
                <span className="font-display text-[10px] uppercase tracking-[0.05em] text-black">
                  Triggers
                </span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {parsed.triggers.slice(0, 4).map(trigger => (
                    <span
                      key={trigger}
                      className="inline-block rounded-none border-[1px] border-black bg-white px-1.5 py-0.5 font-mono text-[10px] text-black"
                    >
                      {trigger}
                    </span>
                  ))}
                  {parsed.triggers.length > 4 && (
                    <span className="inline-block font-mono text-[10px] text-[var(--text-tertiary)]">
                      +{parsed.triggers.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}
            {parsed.constraints && (
              <div>
                <span className="font-display text-[10px] uppercase tracking-[0.05em] text-[#ffa500]">
                  Not for
                </span>
                <p className="font-sans text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                  {parsed.constraints}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Fallback: raw description */
        workflow.description && (
          <p className="font-sans text-xs text-[var(--text-secondary)] mb-3 line-clamp-3 flex-1">
            {workflow.description}
          </p>
        )
      )}

      {/* Footer: Tags + Actions */}
      <div className="flex items-center justify-between pt-2 border-t-[3px] border-black mt-auto shrink-0">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="inline-block rounded-none border-[2px] border-black bg-white px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.045em] text-black"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Link
            to={`/workflows/builder?edit=${encodeURIComponent(workflow.name)}`}
            onClick={(e): void => {
              e.stopPropagation();
            }}
            className="p-1.5 rounded-none border-[2px] border-transparent text-black hover:border-black transition-colors"
            title="Edit in builder"
          >
            <Pencil className="size-3.5" />
          </Link>
          <button
            onClick={(e): void => {
              e.stopPropagation();
              onRun(workflow.name);
            }}
            className="inline-flex items-center gap-1 rounded-none border-[3px] border-black bg-black px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.125em] text-white transition-colors hover:bg-white hover:text-black active:border-[5px]"
            title="Configure and run workflow"
          >
            <Play className="size-3" />
            Run
          </button>
        </div>
      </div>
    </div>
  );
}
