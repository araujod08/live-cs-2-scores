import { redirect } from "next/navigation"
import { Crosshair, ShieldAlert } from "lucide-react"
import { isAuthenticated, isAdminConfigured } from "@/lib/admin-auth"
import { AdminLoginForm } from "@/components/admin/admin-login-form"

export const metadata = {
  title: "Login Admin | CS2 Live Scores",
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage() {
  if (await isAuthenticated()) {
    redirect("/admin")
  }

  const configured = isAdminConfigured()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Crosshair className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">CS2 Live Scores</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          {configured ? (
            <AdminLoginForm />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <ShieldAlert className="h-8 w-8 text-live" />
              <p className="text-sm font-medium text-foreground">
                Painel não configurado
              </p>
              <p className="text-sm text-muted-foreground">
                Defina a variável de ambiente{" "}
                <code className="rounded bg-secondary px-1 py-0.5 text-xs">
                  ADMIN_PASSWORD
                </code>{" "}
                no projeto para ativar o acesso.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
