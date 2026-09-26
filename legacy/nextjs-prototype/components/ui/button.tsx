import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" && "bg-brand text-white hover:bg-brand-dark",
          variant === "secondary" &&
            "bg-white text-brand border border-brand hover:bg-brand-light",
          variant === "ghost" && "text-ink-muted hover:bg-bg",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
