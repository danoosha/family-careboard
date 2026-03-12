'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Calendar, Shield, FileText, UserPlus, FlaskConical, Paperclip, ClipboardList } from 'lucide-react'

const options = [
  { label: 'Appointment', icon: Calendar, href: '/add/appointment' },
  { label: 'Preventive check', icon: Shield, href: '/add/preventive' },
  { label: 'Prescription', icon: ClipboardList, href: '/add/prescription' },
  { label: 'Referral', icon: FileText, href: '/add/referral' },
  { label: 'Test result', icon: FlaskConical, href: '/add/test-result' },
  { label: 'Doctor', icon: UserPlus, href: '/add/doctor' },
  { label: 'Document', icon: Paperclip, href: '/add/document' },
]

export default function AddFab() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col gap-2 mb-1 animate-slide-up">
            {options.map(({ label, icon: Icon, href }) => (
              <button
                key={label}
                onClick={() => { setOpen(false); router.push(href) }}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 card-shadow text-sm font-medium text-stone-700 active:scale-95 transition-transform"
              >
                <Icon className="w-4 h-4 text-stone-500" />
                {label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setOpen(prev => !prev)}
          className="w-14 h-14 rounded-full bg-stone-800 text-white flex items-center justify-center card-shadow active:scale-95 transition-all"
        >
          {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>
    </>
  )
}
