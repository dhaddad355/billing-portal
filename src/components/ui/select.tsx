"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative inline-block">
    <select
      ref={ref}
      className={cn(
        "h-9 w-full appearance-none rounded-md border border-gray-200 bg-transparent pl-3 pr-8 py-2 text-sm shadow-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
  </div>
))
Select.displayName = "Select"

export { Select }
