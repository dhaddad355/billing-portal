import * as React from "react";

export function Separator({ className = "" }: { className?: string }) {
  return <div className={`shrink-0 bg-border ${className}`} />;
}
