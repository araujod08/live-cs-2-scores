import { Header } from "@/components/header"
import { PlayerProfileView } from "@/components/player-profile-view"

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <PlayerProfileView playerId={id} />
      </main>
    </div>
  )
}
