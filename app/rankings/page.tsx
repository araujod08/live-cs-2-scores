"use client"

import { Header } from "@/components/header"
import { RankingsTable } from "@/components/rankings-table"

export default function RankingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground">
            Rankings
          </h2>
          <p className="mt-2 text-pretty text-muted-foreground">
            Top times de Counter-Strike 2 baseado nas atividades recentes na
            cena competitiva
          </p>
        </div>
        <RankingsTable />
      </main>
    </div>
  )
}
