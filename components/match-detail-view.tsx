"use client"

import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft, AlertCircle, Trophy, Clock, Radio } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { MatchDetail, HeadToHead } from "@/lib/types"
import { TeamRosterCard } from "./team-roster-card"
import { HeadToHeadStats } from "./head-to-head-stats"
import { MatchStreams } from "./match-streams"
import { MatchGames } from "./match-games"
import { ShareButton } from "./share-button"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface MatchDetailViewProps {
  matchId: string
}

export function MatchDetailView({ matchId }: MatchDetailViewProps) {
  const { data, error, isLoading } = useSWR<{
    match: MatchDetail
    headToHead: HeadToHead | null
  }>(`/api/matches/${matchId}`, fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error || !data?.match) {
    return (
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8">
          <AlertCircle className="mb-2 h-8 w-8 text-destructive" />
          <p className="font-medium text-destructive">Partida não encontrada</p>
          <p className="text-sm text-muted-foreground">
            Verifique o link ou tente novamente
          </p>
        </div>
      </div>
    )
  }

  const { match, headToHead } = data
  const isLive = match.status === "live"
  const isFinished = match.status === "finished"
  const isUpcoming = match.status === "upcoming"

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("pt-BR", {
      dateStyle: "long",
      timeStyle: "short",
    })

  const matchUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `/match/${matchId}`
  const shareText = `${match.team1.name} ${match.team1.score} x ${match.team2.score} ${match.team2.name} - ${match.tournament}`

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para partidas
        </Link>
        <ShareButton title={shareText} text={shareText} url={matchUrl} size="md" />
      </div>

      {/* Match Header Card */}
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-card",
          isLive && "border-live/40 shadow-lg shadow-live/5",
        )}
      >
        {/* Tournament info */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-3">
          <Link
            href={
              match.tournamentId
                ? `/tournaments/${match.tournamentId}`
                : "/tournaments"
            }
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {match.tournamentLogo && (
              <img
                src={match.tournamentLogo || "/placeholder.svg"}
                alt={match.tournament}
                className="h-5 w-5 rounded object-contain"
              />
            )}
            {match.tournament}
          </Link>

          {isLive && (
            <div className="flex items-center gap-1.5 rounded-full bg-live/20 px-3 py-1">
              <Radio className="h-3 w-3 animate-pulse text-live" />
              <span className="text-xs font-bold uppercase text-live">ao vivo</span>
            </div>
          )}
          {isFinished && (
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <Trophy className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Final</span>
            </div>
          )}
          {isUpcoming && (
            <div className="flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-primary">Em breve</span>
            </div>
          )}
        </div>

        {/* Score */}
        <div className="grid grid-cols-3 items-center gap-4 px-4 py-8 md:px-8 md:py-12">
          {/* Team 1 */}
          <div className="flex flex-col items-center gap-3 md:gap-4">
            {match.team1.logo ? (
              <img
                src={match.team1.logo || "/placeholder.svg"}
                alt={match.team1.name}
                className="h-20 w-20 rounded-xl bg-secondary object-contain p-2 md:h-28 md:w-28"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-secondary text-2xl font-bold md:h-28 md:w-28 md:text-3xl">
                {match.team1.name.charAt(0)}
              </div>
            )}
            <div className="text-center">
              <h2 className="text-base font-bold text-foreground md:text-xl">
                {match.team1.name}
              </h2>
              {match.team1.country && (
                <p className="text-xs text-muted-foreground">{match.team1.country}</p>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 md:gap-4">
              <span
                className={cn(
                  "text-5xl font-bold tabular-nums md:text-7xl",
                  isFinished && match.team1.score > match.team2.score
                    ? "text-win"
                    : "text-foreground",
                )}
              >
                {match.team1.score}
              </span>
              <span className="text-3xl font-light text-muted-foreground md:text-5xl">
                :
              </span>
              <span
                className={cn(
                  "text-5xl font-bold tabular-nums md:text-7xl",
                  isFinished && match.team2.score > match.team1.score
                    ? "text-win"
                    : "text-foreground",
                )}
              >
                {match.team2.score}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
              <span className="font-medium uppercase">Best of {match.bestOf}</span>
              <span>{formatDate(match.startTime)}</span>
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex flex-col items-center gap-3 md:gap-4">
            {match.team2.logo ? (
              <img
                src={match.team2.logo || "/placeholder.svg"}
                alt={match.team2.name}
                className="h-20 w-20 rounded-xl bg-secondary object-contain p-2 md:h-28 md:w-28"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-secondary text-2xl font-bold md:h-28 md:w-28 md:text-3xl">
                {match.team2.name.charAt(0)}
              </div>
            )}
            <div className="text-center">
              <h2 className="text-base font-bold text-foreground md:text-xl">
                {match.team2.name}
              </h2>
              {match.team2.country && (
                <p className="text-xs text-muted-foreground">{match.team2.country}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Streams */}
      {(isLive || isUpcoming) && match.streams && match.streams.length > 0 && (
        <MatchStreams streams={match.streams} />
      )}

      {/* Maps / Games */}
      {match.games && match.games.length > 0 && (
        <MatchGames match={match} games={match.games} />
      )}

      {/* Rosters */}
      {(match.team1Roster || match.team2Roster) && (
        <div className="grid gap-4 md:grid-cols-2">
          {match.team1Roster && <TeamRosterCard roster={match.team1Roster} />}
          {match.team2Roster && <TeamRosterCard roster={match.team2Roster} />}
        </div>
      )}

      {/* Head to Head */}
      {headToHead && headToHead.totalMatches > 0 && (
        <HeadToHeadStats
          headToHead={headToHead}
          team1Name={match.team1.name}
          team1Logo={match.team1.logo}
          team2Name={match.team2.name}
          team2Logo={match.team2.logo}
        />
      )}
    </div>
  )
}
