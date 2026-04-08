"use client";

import { Header } from "@/components/header";
import { MatchesList } from "@/components/matches-list";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground">
            Partidas de CS2
          </h2>
          <p className="mt-2 text-pretty text-muted-foreground">
            Acompanhe os placares das principais partidas de Counter-Strike 2 em
            tempo real
          </p>
        </div>

        <MatchesList />
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Dados fornecidos por PandaScore API - Atualizado a cada 30s
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a
                href="https://www.hltv.org"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                HLTV
              </a>
              <a
                href="https://liquipedia.net/counterstrike"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                Liquipedia
              </a>
              <a
                href="https://www.twitch.tv/directory/game/Counter-Strike%202"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                Twitch
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
