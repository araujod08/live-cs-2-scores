import { NextResponse } from "next/server"
import { generateICalendar } from "@/lib/ical"
import type { Match } from "@/lib/types"

const API_TOKEN = process.env.PANDASCORE_API_KEY
const PANDASCORE_API = "https://api.pandascore.co"

async function safeFetch(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

function mapMatch(m: any): Match {
  const team1Raw = m.opponents?.[0]?.opponent || {}
  const team2Raw = m.opponents?.[1]?.opponent || {}
  const team1Score = m.results?.find((r: any) => r.team_id === team1Raw.id)?.score || 0
  const team2Score = m.results?.find((r: any) => r.team_id === team2Raw.id)?.score || 0

  let status: "live" | "upcoming" | "finished" = "upcoming"
  if (m.status === "running") status = "live"
  else if (m.status === "finished") status = "finished"

  return {
    id: String(m.id),
    team1: {
      id: String(team1Raw.id || ""),
      name: team1Raw.name || "TBD",
      logo: team1Raw.image_url || "",
      score: team1Score,
      country: team1Raw.location || "",
    },
    team2: {
      id: String(team2Raw.id || ""),
      name: team2Raw.name || "TBD",
      logo: team2Raw.image_url || "",
      score: team2Score,
      country: team2Raw.location || "",
    },
    status,
    tournament: m.league?.name || m.tournament?.name || "Tournament",
    tournamentId: m.tournament?.id ? String(m.tournament.id) : undefined,
    bestOf: m.number_of_games || 1,
    mapsWon: [team1Score, team2Score],
    startTime: m.scheduled_at || m.begin_at || new Date().toISOString(),
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format")
  const teamId = searchParams.get("teamId")
  const favoriteIds = searchParams.get("favorites")?.split(",").filter(Boolean) || []

  if (!API_TOKEN) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  const [running, upcoming, past] = await Promise.all([
    safeFetch(`${PANDASCORE_API}/csgo/matches/running?token=${API_TOKEN}&per_page=50`),
    safeFetch(`${PANDASCORE_API}/csgo/matches/upcoming?token=${API_TOKEN}&per_page=100`),
    safeFetch(`${PANDASCORE_API}/csgo/matches/past?token=${API_TOKEN}&per_page=50`),
  ])

  let allMatches = [...running, ...upcoming, ...past].map(mapMatch)

  // Filter by team if requested
  if (teamId) {
    allMatches = allMatches.filter(
      (m) => m.team1.id === teamId || m.team2.id === teamId,
    )
  } else if (favoriteIds.length > 0) {
    allMatches = allMatches.filter(
      (m) => favoriteIds.includes(m.team1.id) || favoriteIds.includes(m.team2.id),
    )
  }

  // Return iCal format
  if (format === "ics") {
    const ical = generateICalendar(allMatches, "CS2 Live - Partidas")
    return new NextResponse(ical, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="cs2-live.ics"',
      },
    })
  }

  return NextResponse.json({ matches: allMatches })
}
