"use client"

import { Header } from "@/components/header"
import { TournamentsList } from "@/components/tournaments-list"

export default function TournamentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground">
            Campeonatos
          </h2>
          <p className="mt-2 text-pretty text-muted-foreground">
            Acompanhe os torneios de Counter-Strike 2 em andamento, próximos e encerrados
          </p>
        </div>
        <TournamentsList />
      </main>
    </div>
  )
}
