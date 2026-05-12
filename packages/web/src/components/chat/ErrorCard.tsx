import { AlertCircle } from 'lucide-react';
import type { ErrorDisplay } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ErrorCardProps {
  error: ErrorDisplay;
  onRetry?: () => void;
}

export function ErrorCard({ error, onRetry }: ErrorCardProps): React.ReactElement {
  return (
    <div className="rounded-none border-[3px] border-[#ff0000] bg-white p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff0000]" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-sans text-sm text-black">{error.message}</p>
            <span
              className={cn(
                'shrink-0 rounded-none border-[2px] bg-white px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.045em]',
                error.classification === 'transient'
                  ? 'border-[#ffa500] text-[#ffa500]'
                  : 'border-[#ff0000] text-[#ff0000]'
              )}
            >
              {error.classification === 'transient' ? 'Transient' : 'Fatal'}
            </span>
          </div>
          {error.suggestedActions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {error.suggestedActions.map((action, i) => (
                <button
                  key={i}
                  onClick={action === 'Retry' ? onRetry : undefined}
                  className="font-sans text-xs font-semibold uppercase tracking-[0.05em] text-black hover:underline"
                >
                  {action}
                </button>
              ))}
            </div>
          )}
          {error.classification === 'transient' && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 rounded-none border-[3px] border-black bg-[#ff0000] px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.125em] text-white transition-colors hover:bg-black hover:text-[#ff0000] active:border-[5px]"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
