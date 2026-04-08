"use client"

import { Crosshair, Radio } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Crosshair className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              CS2 Live
            </h1>
            <p className="text-xs text-muted-foreground">Placares ao Vivo</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-live/20 px-3 py-1.5">
            <Radio className="h-4 w-4 animate-pulse text-live" />
            <span className="text-sm font-medium text-live">AO VIVO</span>
          </div>
        </div>
      </div>
    </header>
  )
}
