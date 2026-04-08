export interface Team {
  id: string
  name: string
  logo: string
  score: number
  country: string
}

export interface FavoriteTeam {
  id: string
  name: string
  logo: string
}

export interface GameDetail {
  position: number
  status: string
  map?: string
  winner?: "team1" | "team2"
}

export interface Match {
  id: string
  team1: Team
  team2: Team
  status: 'live' | 'upcoming' | 'finished'
  tournament: string
  tournamentLogo?: string
  map?: string
  round?: string
  bestOf: number
  mapsWon: [number, number]
  startTime: string
  streamUrl?: string
  games?: GameDetail[]
}
