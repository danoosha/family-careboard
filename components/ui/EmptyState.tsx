interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-5" : "py-10"
      }`}
    >
      {icon && (
        <div className={`${compact ? "text-2xl mb-2" : "text-4xl mb-3"} opacity-40`}>
          {icon}
        </div>
      )}
      <p
        className={`font-semibold text-heading ${
          compact ? "text-sm" : "text-base"
        }`}
      >
        {title}
      </p>
      {subtitle && (
        <p
          className={`text-muted mt-1 ${compact ? "text-xs" : "text-sm"}`}
        >
          {subtitle}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
