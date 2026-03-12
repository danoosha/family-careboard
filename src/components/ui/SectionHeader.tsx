export default function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 mb-2">
      <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{title}</h2>
      {action}
    </div>
  )
}
