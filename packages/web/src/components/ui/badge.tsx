import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-none border-[2px] px-2.5 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-[0.045em] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors',
  {
    variants: {
      variant: {
        default: 'border-black bg-white text-black',
        secondary: 'border-black bg-white text-black',
        outline: 'border-black bg-white text-black',
        ghost: 'border-transparent bg-transparent text-black',
        link: 'border-transparent bg-transparent text-[#0000ff] underline underline-offset-4 normal-case tracking-normal',
        success: 'border-[#008000] bg-white text-[#008000]',
        warning: 'border-[#ffa500] bg-white text-[#ffa500]',
        destructive: 'border-[#ff0000] bg-white text-[#ff0000]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
