"use client"

import { LayoutGrid, List } from "lucide-react"
import type { ViewMode } from "@/hooks/use-preferences"
import { cn } from "@/lib/utils"

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center rounded-lg bg-secondary p-1">
      <button
        onClick={() => onChange("card")}
        aria-label="Visualização em cards"
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded transition-colors",
          value === "card"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onChange("compact")}
        aria-label="Visualização compacta"
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded transition-colors",
          value === "compact"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <List className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
