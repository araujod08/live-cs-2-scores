"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  CalendarPlus,
  Star,
  Radio,
  Clock,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useFavorites } from "@/hooks/use-favorites"
import { buildGoogleCalendarUrl } from "@/lib/ical"
import type { Match } from "@/lib/types"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const { favorites } = useFavorites()

  const favoritesParam = favoritesOnly
    ? `&favorites=${favorites.map((f) => f.id).join(",")}`
    : ""

  const { data, isLoading } = useSWR<{ matches: Match[] }>(
    `/api/calendar?_${favoritesOnly ? "fav" : "all"}${favoritesParam}`,
    fetcher,
  )

  const matches = data?.matches || []

  // Group matches by date string (YYYY-MM-DD in local time)
  const matchesByDate = useMemo(() => {
    const map = new Map<string, Match[]>()
    for (const m of matches) {
      const d = new Date(m.startTime)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    // Sort each day's matches by time
    map.forEach((arr) =>
      arr.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    )
    return map
  }, [matches])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startWeekDay = firstDay.getDay()

  const calendarDays: Array<{ date: Date | null; key: string }> = []
  for (let i = 0; i < startWeekDay; i++) {
    calendarDays.push({ date: null, key: `empty-${i}` })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    calendarDays.push({ date, key: `day-${day}` })
  }

  const today = new Date()
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const formatDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

  const selectedMatches = selectedDate
    ? matchesByDate.get(formatDateKey(selectedDate)) || []
    : []

  const goPrev = () => setCurrentDate(new Date(year, month - 1, 1))
  const goNext = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const exportUrl = `/api/calendar?format=ics${favoritesOnly ? `&favorites=${favorites.map((f) => f.id).join(",")}` : ""}`

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            aria-label="Mês anterior"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-[180px] text-center text-lg font-bold text-foreground">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={goNext}
            aria-label="Próximo mês"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          >
            Hoje
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {favorites.length > 0 && (
            <button
              onClick={() => setFavoritesOnly((v) => !v)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                favoritesOnly
                  ? "bg-accent/15 text-accent"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
              )}
            >
              <Star
                className={cn("h-3.5 w-3.5", favoritesOnly && "fill-accent")}
              />
              Apenas favoritos
            </button>
          )}
          <a
            href={exportUrl}
            download
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar .ics
          </a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Calendar grid */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Week days header */}
          <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
            {WEEK_DAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          {isLoading ? (
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="m-1 h-16 rounded" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map(({ date, key }) => {
                if (!date) {
                  return <div key={key} className="aspect-square sm:aspect-auto sm:h-24 border-b border-r border-border" />
                }

                const dayMatches = matchesByDate.get(formatDateKey(date)) || []
                const hasLive = dayMatches.some((m) => m.status === "live")
                const isToday = isSameDay(date, today)
                const isSelected = selectedDate && isSameDay(date, selectedDate)

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "relative flex flex-col items-start gap-1 border-b border-r border-border p-1.5 text-left transition-colors hover:bg-secondary/40 sm:p-2 aspect-square sm:aspect-auto sm:h-24",
                      isSelected && "bg-primary/10 ring-2 ring-primary ring-inset",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground",
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {dayMatches.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {hasLive && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
                        )}
                        <span className="text-[10px] font-semibold text-muted-foreground sm:text-xs">
                          {dayMatches.length} {dayMatches.length === 1 ? "jogo" : "jogos"}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected day panel */}
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-bold text-foreground">
              {selectedDate
                ? selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })
                : "Selecione um dia"}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {selectedMatches.length}{" "}
              {selectedMatches.length === 1 ? "partida agendada" : "partidas agendadas"}
            </p>
          </div>

          <div className="space-y-2">
            {selectedMatches.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card/50 py-8 text-center text-sm text-muted-foreground">
                Nenhuma partida neste dia
              </div>
            ) : (
              selectedMatches.map((m) => <DayMatchCard key={m.id} match={m} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DayMatchCard({ match }: { match: Match }) {
  const time = new Date(match.startTime).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const isLive = match.status === "live"
  const isFinished = match.status === "finished"

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
          <Trophy className="h-3 w-3" />
          <span className="truncate">{match.tournament}</span>
        </span>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            isLive && "bg-live/20 text-live",
            isFinished && "bg-muted text-muted-foreground",
            !isLive && !isFinished && "bg-primary/20 text-primary",
          )}
        >
          {isLive ? (
            <>
              <Radio className="h-2.5 w-2.5 animate-pulse" /> LIVE
            </>
          ) : (
            <>
              <Clock className="h-2.5 w-2.5" /> {time}
            </>
          )}
        </span>
      </div>

      <Link
        href={`/match/${match.id}`}
        className="flex items-center justify-between gap-2 p-3 transition-colors hover:bg-secondary/20"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.team1.logo ? (
            <img
              src={match.team1.logo || "/placeholder.svg"}
              alt={match.team1.name}
              className="h-6 w-6 flex-shrink-0 rounded bg-secondary object-contain p-0.5"
            />
          ) : (
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-bold">
              {match.team1.name.charAt(0)}
            </div>
          )}
          <span className="truncate text-xs font-medium text-foreground">
            {match.team1.name}
          </span>
        </div>

        <span className="text-xs font-bold tabular-nums text-foreground">
          {!isFinished && match.status !== "live"
            ? "vs"
            : `${match.team1.score} : ${match.team2.score}`}
        </span>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="truncate text-xs font-medium text-foreground text-right">
            {match.team2.name}
          </span>
          {match.team2.logo ? (
            <img
              src={match.team2.logo || "/placeholder.svg"}
              alt={match.team2.name}
              className="h-6 w-6 flex-shrink-0 rounded bg-secondary object-contain p-0.5"
            />
          ) : (
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-bold">
              {match.team2.name.charAt(0)}
            </div>
          )}
        </div>
      </Link>

      <div className="flex border-t border-border bg-secondary/20">
        <a
          href={buildGoogleCalendarUrl(match)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
        >
          <CalendarPlus className="h-3 w-3" />
          Google Calendar
        </a>
        <a
          href={`/api/calendar?format=ics&teamId=${match.team1.id}`}
          download
          className="flex flex-1 items-center justify-center gap-1.5 border-l border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
        >
          <Download className="h-3 w-3" />
          .ics
        </a>
      </div>
    </div>
  )
}
