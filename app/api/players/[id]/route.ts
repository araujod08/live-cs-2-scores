import { NextResponse } from "next/server"

const API_TOKEN = process.env.PANDASCORE_API_KEY
const PANDASCORE_API = "https://api.pandascore.co"

interface PandaPlayerApi {
  id: number
  name: string
  first_name?: string
  last_name?: string
  nationality?: string
  image_url?: string
  role?: string
  age?: number
  birthday?: string
  hometown?: string
  current_team?: {
    id: number
    name: string
    image_url?: string
    location?: string
    acronym?: string
  }
  current_videogame?: { name: string }
}

async function safeFetch(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 600 } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!API_TOKEN) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  // Try direct fetch
  let playerData = (await safeFetch(
    `${PANDASCORE_API}/csgo/players/${id}?token=${API_TOKEN}`,
  )) as PandaPlayerApi | null

  // Fallback: search players list
  if (!playerData) {
    const list = await safeFetch(
      `${PANDASCORE_API}/csgo/players?token=${API_TOKEN}&filter[id]=${id}&per_page=1`,
    )
    if (Array.isArray(list) && list.length > 0) {
      playerData = list[0]
    }
  }

  if (!playerData) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 })
  }

  const player = {
    id: String(playerData.id),
    name: playerData.name,
    firstName: playerData.first_name,
    lastName: playerData.last_name,
    nationality: playerData.nationality,
    imageUrl: playerData.image_url,
    role: playerData.role,
    age: playerData.age,
    birthday: playerData.birthday,
    hometown: playerData.hometown,
    currentTeam: playerData.current_team
      ? {
          id: String(playerData.current_team.id),
          name: playerData.current_team.name,
          logo: playerData.current_team.image_url || "",
          country: playerData.current_team.location || "",
          acronym: playerData.current_team.acronym || "",
        }
      : null,
  }

  // If we have a current team, fetch their recent matches
  let recentMatches: any[] = []
  if (player.currentTeam) {
    const teamId = player.currentTeam.id
    const [running, upcoming, past] = await Promise.all([
      safeFetch(`${PANDASCORE_API}/csgo/matches/running?token=${API_TOKEN}&per_page=30`),
      safeFetch(`${PANDASCORE_API}/csgo/matches/upcoming?token=${API_TOKEN}&per_page=30`),
      safeFetch(`${PANDASCORE_API}/csgo/matches/past?token=${API_TOKEN}&per_page=50`),
    ])

    const allRaw = [...(running || []), ...(upcoming || []), ...(past || [])]
    recentMatches = allRaw
      .filter((m: any) => {
        const t1 = m.opponents?.[0]?.opponent?.id
        const t2 = m.opponents?.[1]?.opponent?.id
        return String(t1) === teamId || String(t2) === teamId
      })
      .slice(0, 10)
      .map((m: any) => {
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
          bestOf: m.number_of_games || 1,
          mapsWon: [team1Score, team2Score],
          startTime: m.scheduled_at || m.begin_at || new Date().toISOString(),
        }
      })
  }

  return NextResponse.json({ player, recentMatches })
}
