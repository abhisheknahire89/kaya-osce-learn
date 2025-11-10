import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const secondaryCtaVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] active:scale-95",
  {
    variants: {
      variant: {
        default: "border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:shadow-md",
        outline: "border-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2",
        lg: "h-14 px-8 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface SecondaryCtaProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof secondaryCtaVariants> {
  asChild?: boolean;
}

const SecondaryCTA = React.forwardRef<HTMLButtonElement, SecondaryCtaProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(secondaryCtaVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
SecondaryCTA.displayName = "SecondaryCTA";

export { SecondaryCTA, secondaryCtaVariants };
