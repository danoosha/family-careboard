import EmptyState from "@/components/ui/EmptyState";
import type { Document } from "@/types";

interface DocumentsSectionProps {
  documents: Document[];
}

export default function DocumentsSection({
  documents = [],
}: DocumentsSectionProps) {
  if (!documents || documents.length === 0) {
    return <EmptyState icon="📁" title="No documents" compact />;
  }

  const sortedDocuments = [...documents].sort((a: any, b: any) => {
    const aDate = a.document_date ? new Date(a.document_date).getTime() : 0;
    const bDate = b.document_date ? new Date(b.document_date).getTime() : 0;
    return bDate - aDate;
  });

  return (
    <div className="space-y-3">
      {sortedDocuments.map((doc: any, index: number) => (
        <div
          key={doc.id ?? index}
          className="bg-white rounded-3xl shadow-card px-4 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-heading leading-tight">
                {doc.title || "Untitled document"}
              </p>

              {doc.category && (
                <p className="text-xs text-stone-500 mt-1">{doc.category}</p>
              )}

              {doc.document_date && (
                <p className="text-xs text-stone-500 mt-1">
                  {new Date(doc.document_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            {doc.drive_url && (
              <a
                href={doc.drive_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-violet-700 whitespace-nowrap"
              >
                Open
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}