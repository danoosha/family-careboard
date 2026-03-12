'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { getDocuments, getPeople } from '@/lib/queries'
import type { Document, Person } from '@/types'
import { formatDate, hexToRgba, darken } from '@/lib/utils'
import { FileText, ExternalLink } from 'lucide-react'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDocuments(), getPeople()])
      .then(([d, p]) => { setDocuments(d); setPeople(p) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppShell><PageLoader /></AppShell>

  const filtered = filter === 'all' ? documents : documents.filter(d => d.person_id === filter)
  const personMap = people.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, Person>)

  return (
    <AppShell>
      <div className="px-4 pt-12 pb-4">
        <h1 className="font-display text-2xl text-stone-800">Documents</h1>
        <p className="text-sm text-stone-400 mt-0.5">{documents.length} files</p>
      </div>

      {/* Filter by person */}
      <div className="overflow-x-auto scrollbar-hide px-4 mb-4">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === 'all' ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 card-shadow'}`}
          >
            All
          </button>
          {people.map(p => (
            <button
              key={p.id}
              onClick={() => setFilter(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors`}
              style={filter === p.id
                ? { background: p.color_hex, color: darken(p.color_hex, 0.4) }
                : { background: hexToRgba(p.color_hex, 0.15), color: darken(p.color_hex, 0.3) }
              }
            >
              {p.display_name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <EmptyState icon="📁" title="No documents" subtitle="Add documents using the + button" />
        ) : (
          filtered.map(doc => {
            const person = personMap[doc.person_id]
            return (
              <div key={doc.id} className="bg-white rounded-xl p-4 card-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stone-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 text-sm truncate">{doc.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {doc.category && <Badge>{doc.category}</Badge>}
                      {person && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: hexToRgba(person.color_hex, 0.25), color: darken(person.color_hex, 0.35) }}>
                          {person.display_name.split(' ')[0]}
                        </span>
                      )}
                      <span className="text-xs text-stone-400">{formatDate(doc.document_date)}</span>
                    </div>
                    {doc.notes && <p className="text-xs text-stone-400 mt-1 truncate">{doc.notes}</p>}
                  </div>
                  {doc.drive_url && (
                    <a href={doc.drive_url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </AppShell>
  )
}
