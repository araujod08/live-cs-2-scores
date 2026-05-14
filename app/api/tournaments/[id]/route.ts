import { NextResponse } from "next/server"

const PANDASCORE_API = "https://api.pandascore.co"
const API_TOKEN = process.env.PANDASCORE_API_KEY

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function findTournament(id: string): Promise<any | null> {
  const endpoints = ["running", "upcoming", "past"]

  for (const ep of endpoints) {
    const data = await fetchJSON<any[]>(
      `${PANDASCORE_API}/csgo/tournaments/${ep}?token=${API_TOKEN}&per_page=100`,
    )
    if (data) {
      const found = data.find((t) => String(t.id) === id)
      if (found) return found
    }
  }

  // Deeper pagination of past
  for (let page = 2; page <= 5; page++) {
    const data = await fetchJSON<any[]>(
      `${PANDASCORE_API}/csgo/tournaments/past?token=${API_TOKEN}&per_page=100&page=${page}`,
    )
    if (!data || data.length === 0) break
    const found = data.find((t) => String(t.id) === id)
    if (found) return found
  }

  return null
}

function processMatch(match: any) {
  const opponents = match.opponents || []
  if (opponents.length < 2) return null

  const team1 = opponents[0].opponent
  const team2 = opponents[1].opponent

  let team1Maps = 0
  let team2Maps = 0
  for (const game of match.games || []) {
    if (game.winner) {
      if (game.winner.id === team1.id) team1Maps++
      else if (game.winner.id === team2.id) team2Maps++
    }
  }

  const team1Result = match.results?.find((r: any) => r.team_id === team1.id)
  const team2Result = match.results?.find((r: any) => r.team_id === team2.id)

  return {
    id: String(match.id),
    team1: {
      id: String(team1.id),
      name: team1.name,
      logo: team1.image_url || "",
      score: team1Result?.score ?? team1Maps,
      country: team1.location || "",
    },
    team2: {
      id: String(team2.id),
      name: team2.name,
      logo: team2.image_url || "",
      score: team2Result?.score ?? team2Maps,
      country: team2.location || "",
    },
    status:
      match.status === "running"
        ? "live"
        : match.status === "finished"
          ? "finished"
          : "upcoming",
    tournament: match.league?.name || match.tournament?.name || "Unknown",
    bestOf: match.number_of_games || 1,
    mapsWon: [team1Maps, team2Maps] as [number, number],
    startTime: match.begin_at || match.scheduled_at,
    streamUrl: match.streams_list?.find((s: any) => s.main)?.raw_url,
    round: match.round || null,
  }
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
    const tournament = await findTournament(id)

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 },
      )
    }

    // Get matches via filter (list endpoint, not tournament-scoped)
    const matchesData = await fetchJSON<any[]>(
      `${PANDASCORE_API}/csgo/matches?token=${API_TOKEN}&filter[tournament_id]=${id}&per_page=100&sort=begin_at`,
    )

    const now = new Date()
    const beginAt = tournament.begin_at ? new Date(tournament.begin_at) : null
    const endAt = tournament.end_at ? new Date(tournament.end_at) : null

    let status: "running" | "finished" | "upcoming" = "upcoming"
    if (endAt && endAt < now) status = "finished"
    else if (beginAt && beginAt <= now) status = "running"

    const teams = (tournament.teams || tournament.expected_roster || [])
      .map((entry: any) => {
        const team = entry.team || entry
        if (!team || !team.id) return null
        return {
          id: String(team.id),
          name: team.name,
          logo: team.image_url || "",
          country: team.location || "",
        }
      })
      .filter(Boolean)

    const processedMatches = (matchesData || [])
      .map(processMatch)
      .filter(Boolean) as any[]

    // Build brackets from matches that have a round
    const bracketRounds: Record<string, any[]> = {}
    for (const m of processedMatches) {
      if (!m.round) continue
      const key = String(m.round)
      if (!bracketRounds[key]) bracketRounds[key] = []
      bracketRounds[key].push({
        id: m.id,
        team1: { name: m.team1.name, logo: m.team1.logo, score: m.team1.score },
        team2: { name: m.team2.name, logo: m.team2.logo, score: m.team2.score },
        winner:
          m.status === "finished"
            ? m.team1.score > m.team2.score
              ? "team1"
              : "team2"
            : undefined,
        status: m.status,
        scheduledAt: m.startTime,
      })
    }

    const bracketArray = Object.entries(bracketRounds).map(([name, matches]) => ({
      name: `Round ${name}`,
      matches,
    }))

    const detail = {
      id: String(tournament.id),
      name: tournament.name,
      fullName: tournament.full_name || tournament.name,
      league: tournament.league?.name || "Unknown",
      leagueLogo: tournament.league?.image_url || undefined,
      beginAt: tournament.begin_at,
      endAt: tournament.end_at,
      prizepool: tournament.prizepool,
      tier: tournament.tier,
      region: tournament.region,
      status,
      serie: tournament.serie?.full_name || tournament.serie?.name,
      liveSupported: tournament.live_supported,
      hasBracket: tournament.has_bracket,
      numberOfTeams: teams.length,
      teams,
      matches: processedMatches,
      brackets: bracketArray.length > 0 ? bracketArray : undefined,
    }

    return NextResponse.json({ tournament: detail })
  } catch (error) {
    console.error("[v0] tournament detail error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 },
    )
  }
}
