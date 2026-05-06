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
  status: "live" | "upcoming" | "finished"
  tournament: string
  tournamentId?: string
  tournamentLogo?: string
  map?: string
  round?: string
  bestOf: number
  mapsWon: [number, number]
  startTime: string
  streamUrl?: string
  streams?: MatchStream[]
  games?: GameDetail[]
}

export interface MatchStream {
  language: string
  url: string
  embedUrl?: string
  main: boolean
  official: boolean
}

export interface Player {
  id: string
  name: string
  firstName?: string
  lastName?: string
  nationality?: string
  imageUrl?: string
  role?: string
  age?: number
}

export interface TeamRoster {
  id: string
  name: string
  logo: string
  country: string
  players: Player[]
}

export interface MatchDetail extends Match {
  team1Roster?: TeamRoster
  team2Roster?: TeamRoster
  streams: MatchStream[]
  scheduledAt: string
  numberOfGames: number
  matchType: string
  league: {
    id: string
    name: string
    logo?: string
  }
  serie?: {
    id: string
    name: string
    fullName?: string
  }
  videogame: string
  forfeit: boolean
  rescheduled: boolean
}

export interface HeadToHead {
  totalMatches: number
  team1Wins: number
  team2Wins: number
  draws: number
  recentMatches: Array<{
    id: string
    date: string
    team1Score: number
    team2Score: number
    winner: "team1" | "team2" | "draw"
    tournament: string
  }>
}

export interface Tournament {
  id: string
  name: string
  fullName?: string
  league: string
  leagueLogo?: string
  beginAt: string
  endAt?: string
  prizepool?: string
  tier?: string
  region?: string
  status: "running" | "upcoming" | "finished"
  serie?: string
  liveSupported?: boolean
  hasBracket?: boolean
  numberOfTeams?: number
}

export interface TournamentDetail extends Tournament {
  teams: Array<{
    id: string
    name: string
    logo: string
    country: string
  }>
  matches: Match[]
  brackets?: BracketRound[]
}

export interface BracketRound {
  name: string
  matches: Array<{
    id: string
    team1: { name: string; logo: string; score: number } | null
    team2: { name: string; logo: string; score: number } | null
    winner?: "team1" | "team2"
    status: "live" | "upcoming" | "finished"
    scheduledAt: string
  }>
}

export interface RankingTeam {
  id: string
  name: string
  logo: string
  country: string
  position: number
  previousPosition?: number
  points?: number
  recentMatches: number
  winRate: number
}

export interface Region {
  id: string
  name: string
  countries: string[]
}

export const REGIONS: Region[] = [
  {
    id: "br",
    name: "Brasil",
    countries: ["BR"],
  },
  {
    id: "na",
    name: "América do Norte",
    countries: ["US", "CA"],
  },
  {
    id: "sa",
    name: "América do Sul",
    countries: ["BR", "AR", "CL", "PE", "UY", "PY", "BO", "EC", "VE", "CO"],
  },
  {
    id: "eu",
    name: "Europa",
    countries: [
      "DK",
      "SE",
      "FI",
      "NO",
      "DE",
      "FR",
      "ES",
      "IT",
      "PL",
      "UA",
      "RU",
      "BG",
      "RO",
      "CZ",
      "SK",
      "PT",
      "NL",
      "BE",
      "GB",
      "IE",
      "AT",
      "CH",
      "GR",
      "HU",
      "LV",
      "LT",
      "EE",
      "BA",
      "SI",
      "HR",
      "RS",
    ],
  },
  {
    id: "asia",
    name: "Ásia",
    countries: ["CN", "KR", "JP", "TH", "VN", "ID", "MY", "SG", "PH", "IN", "MN", "KZ"],
  },
  {
    id: "oceania",
    name: "Oceania",
    countries: ["AU", "NZ"],
  },
]
