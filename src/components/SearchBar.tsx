interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}

export function SearchBar({ value, onChange, inputRef }: SearchBarProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-input-placeholder"
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
        className="w-full sm:w-64 pl-9 pr-8 py-1.5 text-sm border border-input-border rounded-md
                   bg-input-bg text-input-text placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-nav-btn-bg focus:border-transparent"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-input-placeholder hover:text-card-title text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg rounded"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
