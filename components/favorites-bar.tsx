"use client"

import { Star, X } from "lucide-react"
import type { FavoriteTeam } from "@/hooks/use-favorites"

interface FavoritesBarProps {
  favorites: FavoriteTeam[]
  onRemove: (teamId: string) => void
  showFavoritesOnly: boolean
  onToggleFilter: () => void
}

export function FavoritesBar({
  favorites,
  onRemove,
  showFavoritesOnly,
  onToggleFilter,
}: FavoritesBarProps) {
  if (favorites.length === 0) return null

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-accent text-accent" />
          <span className="text-sm font-semibold text-foreground">
            Times Favoritos
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {favorites.length}
          </span>
        </div>
        <button
          onClick={onToggleFilter}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            showFavoritesOnly
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          }`}
        >
          {showFavoritesOnly ? "Mostrar todos" : "Filtrar favoritos"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {favorites.map((team) => (
          <div
            key={team.id}
            className="group flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5"
          >
            {team.logo ? (
              <img
                src={team.logo || "/placeholder.svg"}
                alt={team.name}
                className="h-5 w-5 rounded object-contain"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-xs font-bold">
                {team.name.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-foreground">
              {team.name}
            </span>
            <button
              onClick={() => onRemove(team.id)}
              className="ml-1 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
