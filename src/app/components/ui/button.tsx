import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground lg:hover:bg-primary/90",
        destructive:
          "bg-destructive text-white lg:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground lg:hover:bg-accent lg:hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:lg:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground lg:hover:bg-secondary/80",
        ghost:
          "lg:hover:bg-accent lg:hover:text-accent-foreground dark:lg:hover:bg-accent/50",
        /** 투명 배경 · 그림자 없음 — 오버레이/툴바용(accent 호버 없이 배경만 살짝) */
        toolbar:
          "bg-transparent text-current shadow-none border-0 lg:hover:bg-black/[0.06] dark:lg:hover:bg-white/10 lg:hover:text-current",
        link: "text-primary underline-offset-4 lg:hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon:
          "size-9 rounded-md pointer-coarse:size-11 pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:shrink-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };