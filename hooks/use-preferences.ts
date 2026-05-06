"use client"

import { useState, useEffect, useCallback } from "react"

export type ViewMode = "card" | "compact"
export type SortMode = "time" | "tournament" | "favorites"

interface Preferences {
  viewMode: ViewMode
  sortMode: SortMode
  region: string
}

const STORAGE_KEY = "cs2-preferences"

const defaultPreferences: Preferences = {
  viewMode: "card",
  sortMode: "time",
  region: "all",
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences({ ...defaultPreferences, ...parsed })
      }
    } catch {
      // ignore
    }
    setIsLoaded(true)
  }, [])

  const updatePreferences = useCallback(
    (updates: Partial<Preferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...updates }
        if (isLoaded) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        }
        return next
      })
    },
    [isLoaded],
  )

  const setViewMode = useCallback(
    (viewMode: ViewMode) => updatePreferences({ viewMode }),
    [updatePreferences],
  )

  const setSortMode = useCallback(
    (sortMode: SortMode) => updatePreferences({ sortMode }),
    [updatePreferences],
  )

  const setRegion = useCallback(
    (region: string) => updatePreferences({ region }),
    [updatePreferences],
  )

  return {
    ...preferences,
    isLoaded,
    setViewMode,
    setSortMode,
    setRegion,
  }
}
