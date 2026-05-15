"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  BarChart3,
} from "lucide-react"
import type { RankingTeam, Region } from "@/lib/types"
import { REGIONS } from "@/lib/types"
import { getCountryFlag } from "@/lib/regions"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function RankingsTable() {
  const [region, setRegion] = useState<string>("all")

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    rankings: RankingTeam[]
    error?: string
  }>(`/api/rankings?region=${region}`, fetcher, {
    refreshInterval: 300000,
  })

  const rankings = data?.rankings || []
  const apiError = data?.error || error

  return (
    <div className="space-y-4">
      {/* Region tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <RegionButton
            label="Mundial"
            active={region === "all"}
            onClick={() => setRegion("all")}
          />
          {REGIONS.map((r: Region) => (
            <RegionButton
              key={r.id}
              label={r.name}
              active={region === r.id}
              onClick={() => setRegion(r.id)}
            />
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
            <p className="font-medium text-destructive">Erro ao carregar rankings</p>
            <p className="text-sm text-muted-foreground">Tente novamente em instantes</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && !apiError && (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}

      {/* Table */}
      {!isLoading && !apiError && rankings.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="hidden border-b border-border bg-secondary/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[60px_1fr_120px_120px_80px] sm:gap-3">
            <span>Pos.</span>
            <span>Time</span>
            <span className="text-center">Recentes</span>
            <span className="text-center">Vitórias</span>
            <span className="text-right">Pontos</span>
          </div>
          <ul className="divide-y divide-border">
            {rankings.map((team) => (
              <RankingRow key={team.id} team={team} />
            ))}
          </ul>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !apiError && rankings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16">
          <BarChart3 className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">
            Sem dados de ranking
          </p>
          <p className="text-sm text-muted-foreground/70">
            Não há partidas suficientes para gerar o ranking nesta região
          </p>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Ranking calculado com base nas partidas das últimas semanas. Atualizado
        a cada 5 minutos.
      </p>
    </div>
  )
}

function RegionButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

function RankingRow({ team }: { team: RankingTeam }) {
  const winRate = Math.round(team.winRate * 100)
  const wins = Math.round(team.recentMatches * team.winRate)

  return (
    <li className="grid grid-cols-[40px_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30 sm:grid-cols-[60px_1fr_120px_120px_80px]">
      {/* Position */}
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "tabular-nums text-sm font-bold",
            team.position <= 3 ? "text-accent" : "text-foreground",
          )}
        >
          {team.position}
        </span>
        <PositionTrend
          current={team.position}
          previous={team.previousPosition}
        />
      </div>

      {/* Team */}
      <Link
        href={`/team/${team.id}`}
        className="flex items-center gap-3 min-w-0 group/team"
      >
        {team.logo ? (
          <img
            src={team.logo || "/placeholder.svg"}
            alt={team.name}
            className="h-8 w-8 flex-shrink-0 rounded bg-secondary object-contain p-0.5"
          />
        ) : (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-secondary text-xs font-bold">
            {team.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground group-hover/team:text-primary transition-colors">
            {team.name}
          </p>
          {team.country && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{getCountryFlag(team.country)}</span>
              <span>{team.country}</span>
            </p>
          )}
        </div>
      </Link>

      {/* Recent matches (mobile inline) */}
      <div className="hidden text-center text-sm text-foreground sm:block">
        {team.recentMatches}
      </div>

      {/* Wins */}
      <div className="hidden text-center sm:block">
        <div className="inline-flex items-center gap-2">
          <span className="text-sm font-medium text-foreground tabular-nums">
            {wins}/{team.recentMatches}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
              winRate >= 60
                ? "bg-win/15 text-win"
                : winRate >= 40
                  ? "bg-secondary text-foreground"
                  : "bg-destructive/15 text-destructive",
            )}
          >
            {winRate}%
          </span>
        </div>
      </div>

      {/* Points */}
      <div className="text-right text-sm font-bold tabular-nums text-foreground sm:hidden md:block">
        {team.points ?? "-"}
      </div>
      <div className="text-right text-sm font-bold tabular-nums text-foreground hidden sm:block md:hidden">
        {team.points ?? "-"}
      </div>
    </li>
  )
}

function PositionTrend({
  current,
  previous,
}: {
  current: number
  previous?: number
}) {
  if (previous === undefined) return null
  if (previous > current) {
    return <TrendingUp className="h-3 w-3 text-win" />
  }
  if (previous < current) {
    return <TrendingDown className="h-3 w-3 text-destructive" />
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />
}
