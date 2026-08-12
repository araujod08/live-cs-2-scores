import { redirect } from "next/navigation"
import Link from "next/link"
import { Crosshair, LogOut, ArrowLeft } from "lucide-react"
import { isAuthenticated } from "@/lib/admin-auth"
import { fetchBotStatus, isBotControlConfigured } from "@/lib/bot-control"
import { logoutAction } from "./actions"
import { BotControlPanel } from "@/components/admin/bot-control-panel"

export const metadata = {
  title: "Painel Admin | CS2 Live Scores",
  robots: { index: false, follow: false },
}

// Sempre buscar status fresco
export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login")
  }

  const configured = isBotControlConfigured()
  const status = await fetchBotStatus()

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
              <Crosshair className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Painel Admin</h1>
              <p className="text-xs text-muted-foreground">CS2 Live Scores</p>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao site
        </Link>

        <div>
          <h2 className="text-lg font-semibold text-foreground">Gerenciamento do bot</h2>
          <p className="text-sm text-muted-foreground">
            Monitore o status e reinicie o bot do Telegram remotamente.
          </p>
        </div>

        <BotControlPanel status={status} configured={configured} />
      </div>
    </main>
  )
}
