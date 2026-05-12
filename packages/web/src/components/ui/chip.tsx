import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const chipVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-none border-[2px] font-sans uppercase whitespace-nowrap shrink-0 transition-colors w-fit',
  {
    variants: {
      variant: {
        filter:
          'px-3 py-1 text-[10px] font-semibold tracking-[0.05em] border-black bg-white text-black hover:bg-[#f0f0f0] data-[state=active]:bg-black data-[state=active]:text-white',
        status: 'px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.045em] bg-white',
      },
      color: {
        default: 'border-black text-black',
        success: 'border-[#008000] text-[#008000]',
        warning: 'border-[#ffa500] text-[#ffa500]',
        error: 'border-[#ff0000] text-[#ff0000]',
        info: 'border-[#0000ff] text-[#0000ff]',
      },
    },
    defaultVariants: {
      variant: 'status',
      color: 'default',
    },
  }
);

function Chip({
  className,
  variant,
  color,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof chipVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';
  return (
    <Comp
      data-slot="chip"
      data-variant={variant}
      data-color={color}
      className={cn(chipVariants({ variant, color }), className)}
      {...props}
    />
  );
}

export { Chip, chipVariants };
