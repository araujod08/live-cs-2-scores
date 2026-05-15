import { Header } from "@/components/header"
import { TeamProfileView } from "@/components/team-profile-view"

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <TeamProfileView teamId={id} />
      </main>
    </div>
  )
}
