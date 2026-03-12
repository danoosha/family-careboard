'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Stethoscope, FileText, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/people', label: 'People', icon: Users },
  { href: '/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/documents', label: 'Docs', icon: FileText },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-100 pb-safe">
      <div className="flex items-center max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={cn(
              'flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors',
              active ? 'text-stone-800' : 'text-stone-400'
            )}>
              <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-medium', active ? 'text-stone-800' : 'text-stone-400')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
