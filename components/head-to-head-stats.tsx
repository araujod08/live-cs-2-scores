"use client"

import Link from "next/link"
import { Swords } from "lucide-react"
import type { HeadToHead } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HeadToHeadStatsProps {
  headToHead: HeadToHead
  team1Name: string
  team1Logo: string
  team2Name: string
  team2Logo: string
}

export function HeadToHeadStats({
  headToHead,
  team1Name,
  team1Logo,
  team2Name,
  team2Logo,
}: HeadToHeadStatsProps) {
  const total = headToHead.totalMatches || 1
  const team1Pct = (headToHead.team1Wins / total) * 100
  const team2Pct = (headToHead.team2Wins / total) * 100

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3">
        <Swords className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Confrontos diretos
        </h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {headToHead.totalMatches} {headToHead.totalMatches === 1 ? "partida" : "partidas"}
        </span>
      </div>

      <div className="px-4 py-5">
        {/* Win comparison */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {team1Logo && (
              <img
                src={team1Logo || "/placeholder.svg"}
                alt={team1Name}
                className="h-8 w-8 rounded bg-secondary object-contain p-0.5"
              />
            )}
            <div>
              <p className="text-2xl font-bold text-win tabular-nums">
                {headToHead.team1Wins}
              </p>
              <p className="text-xs text-muted-foreground">{team1Name}</p>
            </div>
          </div>

          <span className="text-sm font-medium text-muted-foreground">vs</span>

          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="text-2xl font-bold text-win tabular-nums">
                {headToHead.team2Wins}
              </p>
              <p className="text-xs text-muted-foreground">{team2Name}</p>
            </div>
            {team2Logo && (
              <img
                src={team2Logo || "/placeholder.svg"}
                alt={team2Name}
                className="h-8 w-8 rounded bg-secondary object-contain p-0.5"
              />
            )}
          </div>
        </div>

        {/* Bar */}
        <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="bg-primary transition-all"
            style={{ width: `${team1Pct}%` }}
          />
          <div
            className="bg-accent transition-all"
            style={{ width: `${team2Pct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{team1Pct.toFixed(0)}%</span>
          <span>{team2Pct.toFixed(0)}%</span>
        </div>
      </div>

      {/* Recent matches */}
      {headToHead.recentMatches.length > 0 && (
        <div className="border-t border-border">
          <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Últimos confrontos
          </p>
          <ul className="divide-y divide-border">
            {headToHead.recentMatches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/match/${m.id}`}
                  className="flex items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">
                      {new Date(m.date).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {m.tournament}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        m.winner === "team1" ? "text-win" : "text-foreground",
                      )}
                    >
                      {m.team1Score}
                    </span>
                    <span className="text-xs text-muted-foreground">:</span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        m.winner === "team2" ? "text-win" : "text-foreground",
                      )}
                    >
                      {m.team2Score}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
