"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { MatchCard } from "./match-card"
import { MatchRow } from "./match-row"
import { MatchFilters } from "./match-filters"
import { TeamSearch } from "./team-search"
import { TournamentSearch } from "./tournament-search"
import { FavoritesBar } from "./favorites-bar"
import { RegionFilter } from "./region-filter"
import { SortSelector } from "./sort-selector"
import { ViewModeToggle } from "./view-mode-toggle"
import { useFavorites } from "@/hooks/use-favorites"
import { usePreferences } from "@/hooks/use-preferences"
import { useMatchWatcher } from "@/hooks/use-match-watcher"
import { isInRegion } from "@/lib/regions"
import type { Match } from "@/lib/types"
import { RefreshCw, AlertCircle, Wifi } from "lucide-react"

interface TeamSuggestion {
  id: string
  name: string
  logo: string
  country: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function MatchesList() {
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "finished">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [tournamentQuery, setTournamentQuery] = useState("")
  const [, setSelectedTeam] = useState<TeamSuggestion | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const { favorites, toggleFavorite, isFavorite, removeFavorite } = useFavorites()
  const {
    viewMode,
    sortMode,
    region,
    setViewMode,
    setSortMode,
    setRegion,
  } = usePreferences()

  const apiUrl = `/api/matches?search=${encodeURIComponent(searchQuery)}&tournament=${encodeURIComponent(tournamentQuery)}`

  const { data, error, isLoading, isValidating, mutate } = useSWR(apiUrl, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  const matches: Match[] = data?.matches || []
  const apiError = data?.error || error

  // Notification watcher for favorite teams
  useMatchWatcher({
    matches,
    favoriteIds: favorites.map((f) => f.id),
  })

  const handleRefresh = () => {
    mutate()
  }

  const handleTeamSelect = (team: TeamSuggestion | null) => {
    setSelectedTeam(team)
    if (team) {
      setSearchQuery(team.name)
    } else {
      setSearchQuery("")
    }
  }

  const displayedMatches = useMemo(() => {
    let result = matches

    // Status
    if (filter !== "all") {
      result = result.filter((m) => m.status === filter)
    }

    // Region
    if (region !== "all") {
      result = result.filter(
        (m) =>
          isInRegion(m.team1.country, region) || isInRegion(m.team2.country, region),
      )
    }

    // Favorites only
    if (showFavoritesOnly) {
      result = result.filter(
        (m) => isFavorite(m.team1.id) || isFavorite(m.team2.id),
      )
    }

    // Sorting
    const favoriteIds = new Set(favorites.map((f) => f.id))
    const sortedResult = [...result]
    sortedResult.sort((a, b) => {
      // Always prioritize live matches first regardless of sort mode
      const aLive = a.status === "live" ? 0 : 1
      const bLive = b.status === "live" ? 0 : 1
      if (aLive !== bLive) return aLive - bLive

      if (sortMode === "favorites") {
        const aFav = favoriteIds.has(a.team1.id) || favoriteIds.has(a.team2.id) ? 0 : 1
        const bFav = favoriteIds.has(b.team1.id) || favoriteIds.has(b.team2.id) ? 0 : 1
        if (aFav !== bFav) return aFav - bFav
      }

      if (sortMode === "tournament") {
        const cmp = a.tournament.localeCompare(b.tournament)
        if (cmp !== 0) return cmp
      }

      // Default: by start time
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    })

    return sortedResult
  }, [matches, filter, region, showFavoritesOnly, sortMode, favorites, isFavorite])

  return (
    <div className="space-y-6">
      {/* Favorites Bar */}
      <FavoritesBar
        favorites={favorites}
        onRemove={removeFavorite}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFilter={() => setShowFavoritesOnly(!showFavoritesOnly)}
      />

      {/* Search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <TeamSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={handleTeamSelect}
          />
          <TournamentSearch value={tournamentQuery} onChange={setTournamentQuery} />
        </div>

        {/* Region & Sort */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <RegionFilter value={region} onChange={setRegion} />
          <SortSelector value={sortMode} onChange={setSortMode} />
          <div className="flex flex-1 items-center justify-end gap-2">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <MatchFilters currentFilter={filter} onFilterChange={setFilter} />

          <div className="flex items-center gap-3">
            {!apiError && (
              <div className="flex items-center gap-2">
                <Wifi className="h-3 w-3 text-win" />
                <span className="text-xs text-muted-foreground">Dados ao vivo</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={isValidating}
              className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isValidating ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {apiError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Erro ao carregar partidas</p>
            <p className="text-sm text-muted-foreground">
              {apiError === "PANDASCORE_API_KEY not configured"
                ? "Configure a variavel PANDASCORE_API_KEY para ver dados reais"
                : "Verifique sua conexao e tente novamente"}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !apiError && (
        <div
          className={
            viewMode === "card"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-2"
          }
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={
                viewMode === "card"
                  ? "h-64 animate-pulse rounded-lg bg-card"
                  : "h-14 animate-pulse rounded-lg bg-card"
              }
            />
          ))}
        </div>
      )}

      {/* Matches */}
      {!isLoading && !apiError && displayedMatches.length > 0 && (
        <>
          {viewMode === "card" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isFavorite1={isFavorite(match.team1.id)}
                  isFavorite2={isFavorite(match.team2.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {displayedMatches.map((match) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  isFavorite1={isFavorite(match.team1.id)}
                  isFavorite2={isFavorite(match.team2.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && !apiError && displayedMatches.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16">
          <p className="text-lg font-medium text-muted-foreground">
            {searchQuery || tournamentQuery
              ? `Nenhuma partida encontrada${searchQuery ? ` para "${searchQuery}"` : ""}${tournamentQuery ? ` no campeonato "${tournamentQuery}"` : ""}`
              : "Nenhuma partida encontrada"}
          </p>
          <p className="text-sm text-muted-foreground/70">
            {searchQuery || tournamentQuery
              ? "Tente buscar por outro time ou campeonato"
              : "Tente outro filtro ou aguarde novas partidas"}
          </p>
        </div>
      )}
    </div>
  )
}
