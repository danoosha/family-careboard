import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/dates";
import { getPersonColors } from "@/lib/colors";
import { ExternalLink, FileText } from "lucide-react";
import type { Document, Person } from "@/types";

export const revalidate = 0;

const CATEGORY_COLORS: Record<string, string> = {
  prescription: "bg-[#EAF5D8] text-[#3A6B1A]",
  referral:     "bg-[#F7DCDE] text-[#7A2730]",
  test_result:  "bg-[#EAE8F7] text-[#3A3370]",
  report:       "bg-[#F5E8C0] text-[#6B4E0A]",
  other:        "bg-gray-100  text-gray-600",
};

export default async function DocumentsPage() {
  const supabase = createClient();

  const [{ data: documents }, { data: people }] = await Promise.all([
    supabase
      .from("documents")
      .select("*, person:people(id,display_name,color)")
      .order("document_date", { ascending: false }),
    supabase.from("people").select("id,display_name,color").order("display_name"),
  ]);

  const typedDocs   = (documents as (Document & { person: Person })[]) ?? [];
  const typedPeople = (people as Person[]) ?? [];

  // Group by person
  const grouped = typedPeople.map((person) => ({
    person,
    docs: typedDocs.filter((d) => d.person_id === person.id),
  })).filter((g) => g.docs.length > 0);

  const ungrouped = typedDocs.filter((d) => !d.person_id);

  return (
    <AppShell>
      <div className="px-4 pt-8 pb-4 space-y-6">
        <h1 className="text-2xl font-extrabold text-heading">Documents</h1>

        {typedDocs.length === 0 && (
          <div className="bg-white rounded-3xl shadow-card">
            <EmptyState icon="📁" title="No documents yet" subtitle="Tap + to add your first document." />
          </div>
        )}

        {/* Grouped by person */}
        {grouped.map(({ person, docs }) => {
          const c = getPersonColors(person.color);
          return (
            <section key={person.id}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold"
                  style={{ backgroundColor: c.bg, color: c.text }}
                >
                  {person.display_name[0]}
                </div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
                  {person.display_name}
                </h2>
              </div>

              <div className="bg-white rounded-3xl shadow-card divide-y divide-border">
                {docs.map((doc) => (
                  <div key={doc.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-heading truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {doc.category && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS.other}`}>
                            {doc.category.replace("_", " ")}
                          </span>
                        )}
                        {doc.document_date && (
                          <span className="text-xs text-muted">{formatDate(doc.document_date)}</span>
                        )}
                      </div>
                    </div>
                    {doc.drive_url && (
                      <a
                        href={doc.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-xl bg-[#EAE8F7] flex items-center justify-center flex-shrink-0"
                        aria-label="Open document"
                      >
                        <ExternalLink size={14} className="text-[#3A3370]" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Ungrouped fallback */}
        {ungrouped.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-2">Other</h2>
            <div className="bg-white rounded-3xl shadow-card divide-y divide-border">
              {ungrouped.map((doc) => (
                <div key={doc.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-heading truncate">{doc.title}</p>
                    {doc.document_date && (
                      <p className="text-xs text-muted mt-0.5">{formatDate(doc.document_date)}</p>
                    )}
                  </div>
                  {doc.drive_url && (
                    <a href={doc.drive_url} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-xl bg-[#EAE8F7] flex items-center justify-center flex-shrink-0">
                      <ExternalLink size={14} className="text-[#3A3370]" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
