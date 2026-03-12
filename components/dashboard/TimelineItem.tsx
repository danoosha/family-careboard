interface TimelineItemProps {
  title: string;
  dateLabel: string;
  personName?: string;
  personColor?: string;
}

export default function TimelineItem({
  title,
  dateLabel,
  personName,
  personColor,
}: TimelineItemProps) {
  const color = personColor || "#D6D6D6";
  const initial = personName?.trim()?.[0]?.toUpperCase() || "";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-none">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-stone-700 flex-shrink-0 mt-0.5"
        style={{ backgroundColor: color }}
      >
        {initial || ""}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm text-stone-800 font-medium leading-snug">
          {title}
        </div>

        {personName && (
          <div className="text-xs text-stone-500 mt-0.5">
            {personName}
          </div>
        )}
      </div>

      <div className="text-xs text-stone-500 whitespace-nowrap">
        {dateLabel}
      </div>
    </div>
  );
}