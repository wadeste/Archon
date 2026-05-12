import * as React from 'react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul data-slot="list" className={cn('flex flex-col list-none m-0 p-0', className)} {...props} />
  );
}

function ListItem({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'li'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'li';
  return (
    <Comp
      data-slot="list-item"
      className={cn(
        'flex items-center gap-3 px-3 py-3 font-sans text-base text-black border-b-[3px] border-black last:border-b-0 cursor-pointer transition-colors',
        'hover:underline',
        'data-[active=true]:bg-black data-[active=true]:text-white data-[active=true]:no-underline',
        className
      )}
      {...props}
    />
  );
}

export { List, ListItem };
