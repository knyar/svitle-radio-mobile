export function nextRefreshDelay(
  age: number,
  refreshInterval: number,
  random = Math.random,
): { delay: number; refresh: boolean } {
  if (age < 5000) {
    return { delay: 5000 + 1000 * random(), refresh: false }
  }
  return { delay: refreshInterval, refresh: true }
}
