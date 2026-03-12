interface BadgeProps {
  label: string;
  className?: string;
  dot?: boolean;
  dotColor?: string;
}

export default function Badge({ label, className = "", dot, dotColor }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={dotColor ? { backgroundColor: dotColor } : {}}
        />
      )}
      {label}
    </span>
  );
}
