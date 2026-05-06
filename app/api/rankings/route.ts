import { NextResponse } from "next/server"

const PANDASCORE_API = "https://api.pandascore.co"
const API_TOKEN = process.env.PANDASCORE_API_KEY

export async function GET() {
  if (!API_TOKEN) {
    return NextResponse.json(
      { error: "PANDASCORE_API_KEY not configured" },
      { status: 500 },
    )
  }

  try {
    // Fetch CS:GO/CS2 ranking from PandaScore
    const res = await fetch(
      `${PANDASCORE_API}/csgo/teams?token=${API_TOKEN}&per_page=50&sort=-current_videogame.id`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 600 },
      },
    )

    if (!res.ok) {
      throw new Error("Failed to fetch teams")
    }

    const teamsData: any[] = await res.json()

    // Get recent matches per team to calculate stats
    const recentMatchesRes = await fetch(
      `${PANDASCORE_API}/csgo/matches/past?token=${API_TOKEN}&per_page=100`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 600 },
      },
    )

    const recentMatches: any[] = recentMatchesRes.ok
      ? await recentMatchesRes.json()
      : []

    // Calculate stats per team
    const teamStats = new Map<
      string,
      { wins: number; total: number }
    >()

    for (const match of recentMatches) {
      const opps = match.opponents || []
      if (opps.length < 2) continue
      const winnerId = match.winner_id
      for (const opp of opps) {
        const teamId = String(opp.opponent.id)
        const stats = teamStats.get(teamId) || { wins: 0, total: 0 }
        stats.total++
        if (winnerId === opp.opponent.id) stats.wins++
        teamStats.set(teamId, stats)
      }
    }

    // Build rankings - filter teams with recent activity
    const rankings = teamsData
      .map((team: any, index: number) => {
        const stats = teamStats.get(String(team.id)) || { wins: 0, total: 0 }
        return {
          id: String(team.id),
          name: team.name,
          logo: team.image_url || "",
          country: team.location || "",
          position: index + 1,
          recentMatches: stats.total,
          winRate:
            stats.total > 0
              ? Math.round((stats.wins / stats.total) * 100)
              : 0,
        }
      })
      .filter((t) => t.recentMatches >= 2)
      .sort((a, b) => {
        // Sort by win rate, then by total matches
        if (b.winRate !== a.winRate) return b.winRate - a.winRate
        return b.recentMatches - a.recentMatches
      })
      .slice(0, 30)
      .map((team, index) => ({
        ...team,
        position: index + 1,
      }))

    return NextResponse.json({ rankings })
  } catch (error) {
    console.error("PandaScore API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch rankings" },
      { status: 500 },
    )
  }
}
