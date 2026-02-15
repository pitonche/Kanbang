interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}

export function SearchBar({ value, onChange, inputRef }: SearchBarProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tasks... ( / )"
        className="w-full sm:w-64 pl-9 pr-8 py-1.5 text-sm border border-slate-300 rounded-md
                   bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
