"use client"

import Link from "next/link"
import { Calendar, Trophy, DollarSign, Users, Radio } from "lucide-react"
import type { Tournament } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TournamentCardProps {
  tournament: Tournament
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const isRunning = tournament.status === "running"
  const isUpcoming = tournament.status === "upcoming"

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        isRunning && "border-live/40",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        {tournament.leagueLogo ? (
          <img
            src={tournament.leagueLogo || "/placeholder.svg"}
            alt={tournament.league}
            className="h-12 w-12 rounded-lg bg-secondary object-contain p-1"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
            <Trophy className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {tournament.fullName || tournament.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {tournament.league}
          </p>
          {tournament.serie && (
            <p className="truncate text-[11px] text-muted-foreground/70">
              {tournament.serie}
            </p>
          )}
        </div>
        {isRunning && (
          <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-live/20 px-2 py-0.5">
            <Radio className="h-2.5 w-2.5 animate-pulse text-live" />
            <span className="text-[10px] font-bold uppercase text-live">live</span>
          </div>
        )}
        {isUpcoming && (
          <div className="flex flex-shrink-0 items-center rounded-full bg-primary/15 px-2 py-0.5">
            <span className="text-[10px] font-bold uppercase text-primary">em breve</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-auto flex flex-col gap-2 border-t border-border bg-secondary/30 p-4 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {formatDate(tournament.beginAt)}
            {tournament.endAt && ` - ${formatDate(tournament.endAt)}`}
          </span>
        </div>
        {tournament.prizepool && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{tournament.prizepool}</span>
          </div>
        )}
        {tournament.numberOfTeams !== undefined && tournament.numberOfTeams > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{tournament.numberOfTeams} times</span>
          </div>
        )}
        {tournament.tier && (
          <div className="flex items-center gap-2">
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
              Tier {tournament.tier}
            </span>
            {tournament.region && (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {tournament.region}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
