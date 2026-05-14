import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2",
          "text-[16px] sm:text-sm font-medium text-foreground",
          "placeholder:text-muted-foreground/50 placeholder:font-normal",
          "ring-offset-background",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:border-honey-400 focus-visible:ring-2 focus-visible:ring-honey-300/50 focus-visible:ring-offset-0",
          "hover:border-cream-400",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-cream-100",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
