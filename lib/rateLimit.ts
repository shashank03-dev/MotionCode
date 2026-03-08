const FREE_LIMIT = 5
const STORAGE_KEY = 'motioncode_usage'

interface UsageData {
  count: number
  date: string  // YYYY-MM-DD
}

export function getUsage(): UsageData {
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!stored) return { count: 0, date: today() }
    
    const data: UsageData = JSON.parse(stored)
    
    // Reset if it's a new day
    if (data.date !== today()) {
      return { count: 0, date: today() }
    }
    
    return data
  } catch {
    return { count: 0, date: today() }
  }
}

export function incrementUsage(): void {
  const usage = getUsage()
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      count: usage.count + 1,
      date: today()
    }))
  }
}

export function canUseForFree(): boolean {
  return getUsage().count < FREE_LIMIT
}

export function usagesLeft(): number {
  return Math.max(0, FREE_LIMIT - getUsage().count)
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}
