"use client";

import { FORMAT_OPTIONS, GENERATION_OPTIONS, type TeamFilters as TeamFiltersType } from "@/types/team";

interface TeamFiltersProps {
  filters: TeamFiltersType;
  onFilterChange: (filters: TeamFiltersType) => void;
}

export const TeamFilters = ({ filters, onFilterChange }: TeamFiltersProps) => {
  const handleFormatChange = (format: string) => {
    onFilterChange({ ...filters, format: format || undefined });
  };

  const handleGenerationChange = (generation: string) => {
    onFilterChange({ ...filters, generation: generation || undefined });
  };

  const handleStrategyChange = (strategy: string) => {
    onFilterChange({ ...filters, strategy: strategy || undefined });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Boolean(filters.format || filters.generation || filters.strategy);

  return (
    <div className="bg-white dark:bg-[#191919] border border-[var(--notion-border)] rounded-[3px] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-[var(--foreground)]">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[14px] text-[var(--notion-blue)] hover:underline opacity-80 hover:opacity-100"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label htmlFor="filter-format" className="block text-[12px] font-medium mb-1.5 text-[var(--foreground)] opacity-70">
            Format
          </label>
          <select
            id="filter-format"
            value={filters.format || ""}
            onChange={(e) => handleFormatChange(e.target.value)}
            className="w-full px-2 py-1.5 border border-[var(--notion-border)] rounded-[3px] bg-white dark:bg-[#191919] text-[var(--foreground)] text-[14px] focus:outline-none focus:ring-1 focus:ring-[var(--notion-blue)]"
          >
            <option value="">All Formats</option>
            {FORMAT_OPTIONS.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-generation" className="block text-[12px] font-medium mb-1.5 text-[var(--foreground)] opacity-70">
            Generation
          </label>
          <select
            id="filter-generation"
            value={filters.generation || ""}
            onChange={(e) => handleGenerationChange(e.target.value)}
            className="w-full px-2 py-1.5 border border-[var(--notion-border)] rounded-[3px] bg-white dark:bg-[#191919] text-[var(--foreground)] text-[14px] focus:outline-none focus:ring-1 focus:ring-[var(--notion-blue)]"
          >
            <option value="">All Generations</option>
            {GENERATION_OPTIONS.map((gen) => (
              <option key={gen} value={gen}>
                {gen}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-strategy" className="block text-[12px] font-medium mb-1.5 text-[var(--foreground)] opacity-70">
            Strategy (Search)
          </label>
          <input
            id="filter-strategy"
            type="text"
            value={filters.strategy || ""}
            onChange={(e) => handleStrategyChange(e.target.value)}
            placeholder="Search by strategy..."
            className="w-full px-2 py-1.5 border border-[var(--notion-border)] rounded-[3px] bg-white dark:bg-[#191919] text-[var(--foreground)] text-[14px] placeholder:opacity-40 focus:outline-none focus:ring-1 focus:ring-[var(--notion-blue)]"
          />
        </div>
      </div>
    </div>
  );
};

