import { NextResponse } from "next/server"

const PANDASCORE_API = "https://api.pandascore.co"
const API_TOKEN = process.env.PANDASCORE_API_KEY

interface PandaScoreTeam {
  id: number
  name: string
  image_url: string | null
  location: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""

  if (!API_TOKEN) {
    return NextResponse.json(
      { error: "PANDASCORE_API_KEY not configured" },
      { status: 500 }
    )
  }

  if (!search || search.length < 2) {
    return NextResponse.json({ teams: [] })
  }

  try {
    const response = await fetch(
      `${PANDASCORE_API}/csgo/teams?token=${API_TOKEN}&search[name]=${encodeURIComponent(search)}&per_page=10`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch teams")
    }

    const data: PandaScoreTeam[] = await response.json()

    const teams = data.map((team) => ({
      id: String(team.id),
      name: team.name,
      logo: team.image_url || "",
      country: team.location || "",
    }))

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("PandaScore API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    )
  }
}
