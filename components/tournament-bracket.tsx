"use client"

import Link from "next/link"
import type { BracketRound } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TournamentBracketProps {
  rounds: BracketRound[]
}

export function TournamentBracket({ rounds }: TournamentBracketProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
      <div className="flex min-w-max gap-6">
        {rounds.map((round) => (
          <div key={round.name} className="flex w-64 flex-shrink-0 flex-col gap-3">
            <h4 className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {round.name}
            </h4>
            <div className="flex flex-col gap-3">
              {round.matches.map((match) => (
                <Link
                  key={match.id}
                  href={`/match/${match.id}`}
                  className={cn(
                    "rounded-lg border border-border bg-secondary/30 p-2 transition-colors hover:border-primary/50",
                    match.status === "live" && "border-live/40",
                  )}
                >
                  <BracketTeam
                    team={match.team1}
                    isWinner={match.winner === "team1"}
                  />
                  <div className="my-1 border-t border-border/50" />
                  <BracketTeam
                    team={match.team2}
                    isWinner={match.winner === "team2"}
                  />
                  {match.status === "upcoming" && match.scheduledAt && (
                    <div className="mt-2 border-t border-border/50 pt-1.5 text-center text-[10px] text-muted-foreground">
                      {new Date(match.scheduledAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      {new Date(match.scheduledAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                  {match.status === "live" && (
                    <div className="mt-2 border-t border-border/50 pt-1.5 text-center text-[10px] font-bold uppercase text-live">
                      ao vivo
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BracketTeam({
  team,
  isWinner,
}: {
  team: { name: string; logo: string; score: number } | null
  isWinner: boolean
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground/50">
        <div className="h-5 w-5 rounded bg-secondary/50" />
        <span className="flex-1 truncate italic">A definir</span>
      </div>
    )
  }
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded px-1 py-1 text-xs",
        isWinner && "bg-win/10",
      )}
    >
      {team.logo ? (
        <img
          src={team.logo || "/placeholder.svg"}
          alt={team.name}
          className="h-5 w-5 rounded bg-secondary object-contain p-0.5"
        />
      ) : (
        <div className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-[9px] font-bold">
          {team.name.charAt(0)}
        </div>
      )}
      <span
        className={cn(
          "flex-1 truncate",
          isWinner ? "font-semibold text-win" : "text-foreground",
        )}
      >
        {team.name}
      </span>
      <span
        className={cn(
          "tabular-nums font-bold",
          isWinner ? "text-win" : "text-muted-foreground",
        )}
      >
        {team.score}
      </span>
    </div>
  )
}
