import { Search } from 'lucide-react';
import type { DashboardCounts, CodebaseResponse, HealthResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

type DateRange = 'today' | '7d' | '30d' | 'all';

interface StatusSummaryBarProps {
  counts: DashboardCounts;
  activeFilter: string | null;
  onFilterChange: (status: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  projectFilter: string | null;
  onProjectFilterChange: (codebaseId: string | null) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  codebases: CodebaseResponse[] | undefined;
  health: HealthResponse | undefined;
}

const STATUS_CHIPS = ['running', 'paused', 'completed', 'failed', 'cancelled', 'pending'] as const;

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

export function StatusSummaryBar({
  counts,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  projectFilter,
  onProjectFilterChange,
  dateRange,
  onDateRangeChange,
  codebases,
  health,
}: StatusSummaryBarProps): React.ReactElement {
  return (
    <div className="rounded-none border-[5px] border-black bg-white p-4 space-y-3">
      {/* Row 1: Status chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={(): void => {
            onFilterChange(null);
          }}
          className={cn(
            'rounded-none border-[2px] border-black bg-white px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.05em] transition-colors',
            activeFilter === null ? 'bg-black text-white' : 'text-black hover:bg-[#f0f0f0]'
          )}
        >
          All: {String(counts.all)}
        </button>
        {STATUS_CHIPS.map(status => {
          const count = counts[status];
          const isActive = activeFilter === status;
          return (
            <button
              key={status}
              onClick={(): void => {
                onFilterChange(isActive ? null : status);
              }}
              className={cn(
                'rounded-none border-[2px] border-black bg-white px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.05em] transition-colors',
                isActive ? 'bg-black text-white' : 'text-black hover:bg-[#f0f0f0]',
                status === 'running' && count > 0 && !isActive && 'animate-pulse'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}: {String(count)}
            </button>
          );
        })}
      </div>

      {/* Row 2: Project dropdown, date range, search, capacity */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={projectFilter ?? ''}
          onChange={(e): void => {
            onProjectFilterChange(e.target.value || null);
          }}
          className="rounded-none border-[3px] border-black bg-[#f0f0f0] px-2 py-1.5 font-mono text-xs text-black outline-none focus-visible:border-[5px] focus-visible:-m-[2px]"
        >
          <option value="">All Projects</option>
          {codebases?.map(cb => (
            <option key={cb.id} value={cb.id}>
              {cb.name}
            </option>
          ))}
        </select>

        <select
          value={dateRange}
          onChange={(e): void => {
            onDateRangeChange(e.target.value as DateRange);
          }}
          className="rounded-none border-[3px] border-black bg-[#f0f0f0] px-2 py-1.5 font-mono text-xs text-black outline-none focus-visible:border-[5px] focus-visible:-m-[2px]"
        >
          {DATE_RANGE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e): void => {
              onSearchChange(e.target.value);
            }}
            placeholder="Search workflows..."
            className="w-full rounded-none border-[3px] border-black bg-[#f0f0f0] py-1.5 pl-7 pr-2 font-mono text-xs text-black placeholder:text-[var(--text-tertiary)] outline-none focus-visible:border-[5px] focus-visible:-m-[2px]"
          />
        </div>

        {health && (
          <span className="font-mono text-xs text-[var(--text-tertiary)] shrink-0">
            Capacity: {String(health.concurrency.active)}/{String(health.concurrency.maxConcurrent)}{' '}
            active
          </span>
        )}
      </div>
    </div>
  );
}
