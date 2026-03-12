export default function EmptyState({ icon, title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center py-12 px-6">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <h3 className="font-medium text-stone-600">{title}</h3>
      {subtitle && <p className="text-sm text-stone-400 mt-1">{subtitle}</p>}
    </div>
  )
}
