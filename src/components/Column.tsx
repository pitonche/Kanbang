interface ColumnProps {
  id: string;
  label: string;
}

export function Column({ id: _id, label }: ColumnProps) {
  return (
    <div className="flex flex-col w-72 shrink-0 rounded-lg bg-column-bg">
      <h2 className="px-3 py-2 text-sm font-semibold text-column-header uppercase tracking-wide">
        {label}
      </h2>
      <div className="flex-1 p-2 min-h-[200px]">
        <p className="text-sm text-empty-state text-center mt-8">
          No tasks yet
        </p>
      </div>
    </div>
  );
}
