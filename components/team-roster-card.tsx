"use client"

import Link from "next/link"
import { Users } from "lucide-react"
import type { TeamRoster } from "@/lib/types"
import { getCountryFlag } from "@/lib/regions"

interface TeamRosterCardProps {
  roster: TeamRoster
}

export function TeamRosterCard({ roster }: TeamRosterCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Link
        href={`/team/${roster.id}`}
        className="flex items-center gap-3 border-b border-border bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary/60"
      >
        {roster.logo ? (
          <img
            src={roster.logo || "/placeholder.svg"}
            alt={roster.name}
            className="h-8 w-8 rounded bg-secondary object-contain p-0.5"
          />
        ) : (
          <Users className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">{roster.name}</h3>
          <p className="text-xs text-muted-foreground">Ver perfil do time</p>
        </div>
        {roster.country && (
          <span className="text-lg" title={roster.country}>
            {getCountryFlag(roster.country)}
          </span>
        )}
      </Link>

      {roster.players.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          Roster não disponível
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {roster.players.map((player) => (
            <li key={player.id}>
              <Link
                href={`/player/${player.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
              >
              {player.imageUrl ? (
                <img
                  src={player.imageUrl || "/placeholder.svg"}
                  alt={player.name}
                  className="h-9 w-9 rounded-full bg-secondary object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                  {(player.firstName?.[0] || player.name[0] || "?").toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {player.name}
                  </span>
                  {player.nationality && (
                    <span className="text-sm" title={player.nationality}>
                      {getCountryFlag(player.nationality)}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {[player.firstName, player.lastName].filter(Boolean).join(" ") ||
                    player.role ||
                    "Player"}
                </p>
              </div>
              {player.age && (
                <span className="text-xs font-medium text-muted-foreground">
                  {player.age} anos
                </span>
              )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
