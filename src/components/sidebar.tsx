"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { DropdownMenu, DropdownMenuItem } from "./ui/dropdown-menu";
import { Avatar } from "./ui/avatar";

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
        <Item href="/app/statements" label="Statements" />
      </nav>
      <Separator className="h-px w-full" />
      <div className="px-3 py-4">
        {user ? (
          <DropdownMenu
            trigger={
              <div className="flex items-center gap-2">
                <Avatar src={user.image} name={user.name} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{user.name || user.email}</div>
                  <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>
            }
          >
            <DropdownMenuItem>
              <Link href="/app/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenu>
        ) : (
          <Button className="w-full" onClick={onSignIn}>
            Sign in
          </Button>
        )}
      </div>
    </div>
  );
}
