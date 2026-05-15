"use client"

import { use } from "react"
import { Header } from "@/components/header"
import { MatchDetailView } from "@/components/match-detail-view"

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <MatchDetailView matchId={id} />
      </main>
    </div>
  )
}
