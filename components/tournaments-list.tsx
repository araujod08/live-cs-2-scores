"use client"

import { useState } from "react"
import useSWR from "swr"
import { AlertCircle, Search, Trophy, RefreshCw } from "lucide-react"
import type { Tournament } from "@/lib/types"
import { TournamentCard } from "./tournament-card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type StatusFilter = "all" | "running" | "upcoming" | "finished"

export function TournamentsList() {
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [query, setQuery] = useState("")

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    tournaments: Tournament[]
    error?: string
  }>(`/api/tournaments?search=${encodeURIComponent(query)}`, fetcher, {
    refreshInterval: 60000,
  })

  const tournaments = data?.tournaments || []
  const apiError = data?.error || error

  const filtered = tournaments.filter((t) =>
    filter === "all" ? true : t.status === filter,
  )

  const counts = {
    all: tournaments.length,
    running: tournaments.filter((t) => t.status === "running").length,
    upcoming: tournaments.filter((t) => t.status === "upcoming").length,
    finished: tournaments.filter((t) => t.status === "finished").length,
  }

  const filters = [
    { id: "all", label: "Todos", count: counts.all },
    { id: "running", label: "Em andamento", count: counts.running },
    { id: "upcoming", label: "Próximos", count: counts.upcoming },
    { id: "finished", label: "Encerrados", count: counts.finished },
  ] as const

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar campeonatos (ex: IEM, ESL, BLAST)"
          className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  filter === f.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground",
                )}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => mutate()}
          disabled={isValidating}
          className="hidden items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground disabled:opacity-50 sm:flex"
        >
          <RefreshCw className={cn("h-4 w-4", isValidating && "animate-spin")} />
          Atualizar
        </button>
      </div>

      {/* Error */}
      {apiError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Erro ao carregar campeonatos</p>
            <p className="text-sm text-muted-foreground">
              Verifique sua conexão e tente novamente
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && !apiError && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}

      {/* List */}
      {!isLoading && !apiError && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !apiError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16">
          <Trophy className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">
            Nenhum campeonato encontrado
          </p>
          <p className="text-sm text-muted-foreground/70">
            {query ? "Tente outra busca" : "Tente outro filtro"}
          </p>
        </div>
      )}
    </div>
  )
}
