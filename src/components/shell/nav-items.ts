import {
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  RefreshCw,
  Settings,
  Tags,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type NavKey =
  "dashboard" | "trends" | "studio" | "pricing" | "content" | "salla" | "billing" | "settings";

export const NAV_ITEMS: readonly { key: NavKey; href: `/${NavKey}`; icon: LucideIcon }[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "trends", href: "/trends", icon: TrendingUp },
  { key: "studio", href: "/studio", icon: Package },
  { key: "pricing", href: "/pricing", icon: Tags },
  { key: "content", href: "/content", icon: FileText },
  { key: "salla", href: "/salla", icon: RefreshCw },
  { key: "billing", href: "/billing", icon: CreditCard },
  { key: "settings", href: "/settings", icon: Settings },
];
