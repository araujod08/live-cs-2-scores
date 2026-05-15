"use client"

import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft, Calendar, AlertCircle, MapPin, User } from "lucide-react"
import { MatchCard } from "./match-card"
import { Skeleton } from "@/components/ui/skeleton"
import { getCountryFlag } from "@/lib/regions"
import type { Match } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PlayerProfileResponse {
  player: {
    id: string
    name: string
    firstName?: string
    lastName?: string
    nationality?: string
    imageUrl?: string
    role?: string
    age?: number
    birthday?: string
    hometown?: string
    currentTeam: {
      id: string
      name: string
      logo: string
      country: string
      acronym: string
    } | null
  }
  recentMatches: Match[]
  error?: string
}

export function PlayerProfileView({ playerId }: { playerId: string }) {
  const { data, error, isLoading } = useSWR<PlayerProfileResponse>(
    `/api/players/${playerId}`,
    fetcher,
    { refreshInterval: 60000 },
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !data || data.error || !data.player) {
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
          <p className="font-medium text-foreground">Jogador não encontrado</p>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar as informações deste jogador.
          </p>
        </div>
      </div>
    )
  }

  const { player, recentMatches } = data
  const fullName = [player.firstName, player.lastName].filter(Boolean).join(" ")

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      {/* Hero */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          {player.imageUrl ? (
            <img
              src={player.imageUrl || "/placeholder.svg"}
              alt={player.name}
              className="h-28 w-28 rounded-full bg-secondary object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-secondary text-4xl font-bold text-muted-foreground">
              {(player.firstName?.[0] || player.name[0] || "?").toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {player.name}
              </h1>
              {player.nationality && (
                <span className="text-2xl">{getCountryFlag(player.nationality)}</span>
              )}
            </div>
            {fullName && (
              <p className="mt-1 text-sm text-muted-foreground">{fullName}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {player.role && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {player.role}
                </span>
              )}
              {player.age && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {player.age} anos
                </span>
              )}
              {player.hometown && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {player.hometown}
                </span>
              )}
            </div>

            {/* Current team */}
            {player.currentTeam && (
              <Link
                href={`/team/${player.currentTeam.id}`}
                className="mt-4 inline-flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2 transition-colors hover:bg-secondary"
              >
                {player.currentTeam.logo ? (
                  <img
                    src={player.currentTeam.logo || "/placeholder.svg"}
                    alt={player.currentTeam.name}
                    className="h-8 w-8 rounded bg-card object-contain p-0.5"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-card text-xs font-bold text-muted-foreground">
                    {player.currentTeam.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Time atual</p>
                  <p className="text-sm font-semibold text-foreground">
                    {player.currentTeam.name}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent team matches */}
      {recentMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            Partidas recentes do time
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recentMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {recentMatches.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
          <p className="text-muted-foreground">
            Sem partidas recentes disponíveis para este jogador
          </p>
        </div>
      )}
    </div>
  )
}
