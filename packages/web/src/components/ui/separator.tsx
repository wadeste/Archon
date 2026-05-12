'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Separator as SeparatorPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

const separatorVariants = cva('bg-black shrink-0 rounded-none', {
  variants: {
    weight: {
      thin: 'data-[orientation=horizontal]:h-px data-[orientation=vertical]:w-px',
      thick: 'data-[orientation=horizontal]:h-[3px] data-[orientation=vertical]:w-[3px]',
    },
  },
  defaultVariants: {
    weight: 'thin',
  },
});

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  weight,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> & VariantProps<typeof separatorVariants>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        separatorVariants({ weight }),
        'data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full',
        className
      )}
      {...props}
    />
  );
}

export { Separator, separatorVariants };
