import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-sans text-sm font-semibold uppercase tracking-[0.125em] transition-colors disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none disabled:bg-[#f0f0f0] disabled:text-[var(--text-tertiary)] disabled:border-[#cccccc] disabled:cursor-not-allowed aria-invalid:border-[#ff0000]",
  {
    variants: {
      variant: {
        default:
          'bg-black text-white border-[3px] border-black hover:bg-white hover:text-black active:border-[5px]',
        secondary:
          'bg-white text-black border-[3px] border-black hover:bg-black hover:text-white active:border-[5px]',
        outline:
          'bg-white text-black border-[3px] border-black hover:bg-black hover:text-white active:border-[5px]',
        ghost:
          'bg-transparent text-black border-0 hover:text-[#0000ff] hover:underline underline-offset-4',
        destructive:
          'bg-[#ff0000] text-white border-[3px] border-black hover:bg-black hover:text-[#ff0000] active:border-[5px]',
        link: 'text-[#0000ff] underline underline-offset-4 border-0 bg-transparent normal-case tracking-normal',
      },
      size: {
        default: 'h-11 px-6 py-2.5 text-sm',
        xs: "h-6 gap-1 px-2 text-[10px] has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 px-4 py-1.5 text-xs gap-1.5',
        lg: 'h-14 px-10 py-4 text-lg',
        icon: 'h-11 w-11 p-0',
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
