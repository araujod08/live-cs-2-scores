"use client"

import { useEffect, useRef } from "react"
import type { Match } from "@/lib/types"
import { useNotifications } from "./use-notifications"

interface UseMatchWatcherParams {
  matches: Match[]
  favoriteIds: string[]
}

interface MatchSnapshot {
  status: Match["status"]
  scoreSum: number
}

export function useMatchWatcher({ matches, favoriteIds }: UseMatchWatcherParams) {
  const { enabled, notify } = useNotifications()
  const previousState = useRef<Map<string, MatchSnapshot>>(new Map())
  const upcomingNotified = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled || favoriteIds.length === 0) return

    const favoriteSet = new Set(favoriteIds)
    const now = Date.now()

    matches.forEach((match) => {
      const isFavoriteMatch =
        favoriteSet.has(match.team1.id) || favoriteSet.has(match.team2.id)
      if (!isFavoriteMatch) return

      const prev = previousState.current.get(match.id)
      const currentScoreSum = match.team1.score + match.team2.score
      const matchupTitle = `${match.team1.name} vs ${match.team2.name}`

      // Match went live
      if (prev && prev.status !== "live" && match.status === "live") {
        notify(`${matchupTitle} esta ao vivo agora!`, {
          body: match.tournament,
          tag: `live-${match.id}`,
          matchId: match.id,
        })
      }

      // Match just finished
      if (prev && prev.status === "live" && match.status === "finished") {
        const winner =
          match.team1.score > match.team2.score
            ? match.team1.name
            : match.team2.name
        notify(`${matchupTitle} encerrada`, {
          body: `Vencedor: ${winner} (${match.team1.score}-${match.team2.score})`,
          tag: `finished-${match.id}`,
          matchId: match.id,
        })
      }

      // Score change in live match
      if (
        prev &&
        match.status === "live" &&
        prev.status === "live" &&
        currentScoreSum !== prev.scoreSum
      ) {
        // do not flood: only notify on map win (mapsWon change handled implicitly through score)
      }

      // Upcoming match starting in <= 15 min
      if (match.status === "upcoming" && !upcomingNotified.current.has(match.id)) {
        const startMs = new Date(match.startTime).getTime()
        const diff = startMs - now
        if (diff > 0 && diff <= 15 * 60 * 1000) {
          notify(`${matchupTitle} comeca em breve`, {
            body: `${match.tournament} - ${new Date(match.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
            tag: `upcoming-${match.id}`,
            matchId: match.id,
          })
          upcomingNotified.current.add(match.id)
        }
      }

      previousState.current.set(match.id, {
        status: match.status,
        scoreSum: currentScoreSum,
      })
    })
  }, [matches, favoriteIds, enabled, notify])
}
