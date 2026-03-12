interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

export default function Card({
  children,
  className = "",
  onClick,
  noPadding = false,
}: CardProps) {
  const base = `bg-white rounded-3xl shadow-card ${noPadding ? "" : "p-4"}`;
  const clickable = onClick
    ? "cursor-pointer active:scale-[0.98] transition-transform"
    : "";
  return (
    <div className={`${base} ${clickable} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
