import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/utils';

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-2', className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      // INTENTIONAL: rounded-full is THE one radius exception in the entire
      // RawBlock design system. Do not "fix" this to square — the radio
      // pattern is the canonical visual signal for a single-choice control.
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded-full border-[3px] border-black bg-white outline-none transition-colors',
        'hover:bg-[#f0f0f0]',
        'focus-visible:border-[5px]',
        'disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:border-[#cccccc]',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center"
      >
        <span className="block size-2.5 rounded-full bg-black" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
