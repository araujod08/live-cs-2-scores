import { NextResponse } from "next/server"

const PANDASCORE_API = "https://api.pandascore.co"
const API_TOKEN = process.env.PANDASCORE_API_KEY

async function fetchPandaScore<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${PANDASCORE_API}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
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
    const [tournament, matches, brackets] = await Promise.all([
      fetchPandaScore<any>(`/csgo/tournaments/${id}?token=${API_TOKEN}`),
      fetchPandaScore<any[]>(
        `/csgo/tournaments/${id}/matches?token=${API_TOKEN}&per_page=100`,
      ),
      fetchPandaScore<any[]>(
        `/csgo/tournaments/${id}/brackets?token=${API_TOKEN}`,
      ),
    ])

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 },
      )
    }

    const status =
      tournament.live_supported && tournament.has_bracket
        ? "running"
        : new Date(tournament.end_at) < new Date()
          ? "finished"
          : new Date(tournament.begin_at) > new Date()
            ? "upcoming"
            : "running"

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

    const processedMatches = (matches || [])
      .map(processMatch)
      .filter(Boolean)

    // Group bracket matches into rounds
    const bracketRounds: Record<
      string,
      Array<{
        id: string
        team1: { name: string; logo: string; score: number } | null
        team2: { name: string; logo: string; score: number } | null
        winner?: "team1" | "team2"
        status: "live" | "upcoming" | "finished"
        scheduledAt: string
      }>
    > = {}

    for (const m of brackets || []) {
      const roundKey = m.round || m.tournament_round || "Round"
      if (!bracketRounds[roundKey]) bracketRounds[roundKey] = []

      const opps = m.opponents || []
      const t1 = opps[0]?.opponent
      const t2 = opps[1]?.opponent
      const r1 = m.results?.find((r: any) => r.team_id === t1?.id)
      const r2 = m.results?.find((r: any) => r.team_id === t2?.id)

      let winner: "team1" | "team2" | undefined
      if (m.winner_id) {
        if (m.winner_id === t1?.id) winner = "team1"
        else if (m.winner_id === t2?.id) winner = "team2"
      }

      bracketRounds[roundKey].push({
        id: String(m.id),
        team1: t1
          ? {
              name: t1.name,
              logo: t1.image_url || "",
              score: r1?.score ?? 0,
            }
          : null,
        team2: t2
          ? {
              name: t2.name,
              logo: t2.image_url || "",
              score: r2?.score ?? 0,
            }
          : null,
        winner,
        status:
          m.status === "running"
            ? "live"
            : m.status === "finished"
              ? "finished"
              : "upcoming",
        scheduledAt: m.scheduled_at,
      })
    }

    const bracketArray = Object.entries(bracketRounds).map(([name, matches]) => ({
      name,
      matches,
    }))

    const detail = {
      id: String(tournament.id),
      name: tournament.name,
      fullName: tournament.full_name,
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
    console.error("PandaScore API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 },
    )
  }
}
