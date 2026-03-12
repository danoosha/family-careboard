'use client'
import BottomNav from './BottomNav'
import AddFab from '@/components/dashboard/AddFab'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      <main className="flex-1 pb-24 overflow-y-auto">
        {children}
      </main>
      <AddFab />
      <BottomNav />
    </div>
  )
}
