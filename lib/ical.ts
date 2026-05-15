import type { Match } from "./types"

function pad(n: number) {
  return n.toString().padStart(2, "0")
}

function formatICalDate(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  )
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

export function generateICalendar(matches: Match[], calendarName = "CS2 Live"): string {
  const now = formatICalDate(new Date())

  const events = matches.map((match) => {
    const start = new Date(match.startTime)
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000) // 3h estimate

    const title = `${match.team1.name} vs ${match.team2.name}`
    const description = `${match.tournament} - Bo${match.bestOf}`

    return [
      "BEGIN:VEVENT",
      `UID:match-${match.id}@cs2live`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatICalDate(start)}`,
      `DTEND:${formatICalDate(end)}`,
      `SUMMARY:${escapeICalText(title)}`,
      `DESCRIPTION:${escapeICalText(description)}`,
      `URL:https://cs2live.app/match/${match.id}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT15M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeICalText(title)}`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n")
  })

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CS2 Live//CS2 Live Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    "X-WR-TIMEZONE:UTC",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n")
}

export function buildGoogleCalendarUrl(match: Match): string {
  const start = new Date(match.startTime)
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${match.team1.name} vs ${match.team2.name}`,
    dates: `${formatICalDate(start).replace(/[-:]/g, "")}/${formatICalDate(end).replace(/[-:]/g, "")}`,
    details: `${match.tournament} - Bo${match.bestOf}`,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
