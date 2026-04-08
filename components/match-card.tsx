"use client"

import { ExternalLink, Radio, Clock, Trophy, Star } from "lucide-react"
import type { Match } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MatchCardProps {
  match: Match
  isFavorite1?: boolean
  isFavorite2?: boolean
  onToggleFavorite?: (team: { id: string; name: string; logo: string }) => void
}

export function MatchCard({ match, isFavorite1, isFavorite2, onToggleFavorite }: MatchCardProps) {
  const isLive = match.status === "live"
  const isFinished = match.status === "finished"
  const isUpcoming = match.status === "upcoming"

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTeamInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 3)
      .toUpperCase()
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        isLive && "border-live/50 shadow-lg shadow-live/10"
      )}
    >
      {/* Tournament Header */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {match.tournament}
        </span>
        <div className="flex items-center gap-2">
          {isLive && (
            <div className="flex items-center gap-1.5 rounded-full bg-live/20 px-2 py-0.5">
              <Radio className="h-3 w-3 animate-pulse text-live" />
              <span className="text-xs font-semibold text-live">LIVE</span>
            </div>
          )}
          {isFinished && (
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5">
              <Trophy className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Encerrado
              </span>
            </div>
          )}
          {isUpcoming && (
            <div className="flex items-center gap-1.5 rounded-full bg-primary/20 px-2 py-0.5">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-primary">
                {formatTime(match.startTime)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Games / Maps Progress */}
      {!isUpcoming && match.games && match.games.length > 0 && (
        <div className="border-b border-border bg-secondary/30 px-4 py-2">
          <div className="flex items-center justify-center gap-2">
            {match.games.map((game) => {
              const isCurrentGame = game.status === "running"
              return (
                <div
                  key={game.position}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2 py-1 text-xs",
                    isCurrentGame
                      ? "bg-live/10 ring-1 ring-live/30"
                      : "bg-secondary/60"
                  )}
                >
                  {isCurrentGame && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
                  )}
                  <span
                    className={cn(
                      "font-medium",
                      isCurrentGame
                        ? "text-live"
                        : game.winner === "team1"
                          ? "text-win"
                          : game.winner === "team2"
                            ? "text-destructive"
                            : "text-muted-foreground"
                    )}
                  >
                    {game.map || `Mapa ${game.position}`}
                  </span>
                  {game.winner && (
                    <span className="text-[10px] text-muted-foreground">
                      {game.winner === "team1"
                        ? match.team1.name.substring(0, 4).toUpperCase()
                        : match.team2.name.substring(0, 4).toUpperCase()}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Match Content */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Team 1 */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="relative">
              {match.team1.logo ? (
                <img
                  src={match.team1.logo || "/placeholder.svg"}
                  alt={match.team1.name}
                  className="h-16 w-16 rounded-lg bg-secondary object-contain p-1"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-xl font-bold text-muted-foreground">
                  {getTeamInitials(match.team1.name)}
                </div>
              )}
              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite({ id: match.team1.id, name: match.team1.name, logo: match.team1.logo })}
                  className="absolute -right-1 -top-1 rounded-full bg-card p-1 shadow-md transition-transform hover:scale-110"
                >
                  <Star className={cn("h-3.5 w-3.5", isFavorite1 ? "fill-accent text-accent" : "text-muted-foreground")} />
                </button>
              )}
            </div>
            <span className="text-center text-sm font-semibold text-foreground">
              {match.team1.name}
            </span>
            {!isUpcoming && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Mapas:</span>
                <span className="font-semibold text-foreground">
                  {match.mapsWon[0]}
                </span>
              </div>
            )}
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-4xl font-bold tabular-nums",
                  isFinished && match.team1.score > match.team2.score
                    ? "text-win"
                    : "text-foreground"
                )}
              >
                {match.team1.score}
              </span>
              <span className="text-2xl font-light text-muted-foreground">
                :
              </span>
              <span
                className={cn(
                  "text-4xl font-bold tabular-nums",
                  isFinished && match.team2.score > match.team1.score
                    ? "text-win"
                    : "text-foreground"
                )}
              >
                {match.team2.score}
              </span>
            </div>
            {isUpcoming && (
              <span className="text-xs text-muted-foreground">
                Bo{match.bestOf}
              </span>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="relative">
              {match.team2.logo ? (
                <img
                  src={match.team2.logo || "/placeholder.svg"}
                  alt={match.team2.name}
                  className="h-16 w-16 rounded-lg bg-secondary object-contain p-1"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-xl font-bold text-muted-foreground">
                  {getTeamInitials(match.team2.name)}
                </div>
              )}
              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite({ id: match.team2.id, name: match.team2.name, logo: match.team2.logo })}
                  className="absolute -right-1 -top-1 rounded-full bg-card p-1 shadow-md transition-transform hover:scale-110"
                >
                  <Star className={cn("h-3.5 w-3.5", isFavorite2 ? "fill-accent text-accent" : "text-muted-foreground")} />
                </button>
              )}
            </div>
            <span className="text-center text-sm font-semibold text-foreground">
              {match.team2.name}
            </span>
            {!isUpcoming && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Mapas:</span>
                <span className="font-semibold text-foreground">
                  {match.mapsWon[1]}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {isLive && match.streamUrl && (
        <div className="border-t border-border bg-secondary/30 px-4 py-2">
          <a
            href={match.streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            <ExternalLink className="h-3 w-3" />
            Assistir ao vivo
          </a>
        </div>
      )}
    </div>
  )
}
