'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface FormShellProps {
  title: string
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
  loading?: boolean
  submitLabel?: string
}

export default function FormShell({ title, children, onSubmit, loading, submitLabel = 'Save' }: FormShellProps) {
  const router = useRouter()
  return (
    <div className="min-h-dvh bg-[#f8f4ef] flex flex-col max-w-lg mx-auto">
      <div className="px-4 pt-10 pb-4 bg-white border-b border-stone-100">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-3">
          <ChevronLeft className="w-4 h-4" /> Cancel
        </button>
        <h1 className="font-display text-xl text-stone-800">{title}</h1>
      </div>
      <form onSubmit={onSubmit} className="flex-1 px-4 pt-4 pb-8 space-y-4">
        {children}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-stone-800 text-white font-medium hover:bg-stone-700 disabled:opacity-50 transition mt-4"
        >
          {loading ? 'Saving…' : submitLabel}
        </button>
      </form>
    </div>
  )
}
