"use client"

import { Globe } from "lucide-react"
import { REGIONS } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RegionFilterProps {
  value: string
  onChange: (region: string) => void
}

export function RegionFilter({ value, onChange }: RegionFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-full gap-2 bg-secondary text-sm sm:w-44">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <SelectValue placeholder="Região" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as regiões</SelectItem>
        {REGIONS.map((region) => (
          <SelectItem key={region.id} value={region.id}>
            {region.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
