"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  ArrowLeft,
  Trophy,
  Calendar,
  TrendingUp,
  Radio,
  AlertCircle,
  Star,
  Download,
} from "lucide-react"
import { MatchCard } from "./match-card"
import { Skeleton } from "@/components/ui/skeleton"
import { getCountryFlag } from "@/lib/regions"
import { useFavorites } from "@/hooks/use-favorites"
import type { Match } from "@/lib/types"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TeamProfileResponse {
  team: {
    id: string
    name: string
    logo: string
    country: string
    acronym: string
    players: Array<{
      id: string
      name: string
      firstName?: string
      lastName?: string
      nationality?: string
      imageUrl?: string
      role?: string
      age?: number
    }>
  }
  stats: {
    totalMatches: number
    wins: number
    losses: number
    winRate: number
    tournamentsCount: number
    upcomingCount: number
    liveCount: number
  }
  matches: Match[]
  tournaments: string[]
  error?: string
}

export function TeamProfileView({ teamId }: { teamId: string }) {
  const { data, error, isLoading } = useSWR<TeamProfileResponse>(
    `/api/teams/${teamId}`,
    fetcher,
    { refreshInterval: 60000 },
  )

  const { favorites, toggleFavorite } = useFavorites()
  const isFavorite = favorites.some((f) => f.id === teamId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !data || data.error || !data.team) {
    return (
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-8">
          <AlertCircle className="mb-2 h-8 w-8 text-destructive" />
          <p className="font-medium text-foreground">Time não encontrado</p>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar as informações deste time.
          </p>
        </div>
      </div>
    )
  }

  const { team, stats, matches, tournaments } = data
  const winRatePercent = Math.round(stats.winRate * 100)

  const liveMatches = matches.filter((m) => m.status === "live")
  const upcomingMatches = matches.filter((m) => m.status === "upcoming").slice(0, 6)
  const pastMatches = matches.filter((m) => m.status === "finished").slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      {/* Hero header */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          {team.logo ? (
            <img
              src={team.logo || "/placeholder.svg"}
              alt={team.name}
              className="h-24 w-24 rounded-lg bg-secondary object-contain p-2"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-secondary text-3xl font-bold text-muted-foreground">
              {team.name.charAt(0)}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {team.name}
              </h1>
              {team.acronym && (
                <span className="rounded bg-secondary px-2 py-1 text-xs font-bold text-muted-foreground">
                  {team.acronym}
                </span>
              )}
            </div>
            {team.country && (
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-lg">{getCountryFlag(team.country)}</span>
                <span>{team.country}</span>
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  toggleFavorite({ id: team.id, name: team.name, logo: team.logo })
                }
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isFavorite
                    ? "bg-accent/15 text-accent hover:bg-accent/20"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                )}
              >
                <Star className={cn("h-4 w-4", isFavorite && "fill-accent")} />
                {isFavorite ? "Favoritado" : "Favoritar time"}
              </button>
              <a
                href={`/api/calendar?format=ics&teamId=${team.id}`}
                download
                className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                Exportar agenda
              </a>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          <StatBox label="Partidas" value={stats.totalMatches} />
          <StatBox label="Vitórias" value={stats.wins} accent="win" />
          <StatBox label="Derrotas" value={stats.losses} accent="loss" />
          <StatBox
            label="Aproveitamento"
            value={`${winRatePercent}%`}
            accent={
              winRatePercent >= 60 ? "win" : winRatePercent >= 40 ? undefined : "loss"
            }
          />
        </div>
      </div>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Radio className="h-4 w-4 animate-pulse text-live" />
            Ao vivo agora
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {liveMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Roster */}
      {team.players.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Roster atual</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.players.map((p) => (
              <Link
                key={p.id}
                href={`/player/${p.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50"
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl || "/placeholder.svg"}
                    alt={p.name}
                    className="h-12 w-12 rounded-full bg-secondary object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm font-bold text-muted-foreground">
                    {(p.firstName?.[0] || p.name[0] || "?").toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground truncate">{p.name}</span>
                    {p.nationality && (
                      <span className="text-sm">{getCountryFlag(p.nationality)}</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {[p.firstName, p.lastName].filter(Boolean).join(" ") || p.role || "Player"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Próximas partidas
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Recent results */}
      {pastMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Resultados recentes
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Tournaments */}
      {tournaments.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Trophy className="h-4 w-4 text-accent" />
            Campeonatos disputados
          </h2>
          <div className="flex flex-wrap gap-2">
            {tournaments.map((t) => (
              <span
                key={t}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {matches.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
          <p className="text-muted-foreground">
            Nenhuma partida disponível para este time
          </p>
        </div>
      )}
    </div>
  )
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: "win" | "loss"
}) {
  return (
    <div className="bg-card p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          accent === "win" && "text-win",
          accent === "loss" && "text-destructive",
          !accent && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )
}
