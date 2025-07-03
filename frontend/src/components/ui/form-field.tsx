import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useUniqueId } from "@/hooks/useAccessibility"

interface FormFieldProps {
  children?: React.ReactNode
  className?: string
}

interface FormFieldItemProps {
  className?: string
  children: React.ReactNode
}

interface FormFieldLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  required?: boolean
  optional?: boolean
}

interface FormFieldControlProps {
  children: React.ReactElement
}

interface FormFieldDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

interface FormFieldMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  type?: 'error' | 'warning' | 'info'
  children?: React.ReactNode
}

// Context for sharing field IDs between components
const FormFieldContext = React.createContext<{
  fieldId: string
  descriptionId: string
  messageId: string
  isInvalid: boolean
  setIsInvalid: (invalid: boolean) => void
}>({
  fieldId: '',
  descriptionId: '',
  messageId: '',
  isInvalid: false,
  setIsInvalid: () => {}
})

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, ...props }, ref) => {
    const fieldId = useUniqueId('field')
    const descriptionId = useUniqueId('description')
    const messageId = useUniqueId('message')
    const [isInvalid, setIsInvalid] = React.useState(false)

    return (
      <FormFieldContext.Provider value={{
        fieldId,
        descriptionId,
        messageId,
        isInvalid,
        setIsInvalid
      }}>
        <div
          ref={ref}
          className={cn("space-y-2", className)}
          {...props}
        >
          {children}
        </div>
      </FormFieldContext.Provider>
    )
  }
)
FormField.displayName = "FormField"

const FormFieldItem = React.forwardRef<HTMLDivElement, FormFieldItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    )
  }
)
FormFieldItem.displayName = "FormFieldItem"

const FormFieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FormFieldLabelProps
>(({ className, required, optional, children, ...props }, ref) => {
  const { fieldId } = React.useContext(FormFieldContext)

  let variant: "default" | "required" | "optional" = "default"
  if (required) variant = "required"
  if (optional) variant = "optional"

  return (
    <Label
      ref={ref}
      className={cn("", className)}
      htmlFor={fieldId}
      variant={variant}
      {...props}
    >
      {children}
    </Label>
  )
})
FormFieldLabel.displayName = "FormFieldLabel"

const FormFieldControl = React.forwardRef<HTMLDivElement, FormFieldControlProps>(
  ({ children }, ref) => {
    const { fieldId, descriptionId, messageId, isInvalid } = React.useContext(FormFieldContext)

    // Clone the child element to add proper accessibility attributes
    const child = React.cloneElement(children, {
      id: fieldId,
      'aria-describedby': [
        children.props['aria-describedby'],
        descriptionId,
        messageId
      ].filter(Boolean).join(' ') || undefined,
      'aria-invalid': isInvalid || children.props['aria-invalid'],
      ...children.props
    })

    return <div ref={ref}>{child}</div>
  }
)
FormFieldControl.displayName = "FormFieldControl"

const FormFieldDescription = React.forwardRef<HTMLParagraphElement, FormFieldDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    const { descriptionId } = React.useContext(FormFieldContext)

    return (
      <p
        ref={ref}
        id={descriptionId}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
FormFieldDescription.displayName = "FormFieldDescription"

const FormFieldMessage = React.forwardRef<HTMLParagraphElement, FormFieldMessageProps>(
  ({ className, type = 'error', children, ...props }, ref) => {
    const { messageId, setIsInvalid } = React.useContext(FormFieldContext)

    // Update invalid state when error message is present
    React.useEffect(() => {
      if (type === 'error' && children) {
        setIsInvalid(true)
      } else if (type === 'error' && !children) {
        setIsInvalid(false)
      }
    }, [children, type, setIsInvalid])

    if (!children) return null

    const messageStyles = {
      error: "text-destructive",
      warning: "text-warning",
      info: "text-muted-foreground"
    }

    return (
      <p
        ref={ref}
        id={messageId}
        className={cn(
          "text-sm font-medium",
          messageStyles[type],
          className
        )}
        role={type === 'error' ? 'alert' : 'status'}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        {...props}
      >
        {children}
      </p>
    )
  }
)
FormFieldMessage.displayName = "FormFieldMessage"

// Convenience component that combines commonly used form elements
interface AccessibleInputProps extends React.ComponentPropsWithoutRef<typeof Input> {
  label: string
  description?: string
  error?: string
  warning?: string
  info?: string
  required?: boolean
  optional?: boolean
}

const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ 
    label, 
    description, 
    error, 
    warning, 
    info, 
    required, 
    optional, 
    className,
    ...props 
  }, ref) => {
    return (
      <FormField>
        <FormFieldItem>
          <FormFieldLabel required={required} optional={optional}>
            {label}
          </FormFieldLabel>
          <FormFieldControl>
            <Input
              ref={ref}
              className={className}
              required={required}
              {...props}
            />
          </FormFieldControl>
          {description && (
            <FormFieldDescription>
              {description}
            </FormFieldDescription>
          )}
          {error && (
            <FormFieldMessage type="error">
              {error}
            </FormFieldMessage>
          )}
          {warning && (
            <FormFieldMessage type="warning">
              {warning}
            </FormFieldMessage>
          )}
          {info && (
            <FormFieldMessage type="info">
              {info}
            </FormFieldMessage>
          )}
        </FormFieldItem>
      </FormField>
    )
  }
)
AccessibleInput.displayName = "AccessibleInput"

export {
  FormField,
  FormFieldItem,
  FormFieldLabel,
  FormFieldControl,
  FormFieldDescription,
  FormFieldMessage,
  AccessibleInput
}