"use client";

import BottomNav from "./BottomNav";
import AddMenu from "@/components/forms/AddMenu";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      <main className="flex-1 overflow-y-auto bottom-nav-clearance">
        {children}
      </main>
      <BottomNav />
      <AddMenu />
    </div>
  );
}
