import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center text-sm font-bold whitespace-nowrap transition-all outline-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-40 font-[inherit]",
  {
    variants: {
      variant: {
        default:     "bg-[#0A0A0A] text-white border border-[#0A0A0A] hover:opacity-80",
        outline:     "bg-transparent text-[#0A0A0A] border border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white",
        secondary:   "bg-[#E8E8E8] text-[#0A0A0A] border border-[#D0D0D0] hover:bg-[#D0D0D0]",
        ghost:       "bg-transparent text-[#0A0A0A] hover:bg-[#E8E8E8]",
        destructive: "bg-[#FF3366] text-white border border-[#FF3366] hover:opacity-80",
        link:        "bg-transparent text-[#0A0A0A] underline-offset-4 hover:underline",
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

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
