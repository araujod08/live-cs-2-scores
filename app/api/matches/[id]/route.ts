import { NextResponse } from "next/server"

const PANDASCORE_API = "https://api.pandascore.co"
const API_TOKEN = process.env.PANDASCORE_API_KEY

interface PandaScorePlayer {
  id: number
  name: string
  first_name?: string | null
  last_name?: string | null
  nationality?: string | null
  image_url?: string | null
  role?: string | null
  age?: number | null
}

interface PandaScoreTeam {
  id: number
  name: string
  image_url: string | null
  location: string | null
  players?: PandaScorePlayer[]
}

async function fetchPandaScore<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${PANDASCORE_API}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!API_TOKEN) {
    return NextResponse.json(
      { error: "PANDASCORE_API_KEY not configured" },
      { status: 500 },
    )
  }

  try {
    const match = await fetchPandaScore<any>(
      `/csgo/matches/${id}?token=${API_TOKEN}`,
    )

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    const opponents = match.opponents || []
    if (opponents.length < 2) {
      return NextResponse.json(
        { error: "Invalid match data" },
        { status: 400 },
      )
    }

    const team1 = opponents[0].opponent
    const team2 = opponents[1].opponent

    // Fetch team details with players
    const [team1Data, team2Data, headToHead] = await Promise.all([
      fetchPandaScore<PandaScoreTeam>(
        `/csgo/teams/${team1.id}?token=${API_TOKEN}`,
      ),
      fetchPandaScore<PandaScoreTeam>(
        `/csgo/teams/${team2.id}?token=${API_TOKEN}`,
      ),
      fetchPandaScore<any[]>(
        `/csgo/matches/past?token=${API_TOKEN}&filter[opponent_id]=${team1.id},${team2.id}&per_page=10`,
      ),
    ])

    // Calculate maps won
    let team1Maps = 0
    let team2Maps = 0
    const games = match.games || []
    for (const game of games) {
      if (game.winner) {
        if (game.winner.id === team1.id) team1Maps++
        else if (game.winner.id === team2.id) team2Maps++
      }
    }

    const team1Result = match.results?.find(
      (r: any) => r.team_id === team1.id,
    )
    const team2Result = match.results?.find(
      (r: any) => r.team_id === team2.id,
    )
    const team1Score = team1Result?.score ?? opponents[0].score ?? team1Maps
    const team2Score = team2Result?.score ?? opponents[1].score ?? team2Maps

    // Process head-to-head
    const validHeadToHead = (headToHead || []).filter((m: any) => {
      const ids = (m.opponents || []).map((o: any) => o.opponent.id)
      return ids.includes(team1.id) && ids.includes(team2.id)
    })

    let team1Wins = 0
    let team2Wins = 0
    let draws = 0
    const recentMatches = validHeadToHead.slice(0, 5).map((m: any) => {
      const r1 = m.results?.find((r: any) => r.team_id === team1.id)
      const r2 = m.results?.find((r: any) => r.team_id === team2.id)
      const s1 = r1?.score ?? 0
      const s2 = r2?.score ?? 0
      let winner: "team1" | "team2" | "draw" = "draw"
      if (s1 > s2) {
        winner = "team1"
        team1Wins++
      } else if (s2 > s1) {
        winner = "team2"
        team2Wins++
      } else {
        draws++
      }
      return {
        id: String(m.id),
        date: m.begin_at || m.scheduled_at,
        team1Score: s1,
        team2Score: s2,
        winner,
        tournament: m.league?.name || m.tournament?.name || "Unknown",
      }
    })

    const status =
      match.status === "running"
        ? "live"
        : match.status === "finished"
          ? "finished"
          : "upcoming"

    const detail = {
      id: String(match.id),
      team1: {
        id: String(team1.id),
        name: team1.name,
        logo: team1.image_url || "",
        score: team1Score,
        country: team1.location || "",
      },
      team2: {
        id: String(team2.id),
        name: team2.name,
        logo: team2.image_url || "",
        score: team2Score,
        country: team2.location || "",
      },
      status,
      tournament: match.league?.name || match.tournament?.name || "Unknown",
      tournamentId: match.tournament?.id ? String(match.tournament.id) : undefined,
      tournamentLogo: match.league?.image_url || undefined,
      bestOf: match.number_of_games || 1,
      mapsWon: [team1Maps, team2Maps] as [number, number],
      startTime: match.begin_at || match.scheduled_at,
      scheduledAt: match.scheduled_at,
      numberOfGames: match.number_of_games || 1,
      matchType: match.match_type || "best_of",
      forfeit: match.forfeit || false,
      rescheduled: match.rescheduled || false,
      videogame: match.videogame?.name || "Counter-Strike 2",
      league: {
        id: String(match.league?.id || ""),
        name: match.league?.name || "",
        logo: match.league?.image_url || undefined,
      },
      serie: match.serie
        ? {
            id: String(match.serie.id),
            name: match.serie.name || "",
            fullName: match.serie.full_name,
          }
        : undefined,
      streams: (match.streams_list || []).map((s: any) => ({
        language: s.language,
        url: s.raw_url,
        embedUrl: s.embed_url || undefined,
        main: s.main,
        official: s.official,
      })),
      games: games
        .filter((g: any) => g.status === "running" || g.status === "finished")
        .map((g: any) => {
          let winner: "team1" | "team2" | undefined
          if (g.winner) {
            if (g.winner.id === team1.id) winner = "team1"
            else if (g.winner.id === team2.id) winner = "team2"
          }
          return {
            position: g.position,
            status: g.status,
            map: g.map?.name,
            winner,
          }
        }),
      team1Roster: team1Data
        ? {
            id: String(team1Data.id),
            name: team1Data.name,
            logo: team1Data.image_url || "",
            country: team1Data.location || "",
            players: (team1Data.players || []).map((p) => ({
              id: String(p.id),
              name: p.name,
              firstName: p.first_name || undefined,
              lastName: p.last_name || undefined,
              nationality: p.nationality || undefined,
              imageUrl: p.image_url || undefined,
              role: p.role || undefined,
              age: p.age || undefined,
            })),
          }
        : undefined,
      team2Roster: team2Data
        ? {
            id: String(team2Data.id),
            name: team2Data.name,
            logo: team2Data.image_url || "",
            country: team2Data.location || "",
            players: (team2Data.players || []).map((p) => ({
              id: String(p.id),
              name: p.name,
              firstName: p.first_name || undefined,
              lastName: p.last_name || undefined,
              nationality: p.nationality || undefined,
              imageUrl: p.image_url || undefined,
              role: p.role || undefined,
              age: p.age || undefined,
            })),
          }
        : undefined,
      headToHead: {
        totalMatches: validHeadToHead.length,
        team1Wins,
        team2Wins,
        draws,
        recentMatches,
      },
    }

    return NextResponse.json({ match: detail })
  } catch (error) {
    console.error("PandaScore API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch match details" },
      { status: 500 },
    )
  }
}
