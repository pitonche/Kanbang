const CADENCE_FILTERS = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
] as const;

interface CadenceFilterProps {
  active: string | null;
  onFilter: (cadence: string | null) => void;
  disabled?: boolean;
}

export function CadenceFilter({ active, onFilter, disabled }: CadenceFilterProps) {
  return (
    <div className="flex gap-2">
      {CADENCE_FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilter(active === f.value ? null : f.value)}
          disabled={disabled}
          aria-pressed={active === f.value}
          className={`px-3 py-2.5 sm:py-1.5 text-xs font-medium rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg ${
            active === f.value
              ? "bg-filter-bg-active text-filter-text-active border-filter-border-active"
              : "bg-filter-bg text-filter-text border-filter-border hover:border-input-placeholder"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
