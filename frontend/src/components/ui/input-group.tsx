import * as React from "react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ---------------------------------------------------------------------------
// InputGroup — wraps an input with inline addons / buttons
// ---------------------------------------------------------------------------

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "relative flex items-center",
        "[&>[data-slot=input]]:pr-9",
        className
      )}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// InputGroupInput — the actual <input> inside the group
// ---------------------------------------------------------------------------

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => (
  <Input ref={ref} className={cn("peer", className)} {...props} />
))
InputGroupInput.displayName = "InputGroupInput"

// ---------------------------------------------------------------------------
// InputGroupAddon — positioned container for trailing icons / buttons
// ---------------------------------------------------------------------------

function InputGroupAddon({
  className,
  align = "inline-end",
  ...props
}: React.ComponentProps<"div"> & { align?: "inline-start" | "inline-end" }) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(
        "pointer-events-none absolute inset-y-0 flex items-center",
        align === "inline-end" ? "right-0 pr-1" : "left-0 pl-1",
        "[&>*]:pointer-events-auto",
        className
      )}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// InputGroupButton — small icon button inside the addon
// ---------------------------------------------------------------------------

const InputGroupButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "ghost", size = "icon-xs", ...props }, ref) => (
    <Button
      ref={ref}
      type="button"
      variant={variant}
      size={size}
      className={cn("shrink-0", className)}
      {...props}
    />
  )
)
InputGroupButton.displayName = "InputGroupButton"

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
}
