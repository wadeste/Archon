import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-24 w-full rounded-none border-[3px] border-black bg-[#f0f0f0] px-3 py-2.5 font-mono text-[15px] leading-[1.5] text-black outline-none transition-colors resize-y',
        'placeholder:text-[var(--text-tertiary)] selection:bg-black selection:text-white',
        'hover:bg-[#e8e8e8]',
        // -m-[2px] compensates for the 2px size growth on focus.
        'focus-visible:border-[5px] focus-visible:-m-[2px]',
        'aria-invalid:border-[#ff0000]',
        'disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:border-[#cccccc] disabled:text-[var(--text-tertiary)]',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
