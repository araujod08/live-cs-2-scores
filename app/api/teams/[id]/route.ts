import { NextResponse } from "next/server"
import type { Match } from "@/lib/types"

const API_TOKEN = process.env.PANDASCORE_API_KEY
const PANDASCORE_API = "https://api.pandascore.co"

interface PandaTeamApi {
  id: number
  name: string
  acronym?: string
  image_url?: string
  location?: string
  slug?: string
  current_videogame?: { name: string }
  players?: Array<{
    id: number
    name: string
    first_name?: string
    last_name?: string
    nationality?: string
    image_url?: string
    role?: string
    age?: number
  }>
}

async function safeFetch(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 120 } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
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
    streamUrl: m.streams_list?.[0]?.raw_url,
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

  // 1) Fetch team using filter[id] (free plan compatible — direct /teams/{id} returns 404)
  const teamList = (await safeFetch(
    `${PANDASCORE_API}/csgo/teams?token=${API_TOKEN}&filter%5Bid%5D=${id}`,
  )) as PandaTeamApi[] | null
  const teamData = teamList?.[0] ?? null

  // 2) Fetch matches from all lists then filter for this team
  const [running, upcoming, past] = await Promise.all([
    safeFetch(`${PANDASCORE_API}/csgo/matches/running?token=${API_TOKEN}&per_page=50`),
    safeFetch(`${PANDASCORE_API}/csgo/matches/upcoming?token=${API_TOKEN}&per_page=50`),
    safeFetch(`${PANDASCORE_API}/csgo/matches/past?token=${API_TOKEN}&per_page=100`),
  ])

  const allRaw = [...(running || []), ...(upcoming || []), ...(past || [])]

  const teamMatchesRaw = allRaw.filter((m: any) => {
    const t1 = m.opponents?.[0]?.opponent?.id
    const t2 = m.opponents?.[1]?.opponent?.id
    return String(t1) === id || String(t2) === id
  })

  // Build team info: prefer direct fetch, fallback to extracting from match data
  let team: {
    id: string
    name: string
    logo: string
    country: string
    acronym: string
    players: Array<{
      id: string
      name: string
      firstName?: string
      lastName?: string
      nationality?: string
      imageUrl?: string
      role?: string
      age?: number
    }>
  } | null = null

  if (teamData) {
    team = {
      id: String(teamData.id),
      name: teamData.name,
      logo: teamData.image_url || "",
      country: teamData.location || "",
      acronym: teamData.acronym || "",
      players: (teamData.players || []).map((p) => ({
        id: String(p.id),
        name: p.name,
        firstName: p.first_name,
        lastName: p.last_name,
        nationality: p.nationality,
        imageUrl: p.image_url,
        role: p.role,
        age: p.age,
      })),
    }
  } else if (teamMatchesRaw.length > 0) {
    const sample = teamMatchesRaw[0]
    const rawTeam =
      String(sample.opponents?.[0]?.opponent?.id) === id
        ? sample.opponents?.[0]?.opponent
        : sample.opponents?.[1]?.opponent
    team = {
      id,
      name: rawTeam?.name || "Unknown Team",
      logo: rawTeam?.image_url || "",
      country: rawTeam?.location || "",
      acronym: rawTeam?.acronym || "",
      players: [],
    }
  }

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 })
  }

  const matches = teamMatchesRaw.map(mapMatch).sort((a, b) => {
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  })

  // Compute stats
  const finished = matches.filter((m) => m.status === "finished")
  let wins = 0
  let losses = 0
  finished.forEach((m) => {
    const isTeam1 = m.team1.id === id
    const ownScore = isTeam1 ? m.team1.score : m.team2.score
    const oppScore = isTeam1 ? m.team2.score : m.team1.score
    if (ownScore > oppScore) wins++
    else if (oppScore > ownScore) losses++
  })

  const winRate = finished.length > 0 ? wins / finished.length : 0

  // Tournaments participated in
  const tournamentSet = new Set<string>()
  matches.forEach((m) => {
    if (m.tournament) tournamentSet.add(m.tournament)
  })

  return NextResponse.json({
    team,
    stats: {
      totalMatches: finished.length,
      wins,
      losses,
      winRate,
      tournamentsCount: tournamentSet.size,
      upcomingCount: matches.filter((m) => m.status === "upcoming").length,
      liveCount: matches.filter((m) => m.status === "live").length,
    },
    matches,
    tournaments: Array.from(tournamentSet),
  })
}
