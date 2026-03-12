"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  MessageCircle,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Home",      icon: LayoutDashboard },
  { href: "/people",     label: "People",    icon: Users },
  { href: "/doctors",    label: "Doctors",   icon: Stethoscope },
  { href: "/documents",  label: "Documents", icon: FileText },
  { href: "/chat",       label: "Chat",      icon: MessageCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-2xl transition-all duration-150 ${
                active
                  ? "text-[#3A3370]"
                  : "text-muted"
              }`}
            >
              <span
                className={`p-1.5 rounded-xl transition-all duration-150 ${
                  active ? "bg-[#EAE8F7]" : ""
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </span>
              <span className={`text-[10px] font-semibold ${active ? "text-[#3A3370]" : "text-muted"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
