"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  RefreshCw,
  BarChart3,
  FolderKanban,
  Users,
  Settings,
  HelpCircle,
  Search,
  MoreVertical,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-gray-100 text-gray-900"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

interface SidebarProps {
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
}

export function Sidebar({ userName, userEmail, userImage }: SidebarProps) {
  const pathname = usePathname()

  const mainNavItems = [
    { href: "/app/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
    { href: "/app/lifecycle", icon: <RefreshCw className="h-4 w-4" />, label: "Lifecycle" },
    { href: "/app/analytics", icon: <BarChart3 className="h-4 w-4" />, label: "Analytics" },
    { href: "/app/projects", icon: <FolderKanban className="h-4 w-4" />, label: "Projects" },
    { href: "/app/team", icon: <Users className="h-4 w-4" />, label: "Team" },
  ]

  const bottomNavItems = [
    { href: "/app/settings", icon: <Settings className="h-4 w-4" />, label: "Settings" },
    { href: "/app/help", icon: <HelpCircle className="h-4 w-4" />, label: "Get Help" },
    { href: "/app/search", icon: <Search className="h-4 w-4" />, label: "Search" },
  ]

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <aside className="flex flex-col w-56 border-r border-gray-200 bg-white h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900">
          <span className="text-xs font-bold text-white">A</span>
        </div>
        <span className="font-semibold text-gray-900">Acme Inc.</span>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-2">
        <div className="text-xs font-medium text-gray-500 px-3 py-2">Home</div>
        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
      </div>

      {/* Bottom Navigation */}
      <div className="px-3 py-2">
        <nav className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
      </div>

      <Separator />

      {/* User Profile */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {userImage && <AvatarImage src={userImage} alt={userName || "User"} />}
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userName || "shadcn"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userEmail || "m@example.com"}
            </p>
          </div>
          <button className="p-1 rounded hover:bg-gray-100">
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    </aside>
  )
}
