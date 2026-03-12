'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import {
  getPerson, getAppointments, getCareJourneys, getCareJourneySteps,
  getPreventiveChecks, getMedications, getPrescriptions, getReferrals,
  getTestResults, getDocuments, getPersonDoctors, getVaccinations
} from '@/lib/queries'
import type { Person, Appointment, CareJourney, Medication, Prescription, Referral, TestResult, Document, Doctor, PreventiveCheck, Vaccination } from '@/types'
import { formatDate, formatDateTime, hexToRgba, darken } from '@/lib/utils'
import { ChevronLeft, ExternalLink, Stethoscope, Pill, FileText, FlaskConical, Calendar, Shield, Syringe } from 'lucide-react'

type Tab = 'overview' | 'timeline' | 'journeys' | 'doctors' | 'preventive' | 'medications' | 'prescriptions' | 'referrals' | 'results' | 'documents'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'journeys', label: 'Journeys' },
  { id: 'doctors', label: 'Doctors' },
  { id: 'preventive', label: 'Preventive' },
  { id: 'medications', label: 'Meds' },
  { id: 'prescriptions', label: 'Rx' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'results', label: 'Results' },
  { id: 'documents', label: 'Docs' },
]

export default function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [person, setPerson] = useState<Person | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [journeys, setJourneys] = useState<CareJourney[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [results, setResults] = useState<TestResult[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [preventive, setPreventive] = useState<PreventiveCheck[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getPerson(id),
      getAppointments(id),
      getCareJourneys(id),
      getMedications(id),
      getPrescriptions(id),
      getReferrals(id),
      getTestResults(id),
      getDocuments(id),
      getPersonDoctors(id),
      getPreventiveChecks(id),
      getVaccinations(id),
    ]).then(([p, a, j, m, rx, ref, res, docs, doc, prev, vax]) => {
      setPerson(p); setAppointments(a); setJourneys(j); setMedications(m)
      setPrescriptions(rx); setReferrals(ref); setResults(res); setDocuments(docs)
      setDoctors(doc); setPreventive(prev); setVaccinations(vax)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <AppShell><PageLoader /></AppShell>
  if (!person) return <AppShell><EmptyState icon="🤷" title="Person not found" /></AppShell>

  const headerBg = hexToRgba(person.color_hex, 0.3)
  const accent = darken(person.color_hex, 0.35)

  return (
    <AppShell>
      {/* Header */}
      <div className="px-4 pt-10 pb-5" style={{ background: headerBg }}>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: person.color_hex, color: accent }}>
            {person.display_name[0]}
          </div>
          <div>
            <h1 className="font-display text-2xl text-stone-800">{person.display_name}</h1>
            {person.status_summary && <p className="text-sm text-stone-500 mt-0.5">{person.status_summary}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto scrollbar-hide border-b border-stone-100 bg-white sticky top-0 z-10">
        <div className="flex px-3 min-w-max">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === t.id ? 'border-stone-800 text-stone-800' : 'border-transparent text-stone-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-4">
        {tab === 'overview' && (
          <div className="space-y-4">
            {person.next_action_summary && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-600 mb-1">Next action</p>
                <p className="text-sm text-stone-700">{person.next_action_summary}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Appointments" value={appointments.length} />
              <Stat label="Medications" value={medications.filter(m => m.is_active).length} />
              <Stat label="Documents" value={documents.length} />
            </div>
            {appointments.slice(0, 3).map(a => (
              <div key={a.id} className="bg-white rounded-xl p-3 card-shadow flex items-center gap-3">
                <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 truncate">{a.title}</p>
                  <p className="text-xs text-stone-400">{formatDateTime(a.starts_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'timeline' && (
          <div className="space-y-2">
            {appointments.length === 0 ? <EmptyState icon="📅" title="No appointments" /> :
              appointments.map(a => (
                <div key={a.id} className="bg-white rounded-xl p-3 card-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-stone-800 text-sm">{a.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{formatDateTime(a.starts_at)}</p>
                      {a.location && <p className="text-xs text-stone-400">{a.location}</p>}
                    </div>
                    <Badge>{a.doctors?.full_name || '—'}</Badge>
                  </div>
                  {a.notes && <p className="text-xs text-stone-500 mt-2 italic">{a.notes}</p>}
                </div>
              ))
            }
          </div>
        )}

        {tab === 'journeys' && (
          <div className="space-y-2">
            {journeys.length === 0 ? <EmptyState icon="🗺️" title="No care journeys" /> :
              journeys.map(j => (
                <div key={j.id} className="bg-white rounded-xl p-3 card-shadow">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-stone-800 text-sm">{j.title}</p>
                    {j.status && <Badge>{j.status}</Badge>}
                  </div>
                  {j.description && <p className="text-xs text-stone-500 mt-1">{j.description}</p>}
                  <p className="text-xs text-stone-400 mt-1">Started {formatDate(j.started_at)}</p>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'doctors' && (
          <div className="space-y-2">
            {doctors.length === 0 ? <EmptyState icon="👨‍⚕️" title="No doctors added" /> :
              doctors.map(d => (
                <div key={d.id} className="bg-white rounded-xl p-3 card-shadow flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 text-sm">{d.full_name}</p>
                    <p className="text-xs text-stone-400">{d.specialty || d.clinic_name || '—'}</p>
                    {d.phone && <p className="text-xs text-stone-400">{d.phone}</p>}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'preventive' && (
          <div className="space-y-2">
            {preventive.length === 0 && vaccinations.length === 0 ? <EmptyState icon="🛡️" title="No preventive checks" /> : null}
            {preventive.map(c => (
              <div key={c.id} className="bg-white rounded-xl p-3 card-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-stone-400" />
                    <p className="font-medium text-stone-800 text-sm">{c.check_name}</p>
                  </div>
                  {c.next_due && <Badge variant="info">Due {formatDate(c.next_due)}</Badge>}
                </div>
                {c.last_done && <p className="text-xs text-stone-400 mt-1">Last done: {formatDate(c.last_done)}</p>}
              </div>
            ))}
            {vaccinations.map(v => (
              <div key={v.id} className="bg-white rounded-xl p-3 card-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Syringe className="w-4 h-4 text-stone-400" />
                    <p className="font-medium text-stone-800 text-sm">{v.vaccine_name}</p>
                  </div>
                  {v.next_due && <Badge variant="warning">Next {formatDate(v.next_due)}</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'medications' && (
          <div className="space-y-2">
            {medications.length === 0 ? <EmptyState icon="💊" title="No medications" /> :
              medications.map(m => (
                <div key={m.id} className="bg-white rounded-xl p-3 card-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-stone-400" />
                      <p className="font-medium text-stone-800 text-sm">{m.name}</p>
                    </div>
                    <Badge variant={m.is_active ? 'success' : 'default'}>{m.is_active ? 'Active' : 'Stopped'}</Badge>
                  </div>
                  {m.dosage && <p className="text-xs text-stone-500 mt-1">{m.dosage} · {m.frequency}</p>}
                </div>
              ))
            }
          </div>
        )}

        {tab === 'prescriptions' && (
          <div className="space-y-2">
            {prescriptions.length === 0 ? <EmptyState icon="📋" title="No prescriptions" /> :
              prescriptions.map(p => (
                <div key={p.id} className="bg-white rounded-xl p-3 card-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-stone-800 text-sm">{p.medication_name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{formatDate(p.issue_date)}</p>
                      {p.dosage && <p className="text-xs text-stone-500">{p.dosage}</p>}
                    </div>
                    {p.drive_url && (
                      <a href={p.drive_url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-500" onClick={e => e.stopPropagation()}>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'referrals' && (
          <div className="space-y-2">
            {referrals.length === 0 ? <EmptyState icon="🏥" title="No referrals" /> :
              referrals.map(r => (
                <div key={r.id} className="bg-white rounded-xl p-3 card-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-stone-800 text-sm">{r.specialist_name || r.specialty || 'Referral'}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{r.reason}</p>
                      <p className="text-xs text-stone-400">{formatDate(r.issue_date)} · expires {formatDate(r.expiry_date)}</p>
                    </div>
                    {r.status && <Badge variant={r.status === 'active' ? 'success' : 'default'}>{r.status}</Badge>}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'results' && (
          <div className="space-y-2">
            {results.length === 0 ? <EmptyState icon="🔬" title="No test results" /> :
              results.map(r => (
                <div key={r.id} className="bg-white rounded-xl p-3 card-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-stone-400" />
                        <p className="font-medium text-stone-800 text-sm">{r.test_name}</p>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">{formatDate(r.test_date)}</p>
                      {r.result_summary && <p className="text-xs text-stone-600 mt-1">{r.result_summary}</p>}
                    </div>
                    {r.drive_url && (
                      <a href={r.drive_url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'documents' && (
          <div className="space-y-2">
            {documents.length === 0 ? <EmptyState icon="📁" title="No documents" /> :
              documents.map(d => (
                <div key={d.id} className="bg-white rounded-xl p-3 card-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-stone-800 text-sm truncate">{d.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {d.category && <Badge>{d.category}</Badge>}
                          <span className="text-xs text-stone-400">{formatDate(d.document_date)}</span>
                        </div>
                      </div>
                    </div>
                    {d.drive_url && (
                      <a href={d.drive_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 ml-2 shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl p-3 card-shadow text-center">
      <div className="text-2xl font-bold text-stone-800">{value}</div>
      <div className="text-xs text-stone-400 mt-0.5">{label}</div>
    </div>
  )
}
