import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full min-w-0 rounded-none border-[3px] border-black bg-[#f0f0f0] px-3 py-2 font-mono text-[15px] leading-[1.5] text-black outline-none transition-colors',
        'placeholder:text-[var(--text-tertiary)] selection:bg-black selection:text-white',
        'hover:bg-[#e8e8e8]',
        // The 5px focus border can shift layout by 2px; -m-[2px] keeps the
        // outer box size constant when the border thickens.
        'focus-visible:border-[5px] focus-visible:-m-[2px]',
        'aria-invalid:border-[#ff0000]',
        'disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:border-[#cccccc] disabled:text-[var(--text-tertiary)]',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-black',
        className
      )}
      {...props}
    />
  );
}

export { Input };
