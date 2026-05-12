import { cn } from '@/lib/utils';

interface LockIndicatorProps {
  locked: boolean;
  queuePosition?: number;
}

export function LockIndicator({ locked, queuePosition }: LockIndicatorProps): React.ReactElement {
  return (
    <div
      className={cn('overflow-hidden transition-all duration-300', locked ? 'h-7' : 'h-0')}
      aria-hidden={!locked}
    >
      <div className="flex h-7 items-center gap-2 border-t-[3px] border-black bg-[#ffa500] px-4">
        <div className="h-2 w-2 animate-pulse rounded-none border-[2px] border-black bg-black" />
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.05em] text-black">
          Agent is working...
          {queuePosition !== undefined && queuePosition > 0 && (
            <span className="ml-1">Position {String(queuePosition)} in queue</span>
          )}
        </span>
      </div>
    </div>
  );
}
