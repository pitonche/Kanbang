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
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
            active === f.value
              ? "bg-slate-700 text-white border-slate-700"
              : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
