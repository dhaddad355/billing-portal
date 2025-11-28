"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import * as React from "react";

type SidebarProps = {
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
};

export function Sidebar({ user, onSignIn, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  const Item = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href || pathname?.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`flex items-center rounded-md px-3 py-2 text-sm hover:bg-muted ${
          active ? "bg-muted text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };

  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="px-3 py-4">
        <Link href="/app/dashboard" className="text-lg font-semibold">
          Billing Portal
        </Link>
      </div>
      <Separator className="h-px w-full" />
      <nav className="flex-1 space-y-1 px-3 py-4">
        <Item href="/app/dashboard" label="Dashboard" />
        <Item href="/app/settings" label="Settings" />
      </nav>
      <Separator className="h-px w-full" />
      <div className="px-3 py-4">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user.name || user.email}</div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <button
              type="button"
              aria-label="User actions"
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setShowLogoutModal(true)}
            >
              {/* three dots icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M6 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
              </svg>
            </button>
          </div>
        ) : (
          <Button className="w-full" onClick={onSignIn}>
            Sign in
          </Button>
        )}

        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogoutModal(false)} />
            <div className="z-10 w-full max-w-sm rounded-md border bg-popover p-4 text-popover-foreground shadow-lg">
              <h2 className="mb-2 text-base font-semibold">Sign out</h2>
              <p className="mb-4 text-sm text-muted-foreground">Are you sure you want to sign out?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowLogoutModal(false);
                    onSignOut?.();
                  }}
                >
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
