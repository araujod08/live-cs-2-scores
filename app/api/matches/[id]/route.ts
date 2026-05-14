import { NextResponse } from "next/server"

const PANDASCORE_API = "https://api.pandascore.co"
const API_TOKEN = process.env.PANDASCORE_API_KEY

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function findMatchById(id: string): Promise<any | null> {
  const endpoints = ["running", "upcoming", "past"]

  // Try recent matches first
  for (const ep of endpoints) {
    const data = await fetchJSON<any[]>(
      `${PANDASCORE_API}/csgo/matches/${ep}?token=${API_TOKEN}&per_page=100`,
    )
    if (data) {
      const found = data.find((m) => String(m.id) === id)
      if (found) return found
    }
  }

  // Fallback: paginate past matches deeper for older history
  for (let page = 2; page <= 5; page++) {
    const data = await fetchJSON<any[]>(
      `${PANDASCORE_API}/csgo/matches/past?token=${API_TOKEN}&per_page=100&page=${page}`,
    )
    if (!data || data.length === 0) break
    const found = data.find((m) => String(m.id) === id)
    if (found) return found
  }

  return null
}

export async function GET(
  _request: Request,
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
    const match = await findMatchById(id)

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

    // Players come from each opponent object in /matches list endpoints
    const team1Players = team1.players || []
    const team2Players = team2.players || []

    // Head-to-head: fetch past matches of team1 and filter for team2
    const headToHeadRaw = await fetchJSON<any[]>(
      `${PANDASCORE_API}/csgo/matches/past?token=${API_TOKEN}&filter[opponent_id]=${team1.id}&per_page=30&sort=-begin_at`,
    )

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
    const validHeadToHead = (headToHeadRaw || []).filter((m: any) => {
      if (String(m.id) === id) return false
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

    const mapPlayer = (p: any) => ({
      id: String(p.id),
      name: p.name,
      firstName: p.first_name || undefined,
      lastName: p.last_name || undefined,
      nationality: p.nationality || undefined,
      imageUrl: p.image_url || undefined,
      role: p.role || undefined,
      age: p.age || undefined,
    })

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
      tournamentId: match.tournament?.id
        ? String(match.tournament.id)
        : undefined,
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
        .filter(
          (g: any) => g.status === "running" || g.status === "finished",
        )
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
      team1Roster: {
        id: String(team1.id),
        name: team1.name,
        logo: team1.image_url || "",
        country: team1.location || "",
        players: team1Players.map(mapPlayer),
      },
      team2Roster: {
        id: String(team2.id),
        name: team2.name,
        logo: team2.image_url || "",
        country: team2.location || "",
        players: team2Players.map(mapPlayer),
      },
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
    console.error("[v0] match detail error:", error)
    return NextResponse.json(
      { error: "Failed to fetch match details" },
      { status: 500 },
    )
  }
}
