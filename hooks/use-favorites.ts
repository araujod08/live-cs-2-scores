"use client"

import { useState, useEffect, useCallback } from "react"

export interface FavoriteTeam {
  id: string
  name: string
  logo: string
}

const STORAGE_KEY = "cs2-favorite-teams"

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setFavorites(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Failed to load favorites:", error)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when favorites change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    }
  }, [favorites, isLoaded])

  const addFavorite = useCallback((team: FavoriteTeam) => {
    setFavorites((prev) => {
      if (prev.some((t) => t.id === team.id)) return prev
      return [...prev, team]
    })
  }, [])

  const removeFavorite = useCallback((teamId: string) => {
    setFavorites((prev) => prev.filter((t) => t.id !== teamId))
  }, [])

  const toggleFavorite = useCallback((team: FavoriteTeam) => {
    setFavorites((prev) => {
      if (prev.some((t) => t.id === team.id)) {
        return prev.filter((t) => t.id !== team.id)
      }
      return [...prev, team]
    })
  }, [])

  const isFavorite = useCallback(
    (teamId: string) => favorites.some((t) => t.id === teamId),
    [favorites]
  )

  return {
    favorites,
    isLoaded,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  }
}
