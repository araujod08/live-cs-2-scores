"use client"

import { cn } from "@/lib/utils"

interface MatchFiltersProps {
  currentFilter: "all" | "live" | "upcoming" | "finished"
  onFilterChange: (filter: "all" | "live" | "upcoming" | "finished") => void
}

export function MatchFilters({
  currentFilter,
  onFilterChange,
}: MatchFiltersProps) {
  const filters = [
    { id: "all", label: "Todos" },
    { id: "live", label: "Ao Vivo" },
    { id: "upcoming", label: "Em Breve" },
    { id: "finished", label: "Encerrados" },
  ] as const

return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            currentFilter === filter.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
