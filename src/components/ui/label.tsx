import * as React from 'react'
import { Label as LabelPrimitive } from 'radix-ui'

import { cn } from '#/lib/utils.ts'

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        // Field labels wear the worksheet voice: small mono caps, the same
        // treatment as every other label in the app.
        'label-technical flex items-center gap-2 leading-none select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
