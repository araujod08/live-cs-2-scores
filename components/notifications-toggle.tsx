"use client"

import { Bell, BellOff } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface NotificationsToggleProps {
  variant?: "icon" | "inline"
}

export function NotificationsToggle({ variant = "icon" }: NotificationsToggleProps) {
  const { supported, enabled, toggle } = useNotifications()

  if (!supported) return null

  const handleClick = async () => {
    const result = await toggle()
    if (result) {
      toast.success("Notificações ativadas", {
        description: "Você será avisado sobre seus times favoritos",
      })
    } else {
      toast("Notificações desativadas")
    }
  }

  if (variant === "inline") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
          enabled
            ? "bg-accent/20 text-accent"
            : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
        )}
      >
        {enabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
        {enabled ? "Notificações ativas" : "Ativar notificações"}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      aria-label={enabled ? "Desativar notificações" : "Ativar notificações"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        enabled
          ? "bg-accent/20 text-accent hover:bg-accent/30"
          : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
      )}
    >
      {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
    </button>
  )
}
