"use client"

import { useEffect, useState, useCallback } from "react"

const STORAGE_KEY = "cs2-spectated-match"

export function useSpectator() {
  const [spectatedMatchId, setSpectatedMatchId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setSpectatedMatchId(stored)
    } catch {
      // ignore
    }

    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setSpectatedMatchId(e.newValue)
      }
    }

    function onCustom() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        setSpectatedMatchId(stored)
      } catch {
        // ignore
      }
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener("cs2-spectator-change", onCustom)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("cs2-spectator-change", onCustom)
    }
  }, [])

  const spectate = useCallback((matchId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, matchId)
      setSpectatedMatchId(matchId)
      window.dispatchEvent(new CustomEvent("cs2-spectator-change"))
    } catch {
      // ignore
    }
  }, [])

  const stopSpectating = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setSpectatedMatchId(null)
      window.dispatchEvent(new CustomEvent("cs2-spectator-change"))
    } catch {
      // ignore
    }
  }, [])

  return {
    spectatedMatchId: mounted ? spectatedMatchId : null,
    spectate,
    stopSpectating,
    isSpectating: mounted && !!spectatedMatchId,
  }
}
