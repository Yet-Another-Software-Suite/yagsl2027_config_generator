'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // layout
        'bg-muted text-muted-foreground flex h-11 w-full items-center justify-start gap-1 rounded-lg p-1',

        // scrolling behavior
        'overflow-x-auto md:overflow-x-visible',
        'scroll-smooth scrollbar-none',

        // snapping (mobile only)
        'snap-x snap-mandatory md:snap-none',

        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // base
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap',
        'rounded-md px-4 py-2 text-sm font-medium transition',

        // colors
        'text-foreground dark:text-muted-foreground',
        'data-[state=active]:bg-background data-[state=active]:text-foreground',
        'data-[state=active]:shadow-sm',

        // focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',

        // disabled
        'disabled:pointer-events-none disabled:opacity-50',

        // icons
        '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',

        // snap only matters on mobile
        'snap-start md:snap-none',

        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
