import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-[#3B2418] hover:bg-[#8B5738] text-white shadow-sm",
        primary: "bg-[#3B2418] hover:bg-[#8B5738] text-white shadow-sm",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
        danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
        outline:
          "border border-[#E4D5C0] bg-transparent hover:bg-[#F5EBDD] text-[#261A13]",
        secondary:
          "bg-[#8B5738] text-white hover:bg-[#5C3A25] shadow-sm",
        ghost:
          "hover:bg-[#F5EBDD] text-[#261A13]",
        link: "text-[#8B5738] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-xs has-[>svg]:px-2.5",
        md: "h-10 gap-2 rounded-xl px-4 py-2 text-sm",
        lg: "h-11 rounded-xl px-6 text-sm font-semibold has-[>svg]:px-4",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLoading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      )}
      <Slot.Slottable>{children}</Slot.Slottable>
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
