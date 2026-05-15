"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { X, Maximize2, Radio, GripVertical, ExternalLink } from "lucide-react"
import { useSpectator } from "@/hooks/use-spectator"
import { cn } from "@/lib/utils"
import type { Match } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SpectatorMiniPlayer() {
  const { spectatedMatchId, stopSpectating } = useSpectator()
  const pathname = usePathname()
  const [minimized, setMinimized] = useState(false)

  // Hide when viewing the actual match page
  const onMatchPage = spectatedMatchId && pathname === `/match/${spectatedMatchId}`

  const { data } = useSWR<{ match?: Match }>(
    spectatedMatchId && !onMatchPage ? `/api/matches/${spectatedMatchId}` : null,
    fetcher,
    { refreshInterval: 15000 },
  )

  // Auto-stop spectating if match is finished and 1h has passed
  useEffect(() => {
    if (data?.match?.status === "finished") {
      const finishedAt = new Date(data.match.startTime).getTime() + 3 * 60 * 60 * 1000
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      if (finishedAt < oneHourAgo) {
        stopSpectating()
      }
    }
  }, [data, stopSpectating])

  if (!spectatedMatchId || onMatchPage || !data?.match) return null

  const match = data.match
  const isLive = match.status === "live"

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-card border border-border shadow-xl px-3 py-2 hover:bg-secondary transition-colors"
        aria-label="Expandir player"
      >
        {isLive && <Radio className="h-3.5 w-3.5 animate-pulse text-live" />}
        <span className="text-xs font-bold text-foreground tabular-nums">
          {match.team1.score} : {match.team2.score}
        </span>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    )
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-80 overflow-hidden rounded-lg border bg-card shadow-2xl",
        isLive ? "border-live/50" : "border-border",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <>
              <Radio className="h-3 w-3 animate-pulse text-live" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-live">
                Ao vivo
              </span>
            </>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Acompanhando
            </span>
          )}
          <span className="ml-2 truncate text-[10px] text-muted-foreground">
            {match.tournament}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Minimizar"
          >
            <GripVertical className="h-3 w-3" />
          </button>
          <Link
            href={`/match/${match.id}`}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Abrir partida completa"
          >
            <Maximize2 className="h-3 w-3" />
          </Link>
          <button
            onClick={stopSpectating}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
            aria-label="Fechar"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <Link href={`/match/${match.id}`} className="block p-3 hover:bg-secondary/20">
        <div className="flex items-center justify-between gap-3">
          {/* Team 1 */}
          <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
            {match.team1.logo ? (
              <img
                src={match.team1.logo || "/placeholder.svg"}
                alt={match.team1.name}
                className="h-8 w-8 rounded bg-secondary object-contain p-0.5"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary text-xs font-bold text-muted-foreground">
                {match.team1.name.charAt(0)}
              </div>
            )}
            <span className="text-[10px] font-medium text-foreground truncate w-full text-center">
              {match.team1.name}
            </span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-2xl font-bold tabular-nums",
                match.status === "finished" && match.team1.score > match.team2.score
                  ? "text-win"
                  : "text-foreground",
              )}
            >
              {match.team1.score}
            </span>
            <span className="text-sm text-muted-foreground">:</span>
            <span
              className={cn(
                "text-2xl font-bold tabular-nums",
                match.status === "finished" && match.team2.score > match.team1.score
                  ? "text-win"
                  : "text-foreground",
              )}
            >
              {match.team2.score}
            </span>
          </div>

          {/* Team 2 */}
          <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
            {match.team2.logo ? (
              <img
                src={match.team2.logo || "/placeholder.svg"}
                alt={match.team2.name}
                className="h-8 w-8 rounded bg-secondary object-contain p-0.5"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary text-xs font-bold text-muted-foreground">
                {match.team2.name.charAt(0)}
              </div>
            )}
            <span className="text-[10px] font-medium text-foreground truncate w-full text-center">
              {match.team2.name}
            </span>
          </div>
        </div>
      </Link>

      {/* Footer */}
      {match.streamUrl && (
        <a
          href={match.streamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 border-t border-border bg-secondary/30 px-3 py-1.5 text-[10px] font-medium text-primary hover:bg-secondary/50"
        >
          <ExternalLink className="h-3 w-3" />
          Assistir transmissão
        </a>
      )}
    </div>
  )
}
