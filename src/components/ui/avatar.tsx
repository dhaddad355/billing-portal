import * as React from "react";

type AvatarProps = {
  src?: string | null;
  alt?: string;
  name?: string | null;
  className?: string;
};

export function Avatar({ src, alt = "", name, className = "" }: AvatarProps) {
  return (
    <div className={`inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-medium text-muted-foreground">
          {name?.slice(0, 2)?.toUpperCase() || ""}
        </span>
      )}
    </div>
  );
}
