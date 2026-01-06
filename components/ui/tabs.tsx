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
        // Base Layout
        'inline-flex h-auto w-full items-center justify-start gap-1 rounded-lg bg-muted p-1 text-muted-foreground',
        
        // MOBILE FIX: 
        // 1. overflow-x-auto: Enables horizontal scrolling
        // 2. flex-nowrap: Forces items to stay in one line
        // 3. no-scrollbar: Hides the ugly scrollbar (cleaner look)
        'overflow-x-auto flex-nowrap',
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        
        className
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
        // Base
        'inline-flex items-center justify-center',
        'rounded-md px-3 py-2 text-sm font-medium',

        // CRITICAL FIX: 
        // flex-shrink-0 prevents the buttons from being "squished"
        'flex-shrink-0',
        
        // Text
        'whitespace-nowrap text-foreground dark:text-muted-foreground',
        'data-[state=active]:bg-background data-[state=active]:text-foreground',
        'data-[state=active]:shadow-sm',

        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',

        // Disabled
        'disabled:pointer-events-none disabled:opacity-50',

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
