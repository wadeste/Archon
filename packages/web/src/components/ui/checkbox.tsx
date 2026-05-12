import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { cn } from '@/lib/utils';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded-none border-[3px] border-black bg-white text-white outline-none transition-colors',
        'hover:bg-[#f0f0f0]',
        'data-[state=checked]:bg-black data-[state=checked]:text-white',
        'data-[state=indeterminate]:bg-black data-[state=indeterminate]:text-white',
        'focus-visible:border-[5px]',
        'disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:border-[#cccccc] disabled:text-[#cccccc]',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="size-3"
        >
          <path
            d="M3 8.5l3 3 7-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
