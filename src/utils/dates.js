// Returns today's date as 'YYYY-MM-DD' in the device's local timezone
export function localDate() {
  return new Date().toLocaleDateString('en-CA') // 'en-CA' gives YYYY-MM-DD
}

// Returns the date string for the day before the given 'YYYY-MM-DD' string
export function prevDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00') // parse as local midnight
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-CA')
}

// Returns an array of 'YYYY-MM-DD' strings from start to end (inclusive)
export function dateRange(start, end) {
  const dates = []
  let current = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (current <= last) {
    dates.push(current.toLocaleDateString('en-CA'))
    current.setDate(current.getDate() + 1)
  }
  return dates
}
