import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center text-sm font-bold whitespace-nowrap transition-all outline-none select-none cursor-pointer disabled:pointer-events-none font-[inherit]",
  {
    variants: {
      variant: {
        default:     "bg-[#0A0A0A] text-white border border-[#0A0A0A] hover:opacity-80 disabled:bg-[#0A0A0A] disabled:text-white disabled:opacity-40",
        outline:     "bg-transparent text-[#0A0A0A] border border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white disabled:opacity-40",
        secondary:   "bg-[#E8E8E8] text-[#0A0A0A] border border-[#D0D0D0] hover:bg-[#D0D0D0] disabled:opacity-40",
        ghost:       "bg-transparent text-[#0A0A0A] hover:bg-[#E8E8E8] disabled:opacity-40",
        destructive: "bg-[#FF3366] text-white border border-[#FF3366] hover:opacity-80 disabled:opacity-40",
        link:        "bg-transparent text-[#0A0A0A] underline-offset-4 hover:underline disabled:opacity-40",
      },
      size: {
        default: "h-9 px-5 gap-2",
        sm:      "h-7 px-3 text-xs",
        lg:      "h-11 px-7 text-base",
        icon:    "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  default:     { background: '#0A0A0A', color: '#ffffff', border: '1px solid #0A0A0A', fontWeight: 700 },
  outline:     { background: 'transparent', color: '#0A0A0A', border: '1px solid #0A0A0A', fontWeight: 700 },
  secondary:   { background: '#E8E8E8', color: '#0A0A0A', border: '1px solid #D0D0D0', fontWeight: 700 },
  ghost:       { background: 'transparent', color: '#0A0A0A', fontWeight: 700 },
  destructive: { background: '#FF3366', color: '#ffffff', border: '1px solid #FF3366', fontWeight: 700 },
  link:        { background: 'transparent', color: '#0A0A0A', fontWeight: 700 },
}

function Button({
  className,
  variant = "default",
  size = "default",
  style,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { style?: React.CSSProperties }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={{ ...VARIANT_STYLES[variant ?? 'default'], ...style }}
      {...props}
    />
  )
}

export { Button, buttonVariants }
