"use client"

import { ArrowUpDown } from "lucide-react"
import type { SortMode } from "@/hooks/use-preferences"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SortSelectorProps {
  value: SortMode
  onChange: (sort: SortMode) => void
}

export function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortMode)}>
      <SelectTrigger className="h-10 w-full gap-2 bg-secondary text-sm sm:w-44">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="time">Por horário</SelectItem>
        <SelectItem value="tournament">Por campeonato</SelectItem>
        <SelectItem value="favorites">Favoritos primeiro</SelectItem>
      </SelectContent>
    </Select>
  )
}
