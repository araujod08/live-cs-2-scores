import { REGIONS, type Region } from "./types"

export function getRegionForCountry(country: string): Region | null {
  if (!country) return null
  const upperCountry = country.toUpperCase()
  // Prefer specific regions (BR before SA)
  for (const region of REGIONS) {
    if (region.id === "sa") continue
    if (region.countries.includes(upperCountry)) {
      return region
    }
  }
  // Fall back to broader regions
  for (const region of REGIONS) {
    if (region.countries.includes(upperCountry)) {
      return region
    }
  }
  return null
}

export function isInRegion(country: string, regionId: string): boolean {
  if (!country || !regionId) return false
  const region = REGIONS.find((r) => r.id === regionId)
  if (!region) return false
  return region.countries.includes(country.toUpperCase())
}

export function getCountryFlag(country: string): string {
  if (!country || country.length !== 2) return ""
  const codePoints = country
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
