"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",             icon: "🏠", label: "Home"     },
  { href: "/people",       icon: "👥", label: "People"   },
  { href: "/doctors",      icon: "🩺", label: "Doctors"  },
  { href: "/care-journeys",icon: "📋", label: "Journeys" },
  { href: "/chat",         icon: "💬", label: "Chat"     },
];

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-stone-100 pb-safe">
      <div className="flex items-stretch max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 pt-2 pb-1 gap-0.5 transition-colors ${
                active ? "text-[#3A3370]" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <span className="text-[18px] leading-none">{icon}</span>
              <span className={`text-[9px] font-semibold leading-tight tracking-wide ${
                active ? "text-[#3A3370]" : "text-stone-400"
              }`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-5 h-0.5 rounded-full bg-[#3A3370]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
