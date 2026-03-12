interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
        {title}
      </h2>
      {action && <div>{action}</div>}
    </div>
  );
}
