"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "cs2-notifications-enabled"
const NOTIFIED_KEY = "cs2-notified-matches"

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [enabled, setEnabled] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const isSupported = "Notification" in window
    setSupported(isSupported)
    if (isSupported) {
      setPermission(Notification.permission)
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    setEnabled(stored === "true")
  }, [])

  const requestPermission = useCallback(async () => {
    if (!supported) return false
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      const isGranted = result === "granted"
      setEnabled(isGranted)
      localStorage.setItem(STORAGE_KEY, String(isGranted))
      return isGranted
    } catch {
      return false
    }
  }, [supported])

  const toggle = useCallback(async () => {
    if (!enabled) {
      if (permission !== "granted") {
        return await requestPermission()
      }
      setEnabled(true)
      localStorage.setItem(STORAGE_KEY, "true")
      return true
    } else {
      setEnabled(false)
      localStorage.setItem(STORAGE_KEY, "false")
      return false
    }
  }, [enabled, permission, requestPermission])

  const notify = useCallback(
    (title: string, options?: NotificationOptions & { matchId?: string }) => {
      if (!enabled || permission !== "granted") return

      // Avoid duplicate notifications for the same match event
      if (options?.matchId) {
        const notified = JSON.parse(
          localStorage.getItem(NOTIFIED_KEY) || "[]",
        ) as string[]
        const key = `${options.matchId}:${options.tag || "default"}`
        if (notified.includes(key)) return
        notified.push(key)
        // Keep only last 100 entries
        const limited = notified.slice(-100)
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify(limited))
      }

      try {
        new Notification(title, {
          icon: "/favicon.png",
          badge: "/favicon.png",
          ...options,
        })
      } catch (error) {
        console.error("Notification failed:", error)
      }
    },
    [enabled, permission],
  )

  return {
    supported,
    permission,
    enabled,
    requestPermission,
    toggle,
    notify,
  }
}
