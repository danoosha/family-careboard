"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ProfileSectionProps {
  title: string;
  icon: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function ProfileSection({
  title,
  icon,
  count,
  defaultOpen = false,
  children,
}: ProfileSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-2">
      {/* Section toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-1 py-0.5 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-bold text-heading">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-muted">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Content */}
      {open && <div>{children}</div>}
    </div>
  );
}
