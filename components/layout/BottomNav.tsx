"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface PersonBasic {
  id: string;
  display_name: string;
  color_hex?: string | null;
}

const NAV_ITEMS = [
  { href: "/",              icon: "🏠", label: "Home",     hasSub: false },
  { href: "/people",        icon: "👥", label: "People",   hasSub: true  },
  { href: "/doctors",       icon: "🩺", label: "Doctors",  hasSub: false },
  { href: "/care-journeys", icon: "📋", label: "Journeys", hasSub: false },
  { href: "/chat",          icon: "💬", label: "Chat",     hasSub: false },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [people, setPeople] = useState<PersonBasic[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const tapRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({ count: 0, timer: null });

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  // Load people for sub-nav
  useEffect(() => {
    const sb = createClient();
    sb.from("people")
      .select("id, display_name, color_hex")
      .order("sort_order")
      .then(({ data }) => setPeople((data as PersonBasic[]) ?? []));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPeopleOpen(false);
      }
    }
    if (peopleOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [peopleOpen]);

  function handlePeopleTap() {
    const tap = tapRef.current;
    tap.count += 1;

    if (tap.timer) clearTimeout(tap.timer);

    if (tap.count >= 2) {
      // Double tap → go to /people full page
      tap.count = 0;
      setPeopleOpen(false);
      window.location.href = "/people";
      return;
    }

    // Single tap → toggle sub-nav
    tap.timer = setTimeout(() => {
      tap.count = 0;
      if (isActive("/people")) {
        // Already on people → go to full page
        window.location.href = "/people";
      } else {
        setPeopleOpen((v) => !v);
      }
    }, 250);
  }

  return (
    <>
      {/* People sub-nav popup */}
      {peopleOpen && (
        <div
          ref={menuRef}
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+8px)] left-0 right-0 z-40 flex justify-center px-4"
        >
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden w-full max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">People</span>
              <Link
                href="/people"
                onClick={() => setPeopleOpen(false)}
                className="text-xs font-semibold text-[#3A3370]"
              >
                See all →
              </Link>
            </div>
            {/* Person list */}
            {people.map((p) => (
              <Link
                key={p.id}
                href={`/people/${p.id}`}
                onClick={() => setPeopleOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0"
              >
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.color_hex ?? "#C7E6A3" }}
                />
                <span className="text-sm font-semibold text-heading">{p.display_name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {peopleOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setPeopleOpen(false)}
        />
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-stone-100 pb-safe">
        <div className="flex items-stretch max-w-lg mx-auto">
          {NAV_ITEMS.map(({ href, icon, label, hasSub }) => {
            const active = isActive(href);

            if (hasSub) {
              return (
                <button
                  key={href}
                  onClick={handlePeopleTap}
                  className={`flex flex-col items-center justify-center flex-1 pt-2 pb-1 gap-0.5 transition-colors relative ${
                    active || peopleOpen ? "text-[#3A3370]" : "text-stone-400"
                  }`}
                >
                  <span className="text-[18px] leading-none">{icon}</span>
                  <span className={`text-[9px] font-semibold leading-tight tracking-wide ${
                    active || peopleOpen ? "text-[#3A3370]" : "text-stone-400"
                  }`}>
                    {label}
                  </span>
                  {(active || peopleOpen) && (
                    <span className="absolute bottom-0 w-5 h-0.5 rounded-full bg-[#3A3370]" />
                  )}
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center flex-1 pt-2 pb-1 gap-0.5 transition-colors relative ${
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
    </>
  );
}
