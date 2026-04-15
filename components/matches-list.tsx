"use client"

import { useState } from "react"
import useSWR from "swr"
import { MatchCard } from "./match-card"
import { MatchFilters } from "./match-filters"
import { TeamSearch } from "./team-search"
import { TournamentSearch } from "./tournament-search"
import { FavoritesBar } from "./favorites-bar"
import { useFavorites } from "@/hooks/use-favorites"
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
  const [selectedTeam, setSelectedTeam] = useState<TeamSuggestion | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  
  const { favorites, toggleFavorite, isFavorite, removeFavorite } = useFavorites()

  const apiUrl = `/api/matches?search=${encodeURIComponent(searchQuery)}&tournament=${encodeURIComponent(tournamentQuery)}`

  const { data, error, isLoading, isValidating, mutate } = useSWR(apiUrl, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  const matches: Match[] = data?.matches || []
  const apiError = data?.error || error

  const counts = {
    all: matches.length,
    live: matches.filter((m) => m.status === "live").length,
    upcoming: matches.filter((m) => m.status === "upcoming").length,
    finished: matches.filter((m) => m.status === "finished").length,
  }

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

  const filteredByStatus = filter === "all" 
    ? matches 
    : matches.filter((m) => m.status === filter)
    
  const displayedMatches = showFavoritesOnly
    ? filteredByStatus.filter((m) => 
        isFavorite(m.team1.id) || isFavorite(m.team2.id)
      )
    : filteredByStatus

  return (
    <div className="space-y-6">
      {/* Favorites Bar */}
      <FavoritesBar
        favorites={favorites}
        onRemove={removeFavorite}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFilter={() => setShowFavoritesOnly(!showFavoritesOnly)}
      />
      
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <TeamSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={handleTeamSelect}
          />
          <TournamentSearch
            value={tournamentQuery}
            onChange={setTournamentQuery}
          />
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <MatchFilters
            currentFilter={filter}
            onFilterChange={setFilter}
          />

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-lg bg-card"
            />
          ))}
        </div>
      )}

      {/* Matches Grid */}
      {!isLoading && !apiError && displayedMatches.length > 0 && (
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
