"use client"

import { use } from "react"
import { Header } from "@/components/header"
import { TournamentDetailView } from "@/components/tournament-detail-view"

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <TournamentDetailView tournamentId={id} />
      </main>
    </div>
  )
}
