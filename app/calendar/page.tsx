import { Header } from "@/components/header"
import { CalendarView } from "@/components/calendar-view"

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Calendário
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize todas as partidas em formato de calendário e exporte para o
            Google Calendar ou seu app preferido.
          </p>
        </div>
        <CalendarView />
      </main>
    </div>
  )
}
