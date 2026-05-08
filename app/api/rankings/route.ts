import { NextResponse } from "next/server"
import { REGIONS } from "@/lib/types"

const PANDASCORE_API = "https://api.pandascore.co"
const API_TOKEN = process.env.PANDASCORE_API_KEY

interface PandaScoreTeamRef {
  id: number
  name: string
  image_url: string | null
  location: string | null
  acronym?: string | null
}

interface PandaScoreOpponent {
  opponent: PandaScoreTeamRef
}

interface PandaScoreRankingMatch {
  id: number
  winner_id: number | null
  opponents: PandaScoreOpponent[]
  begin_at: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const regionFilter = searchParams.get("region") || "all"

  if (!API_TOKEN) {
    return NextResponse.json(
      { error: "PANDASCORE_API_KEY not configured" },
      { status: 500 },
    )
  }

  try {
    // Fetch a wide range of recent matches to derive ranking from real activity
    const res = await fetch(
      `${PANDASCORE_API}/csgo/matches/past?token=${API_TOKEN}&per_page=100&sort=-end_at`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      },
    )

    if (!res.ok) {
      console.error("[v0] Rankings: matches fetch failed", res.status)
      return NextResponse.json({ rankings: [] })
    }

    const matches: PandaScoreRankingMatch[] = await res.json()

    interface TeamAggregate {
      id: string
      name: string
      logo: string
      country: string
      wins: number
      total: number
    }

    const teamStats = new Map<string, TeamAggregate>()

    for (const match of matches) {
      const opps = match.opponents || []
      if (opps.length < 2) continue
      for (const opp of opps) {
        const teamRef = opp.opponent
        if (!teamRef || !teamRef.id) continue
        const id = String(teamRef.id)
        const existing = teamStats.get(id) || {
          id,
          name: teamRef.name,
          logo: teamRef.image_url || "",
          country: teamRef.location || "",
          wins: 0,
          total: 0,
        }
        existing.total++
        if (match.winner_id === teamRef.id) existing.wins++
        // Update logo/name if missing
        if (!existing.logo && teamRef.image_url) existing.logo = teamRef.image_url
        if (!existing.country && teamRef.location) existing.country = teamRef.location
        teamStats.set(id, existing)
      }
    }

    // Filter by region
    const region = REGIONS.find((r) => r.id === regionFilter)
    const filtered = Array.from(teamStats.values()).filter((t) => {
      if (regionFilter === "all" || !region) return true
      return region.countries.includes((t.country || "").toUpperCase())
    })

    // Score: simple weighted formula combining win rate and activity
    const scored = filtered
      .filter((t) => t.total >= 2)
      .map((t) => {
        const winRate = t.wins / t.total
        // Points: weight win rate (0-100) and number of matches (volume)
        const points = Math.round(winRate * 100 * 10 + t.total * 5)
        return {
          ...t,
          winRate,
          points,
        }
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 50)

    const rankings = scored.map((t, idx) => ({
      id: t.id,
      name: t.name,
      logo: t.logo,
      country: t.country,
      position: idx + 1,
      points: t.points,
      recentMatches: t.total,
      winRate: t.winRate,
    }))

    return NextResponse.json({ rankings })
  } catch (error) {
    console.error("[v0] Rankings API error:", error)
    return NextResponse.json({ rankings: [] })
  }
}
