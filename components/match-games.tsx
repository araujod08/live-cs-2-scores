"use client"

import { Map as MapIcon } from "lucide-react"
import type { Match, GameDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MatchGamesProps {
  match: Match
  games: GameDetail[]
}

export function MatchGames({ match, games }: MatchGamesProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3">
        <MapIcon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Mapas</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          Best of {match.bestOf}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {games.map((game) => {
          const isCurrent = game.status === "running"
          const isFinished = game.status === "finished"
          const winnerName =
            game.winner === "team1"
              ? match.team1.name
              : game.winner === "team2"
                ? match.team2.name
                : null
          const winnerLogo =
            game.winner === "team1"
              ? match.team1.logo
              : game.winner === "team2"
                ? match.team2.logo
                : null

          return (
            <li
              key={game.position}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors",
                isCurrent && "bg-live/5",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums",
                  isCurrent
                    ? "bg-live/20 text-live"
                    : isFinished
                      ? "bg-secondary text-foreground"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                {game.position}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {game.map || `Mapa ${game.position}`}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-live/15 px-2 py-0.5 text-[10px] font-bold uppercase text-live">
                      Em andamento
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {isCurrent ? "Live" : isFinished ? "Encerrado" : "Não jogado"}
                </span>
              </div>
              {winnerName && (
                <div className="flex items-center gap-2">
                  {winnerLogo && (
                    <img
                      src={winnerLogo || "/placeholder.svg"}
                      alt={winnerName}
                      className="h-6 w-6 rounded bg-secondary object-contain p-0.5"
                    />
                  )}
                  <span className="text-sm font-semibold text-win">{winnerName}</span>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
