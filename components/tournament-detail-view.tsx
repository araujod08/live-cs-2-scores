"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  ArrowLeft,
  AlertCircle,
  Trophy,
  Calendar,
  DollarSign,
  Users,
  Radio,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { TournamentDetail } from "@/lib/types"
import { TournamentBracket } from "./tournament-bracket"
import { MatchRow } from "./match-row"
import { useFavorites } from "@/hooks/use-favorites"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TournamentDetailViewProps {
  tournamentId: string
}

export function TournamentDetailView({ tournamentId }: TournamentDetailViewProps) {
  const { favorites, toggleFavorite, isFavorite } = useFavorites()

  const { data, error, isLoading } = useSWR<{
    tournament: TournamentDetail
  }>(`/api/tournaments/${tournamentId}`, fetcher, {
    refreshInterval: 60000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !data?.tournament) {
    return (
      <div className="space-y-6">
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8">
          <AlertCircle className="mb-2 h-8 w-8 text-destructive" />
          <p className="font-medium text-destructive">Campeonato não encontrado</p>
        </div>
      </div>
    )
  }

  const t = data.tournament
  const isRunning = t.status === "running"

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  const liveMatches = t.matches.filter((m) => m.status === "live")
  const upcomingMatches = t.matches.filter((m) => m.status === "upcoming")
  const finishedMatches = t.matches.filter((m) => m.status === "finished")

  return (
    <div className="space-y-6">
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para campeonatos
      </Link>

      {/* Header card */}
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-card",
          isRunning && "border-live/40",
        )}
      >
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center">
          {t.leagueLogo ? (
            <img
              src={t.leagueLogo || "/placeholder.svg"}
              alt={t.league}
              className="h-20 w-20 rounded-xl bg-secondary object-contain p-2"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-secondary">
              <Trophy className="h-9 w-9 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t.fullName || t.name}
              </h1>
              {isRunning && (
                <div className="flex items-center gap-1 rounded-full bg-live/20 px-2 py-0.5">
                  <Radio className="h-2.5 w-2.5 animate-pulse text-live" />
                  <span className="text-[10px] font-bold uppercase text-live">live</span>
                </div>
              )}
              {t.tier && (
                <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                  Tier {t.tier}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t.league}</p>
            {t.serie && (
              <p className="text-xs text-muted-foreground/70">{t.serie}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {formatDate(t.beginAt)}
                  {t.endAt && ` - ${formatDate(t.endAt)}`}
                </span>
              </div>
              {t.prizepool && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{t.prizepool}</span>
                </div>
              )}
              {t.numberOfTeams !== undefined && t.numberOfTeams > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{t.numberOfTeams} times</span>
                </div>
              )}
              {t.region && (
                <div className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium">
                  {t.region}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matches" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="matches">Partidas ({t.matches.length})</TabsTrigger>
          {t.brackets && t.brackets.length > 0 && (
            <TabsTrigger value="bracket">Chaveamento</TabsTrigger>
          )}
          <TabsTrigger value="teams">Times ({t.teams.length})</TabsTrigger>
        </TabsList>

        {/* Matches */}
        <TabsContent value="matches" className="space-y-6">
          {liveMatches.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Radio className="h-4 w-4 text-live" />
                Ao vivo ({liveMatches.length})
              </h3>
              <div className="flex flex-col gap-2">
                {liveMatches.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    isFavorite1={isFavorite(m.team1.id)}
                    isFavorite2={isFavorite(m.team2.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          )}

          {upcomingMatches.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Próximas ({upcomingMatches.length})
              </h3>
              <div className="flex flex-col gap-2">
                {upcomingMatches.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    isFavorite1={isFavorite(m.team1.id)}
                    isFavorite2={isFavorite(m.team2.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          )}

          {finishedMatches.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Encerradas ({finishedMatches.length})
              </h3>
              <div className="flex flex-col gap-2">
                {finishedMatches.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    isFavorite1={isFavorite(m.team1.id)}
                    isFavorite2={isFavorite(m.team2.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          )}

          {t.matches.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nenhuma partida disponível
            </div>
          )}
        </TabsContent>

        {/* Bracket */}
        {t.brackets && t.brackets.length > 0 && (
          <TabsContent value="bracket">
            <TournamentBracket rounds={t.brackets} />
          </TabsContent>
        )}

        {/* Teams */}
        <TabsContent value="teams">
          {t.teams.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nenhum time disponível
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {t.teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  {team.logo ? (
                    <img
                      src={team.logo || "/placeholder.svg"}
                      alt={team.name}
                      className="h-10 w-10 rounded bg-secondary object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-secondary text-sm font-bold">
                      {team.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {team.name}
                    </p>
                    {team.country && (
                      <p className="text-xs text-muted-foreground">{team.country}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
