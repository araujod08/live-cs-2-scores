"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TeamSuggestion {
  id: string
  name: string
  logo: string
  country: string
}

interface TeamSearchProps {
  value: string
  onChange: (value: string) => void
  onSelect: (team: TeamSuggestion | null) => void
}

export function TeamSearch({ value, onChange, onSelect }: TeamSearchProps) {
  const [suggestions, setSuggestions] = useState<TeamSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch(`/api/teams?search=${encodeURIComponent(value)}`)
        const data = await res.json()
        if (data.teams) {
          setSuggestions(data.teams)
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Failed to fetch team suggestions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (team: TeamSuggestion) => {
    onChange(team.name)
    onSelect(team)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange("")
    onSelect(null)
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            if (e.target.value === "") {
              onSelect(null)
            }
          }}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Buscar por time..."
          className="w-full rounded-lg border border-border bg-secondary py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {!isLoading && value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
          <ul className="max-h-64 overflow-auto py-1">
            {suggestions.map((team) => (
              <li key={team.id}>
                <button
                  onClick={() => handleSelect(team)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                >
                  {team.logo ? (
                    <img
                      src={team.logo || "/placeholder.svg"}
                      alt={team.name}
                      className="h-6 w-6 rounded object-contain"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                      {team.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-foreground">
                    {team.name}
                  </span>
                  {team.country && (
                    <span className="text-xs text-muted-foreground">
                      {team.country}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOpen && value && value.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-border bg-card p-4 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">Nenhum time encontrado</p>
        </div>
      )}
    </div>
  )
}
