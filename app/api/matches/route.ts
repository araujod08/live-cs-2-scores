import { NextResponse } from "next/server"

const PANDASCORE_API = "https://api.pandascore.co"
const API_TOKEN = process.env.PANDASCORE_API_KEY

interface PandaScoreTeam {
  id: number
  name: string
  image_url: string | null
  location: string | null
}

interface PandaScoreResult {
  team_id: number
  score: number
}

interface PandaScoreOpponent {
  opponent: PandaScoreTeam
  score?: number
}

interface PandaScoreGame {
  id: number
  status: string
  position: number
  winner?: { id: number } | null
}

interface PandaScoreMatch {
  id: number
  name: string
  status: "running" | "finished" | "not_started" | "canceled"
  begin_at: string | null
  scheduled_at: string
  opponents: PandaScoreOpponent[]
  results?: PandaScoreResult[]
  tournament: {
    name: string
  }
  league: {
    name: string
    image_url: string | null
  }
  number_of_games: number
  games?: PandaScoreGame[]
  streams_list?: Array<{
    main: boolean
    raw_url: string
    language: string
  }>
}

function mapStatus(status: string): "live" | "upcoming" | "finished" {
  switch (status) {
    case "running":
      return "live"
    case "finished":
      return "finished"
    default:
      return "upcoming"
  }
}

function calculateMapsWon(
  games: PandaScoreGame[],
  team1Id: number,
  team2Id: number,
): [number, number] {
  let team1Maps = 0
  let team2Maps = 0
  for (const game of games) {
    if (game.winner) {
      if (game.winner.id === team1Id) team1Maps++
      else if (game.winner.id === team2Id) team2Maps++
    }
  }
  return [team1Maps, team2Maps]
}

// Build game details from the games array (no extra API calls)
function buildGameDetails(
  games: PandaScoreGame[] | undefined,
  team1Id: number,
  team2Id: number,
): Array<{
  position: number
  status: string
  map?: string
  winner?: string
}> {
  if (!games || games.length === 0) return []

  return games
    .filter((g) => g.status === "running" || g.status === "finished")
    .map((game) => {
      let winner: string | undefined
      if (game.winner) {
        if (game.winner.id === team1Id) winner = "team1"
        else if (game.winner.id === team2Id) winner = "team2"
      }

      return {
        position: game.position,
        status: game.status,
        map: game.map?.name || undefined,
        winner,
      }
    })
}

async function fetchWithFallback(url: string): Promise<PandaScoreMatch[]> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams: urlParams } = new URL(request.url)
  const teamSearch = urlParams.get("search")?.toLowerCase() || ""
  const tournamentSearch = urlParams.get("tournament")?.toLowerCase() || ""

  if (!API_TOKEN) {
    return NextResponse.json(
      { error: "PANDASCORE_API_KEY not configured" },
      { status: 500 },
    )
  }

  try {
    // When user is searching, fetch more past matches to show history
    const isSearching = teamSearch || tournamentSearch
    const pastMatchesLimit = isSearching ? 100 : 15

    // Fetch all three categories - use simple token auth, filter locally for accuracy
    const [runningData, upcomingData, pastData] = await Promise.all([
      fetchWithFallback(
        `${PANDASCORE_API}/csgo/matches/running?token=${API_TOKEN}&per_page=20`,
      ),
      fetchWithFallback(
        `${PANDASCORE_API}/csgo/matches/upcoming?token=${API_TOKEN}&per_page=30`,
      ),
      fetchWithFallback(
        `${PANDASCORE_API}/csgo/matches/past?token=${API_TOKEN}&per_page=${pastMatchesLimit}`,
      ),
    ])

    const allMatches: PandaScoreMatch[] = [
      ...runningData,
      ...upcomingData,
      ...pastData,
    ]

    // Debug: log tournament names when searching
    if (tournamentSearch) {
      const tournamentNames = allMatches.map(m => m.league?.name || m.tournament?.name || "Unknown")
      const uniqueTournaments = [...new Set(tournamentNames)]
      console.log("[v0] Searching for tournament:", tournamentSearch)
      console.log("[v0] Available tournaments:", uniqueTournaments)
      
      // Check which matches match
      const matchingMatches = allMatches.filter(m => {
        const name = (m.league?.name || m.tournament?.name || "").toLowerCase()
        return name.includes(tournamentSearch)
      })
      console.log("[v0] Matching matches count:", matchingMatches.length)
    }

    const matches = allMatches
      .filter((match) => match.opponents && match.opponents.length === 2)
      .map((match) => {
        const team1 = match.opponents[0]
        const team2 = match.opponents[1]
        const mapsWon = calculateMapsWon(
          match.games || [],
          team1.opponent.id,
          team2.opponent.id,
        )

        const team1Result = match.results?.find(
          (r) => r.team_id === team1.opponent.id,
        )
        const team2Result = match.results?.find(
          (r) => r.team_id === team2.opponent.id,
        )
        const team1Score = team1Result?.score ?? team1.score ?? mapsWon[0]
        const team2Score = team2Result?.score ?? team2.score ?? mapsWon[1]

        const mainStream = match.streams_list?.find((s) => s.main)
        const anyStream = match.streams_list?.[0]

        return {
          id: String(match.id),
          team1: {
            id: String(team1.opponent.id),
            name: team1.opponent.name,
            logo: team1.opponent.image_url || "",
            score: team1Score,
            country: team1.opponent.location || "",
          },
          team2: {
            id: String(team2.opponent.id),
            name: team2.opponent.name,
            logo: team2.opponent.image_url || "",
            score: team2Score,
            country: team2.opponent.location || "",
          },
          status: mapStatus(match.status),
          tournament: match.league?.name || match.tournament?.name || "Unknown",
          tournamentLogo: match.league?.image_url || undefined,
          bestOf: match.number_of_games || 1,
          mapsWon,
          startTime: match.begin_at || match.scheduled_at,
          streamUrl: mainStream?.raw_url || anyStream?.raw_url,
          games: buildGameDetails(
            match.games,
            team1.opponent.id,
            team2.opponent.id,
          ),
        }
      })
      .filter((match) => {
        // Filter by team name
        const matchesTeam = teamSearch
          ? match.team1.name.toLowerCase().includes(teamSearch) ||
            match.team2.name.toLowerCase().includes(teamSearch)
          : true

        // Filter by tournament name
        const matchesTournament = tournamentSearch
          ? match.tournament.toLowerCase().includes(tournamentSearch)
          : true

        return matchesTeam && matchesTournament
      })

    return NextResponse.json({ matches })
  } catch (error) {
    console.error("PandaScore API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    )
  }
}
