import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const primaryCtaVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-[#7AA86E] text-white shadow-md hover:shadow-lg hover:scale-105",
        destructive: "bg-gradient-to-r from-destructive to-red-600 text-white shadow-md hover:shadow-lg",
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

export interface PrimaryCtaProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof primaryCtaVariants> {
  asChild?: boolean;
}

const PrimaryCTA = React.forwardRef<HTMLButtonElement, PrimaryCtaProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(primaryCtaVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
PrimaryCTA.displayName = "PrimaryCTA";

export { PrimaryCTA, primaryCtaVariants };
