"use client"

import Link from "next/link"
import { Radio, Clock, Trophy, Star } from "lucide-react"
import type { Match } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MatchRowProps {
  match: Match
  isFavorite1?: boolean
  isFavorite2?: boolean
  onToggleFavorite?: (team: { id: string; name: string; logo: string }) => void
}

export function MatchRow({ match, isFavorite1, isFavorite2, onToggleFavorite }: MatchRowProps) {
  const isLive = match.status === "live"
  const isFinished = match.status === "finished"
  const isUpcoming = match.status === "upcoming"

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })

  const team1Won = isFinished && match.team1.score > match.team2.score
  const team2Won = isFinished && match.team2.score > match.team1.score

  return (
    <Link
      href={`/match/${match.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:bg-card/80",
        isLive && "border-live/40",
      )}
    >
      {/* Status */}
      <div className="flex w-20 flex-shrink-0 flex-col items-start gap-1">
        {isLive && (
          <div className="flex items-center gap-1 rounded-full bg-live/20 px-2 py-0.5">
            <Radio className="h-2.5 w-2.5 animate-pulse text-live" />
            <span className="text-[10px] font-bold uppercase text-live">live</span>
          </div>
        )}
        {isUpcoming && (
          <div className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5">
            <Clock className="h-2.5 w-2.5 text-primary" />
            <span className="text-[10px] font-medium text-primary">
              {formatTime(match.startTime)}
            </span>
          </div>
        )}
        {isFinished && (
          <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
            <Trophy className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">final</span>
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <div className="relative flex-shrink-0">
            {match.team1.logo ? (
              <img
                src={match.team1.logo || "/placeholder.svg"}
                alt={match.team1.name}
                className="h-7 w-7 rounded bg-secondary object-contain p-0.5"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-[10px] font-bold">
                {match.team1.name.charAt(0)}
              </div>
            )}
          </div>
          <span
            className={cn(
              "truncate text-sm font-medium",
              team1Won ? "text-win" : "text-foreground",
            )}
          >
            {match.team1.name}
          </span>
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onToggleFavorite({
                  id: match.team1.id,
                  name: match.team1.name,
                  logo: match.team1.logo,
                })
              }}
              className="flex-shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Favoritar"
            >
              <Star
                className={cn(
                  "h-3 w-3",
                  isFavorite1 ? "fill-accent text-accent opacity-100" : "text-muted-foreground",
                )}
              />
            </button>
          )}
        </div>

        {/* Score */}
        <div className="flex flex-shrink-0 items-center gap-2 px-2">
          <span
            className={cn(
              "text-base font-bold tabular-nums",
              team1Won ? "text-win" : "text-foreground",
              isUpcoming && "text-muted-foreground/50",
            )}
          >
            {match.team1.score}
          </span>
          <span className="text-xs text-muted-foreground">:</span>
          <span
            className={cn(
              "text-base font-bold tabular-nums",
              team2Won ? "text-win" : "text-foreground",
              isUpcoming && "text-muted-foreground/50",
            )}
          >
            {match.team2.score}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onToggleFavorite({
                  id: match.team2.id,
                  name: match.team2.name,
                  logo: match.team2.logo,
                })
              }}
              className="flex-shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Favoritar"
            >
              <Star
                className={cn(
                  "h-3 w-3",
                  isFavorite2 ? "fill-accent text-accent opacity-100" : "text-muted-foreground",
                )}
              />
            </button>
          )}
          <span
            className={cn(
              "truncate text-sm font-medium text-right",
              team2Won ? "text-win" : "text-foreground",
            )}
          >
            {match.team2.name}
          </span>
          <div className="relative flex-shrink-0">
            {match.team2.logo ? (
              <img
                src={match.team2.logo || "/placeholder.svg"}
                alt={match.team2.name}
                className="h-7 w-7 rounded bg-secondary object-contain p-0.5"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-[10px] font-bold">
                {match.team2.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tournament */}
      <div className="hidden w-32 flex-shrink-0 truncate text-right text-xs text-muted-foreground md:block">
        {match.tournament}
      </div>
    </Link>
  )
}
