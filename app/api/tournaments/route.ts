import { NextResponse } from "next/server"

const PANDASCORE_API = "https://api.pandascore.co"
const API_TOKEN = process.env.PANDASCORE_API_KEY

async function fetchTournaments(
  status: "running" | "upcoming" | "past",
  limit = 25,
): Promise<any[]> {
  try {
    const res = await fetch(
      `${PANDASCORE_API}/csgo/tournaments/${status}?token=${API_TOKEN}&per_page=${limit}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      },
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")?.toLowerCase() || ""

  if (!API_TOKEN) {
    return NextResponse.json(
      { error: "PANDASCORE_API_KEY not configured" },
      { status: 500 },
    )
  }

  try {
    const [running, upcoming, past] = await Promise.all([
      fetchTournaments("running", 25),
      fetchTournaments("upcoming", 25),
      fetchTournaments("past", 25),
    ])

    const allTournaments = [
      ...running.map((t) => ({ ...t, _status: "running" })),
      ...upcoming.map((t) => ({ ...t, _status: "upcoming" })),
      ...past.map((t) => ({ ...t, _status: "finished" })),
    ]

    const tournaments = allTournaments
      .map((t) => ({
        id: String(t.id),
        name: t.name,
        fullName: t.full_name,
        league: t.league?.name || "Unknown",
        leagueLogo: t.league?.image_url || undefined,
        beginAt: t.begin_at,
        endAt: t.end_at,
        prizepool: t.prizepool,
        tier: t.tier,
        region: t.region,
        status: t._status as "running" | "upcoming" | "finished",
        serie: t.serie?.full_name || t.serie?.name,
        liveSupported: t.live_supported,
        hasBracket: t.has_bracket,
        numberOfTeams: t.expected_roster?.length || t.teams?.length,
      }))
      .filter((t) => {
        if (!search) return true
        return (
          t.name.toLowerCase().includes(search) ||
          t.league.toLowerCase().includes(search) ||
          (t.serie || "").toLowerCase().includes(search)
        )
      })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error("PandaScore API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 },
    )
  }
}
