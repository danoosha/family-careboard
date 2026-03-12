'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { getDoctors } from '@/lib/queries'
import type { Doctor } from '@/types'
import { Stethoscope, Phone, Mail, MapPin } from 'lucide-react'

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoctors().then(setDoctors).finally(() => setLoading(false))
  }, [])

  if (loading) return <AppShell><PageLoader /></AppShell>

  return (
    <AppShell>
      <div className="px-4 pt-12 pb-4">
        <h1 className="font-display text-2xl text-stone-800">Doctors</h1>
        <p className="text-sm text-stone-400 mt-0.5">{doctors.length} healthcare providers</p>
      </div>

      <div className="px-4 space-y-3">
        {doctors.length === 0 ? (
          <EmptyState icon="👨‍⚕️" title="No doctors yet" subtitle="Add a doctor using the + button" />
        ) : (
          doctors.map(d => (
            <div key={d.id} className="bg-white rounded-2xl p-4 card-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800">{d.full_name}</p>
                  {d.specialty && <p className="text-sm text-stone-500">{d.specialty}</p>}
                  {d.clinic_name && <p className="text-xs text-stone-400 mt-0.5">{d.clinic_name}</p>}
                  <div className="mt-2 space-y-1">
                    {d.phone && (
                      <a href={`tel:${d.phone}`} className="flex items-center gap-2 text-xs text-stone-500">
                        <Phone className="w-3.5 h-3.5" />{d.phone}
                      </a>
                    )}
                    {d.email && (
                      <a href={`mailto:${d.email}`} className="flex items-center gap-2 text-xs text-stone-500">
                        <Mail className="w-3.5 h-3.5" />{d.email}
                      </a>
                    )}
                    {d.address && (
                      <div className="flex items-start gap-2 text-xs text-stone-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />{d.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  )
}
