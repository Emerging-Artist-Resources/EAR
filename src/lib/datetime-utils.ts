/**
 * Date/Time utility functions for consistent timezone handling
 * All times are stored in EST/EDT and displayed in 12-hour format
 */

const EST_TIMEZONE = 'America/New_York'

/**
 * Converts a date and time string (in EST) to UTC ISO string for database storage
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Time string in HH:mm format (24-hour, interpreted as EST)
 * @returns ISO string in UTC
 */
export function convertESTToUTC(date: string, time: string): string {
  // Parse the EST date/time components
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  
  // Create a formatter to check EST representation
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  
  // Use binary search approach: try different UTC offsets until we find the right one
  // EST is typically UTC-5 (winter) or UTC-4 (summer), but we'll search more broadly
  let bestDate: Date | null = null
  let minDiff = Infinity
  
  // Try offsets from UTC-6 to UTC-3 (covers EST/EDT and edge cases)
  for (let offset = 6; offset >= 3; offset--) {
    const testDate = new Date(Date.UTC(year, month - 1, day, hours + offset, minutes, 0))
    const estFormatted = formatter.format(testDate)
    const parts = estFormatted.split(/[,\s\/]+/)
    
    if (parts.length < 4) continue
    
    const [testMonth, testDay, testYear, testTime] = parts
    const [testHours, testMinutes] = testTime.split(':').map(Number)
    
    // Check if this matches exactly
    if (testHours === hours && testMinutes === minutes &&
        Number(testMonth) === month && Number(testDay) === day && Number(testYear) === year) {
      return testDate.toISOString()
    }
    
    // Calculate difference for fine-tuning
    const diff = Math.abs(
      (testHours * 60 + testMinutes) - (hours * 60 + minutes) +
      (Number(testMonth) - month) * 1440 +
      (Number(testDay) - day) * 1440
    )
    
    if (diff < minDiff) {
      minDiff = diff
      bestDate = testDate
    }
  }
  
  // If we found a close match, fine-tune it
  if (bestDate) {
    const estFormatted = formatter.format(bestDate)
    const parts = estFormatted.split(/[,\s\/]+/)
    if (parts.length >= 4) {
      const [testMonth, testDay, testYear, testTime] = parts
      const [testHours, testMinutes] = testTime.split(':').map(Number)
      
      // Calculate the exact adjustment needed
      const desiredMinutes = hours * 60 + minutes
      const actualMinutes = testHours * 60 + testMinutes
      const dayDiff = (Number(testDay) - day) * 1440
      const monthDiff = (Number(testMonth) - month) * 1440
      const yearDiff = (Number(testYear) - year) * 525600 // Approximate
      const totalDiffMinutes = desiredMinutes - actualMinutes + dayDiff + monthDiff + yearDiff
      
      // Adjust the UTC date
      const adjustedDate = new Date(bestDate.getTime() - totalDiffMinutes * 60 * 1000)
      return adjustedDate.toISOString()
    }
  }
  
  // Fallback: use UTC-5 (most common)
  return new Date(Date.UTC(year, month - 1, day, hours + 5, minutes, 0)).toISOString()
}

/**
 * Converts a UTC ISO string to EST date and time
 * @param utcISOString - ISO string in UTC
 * @returns Object with date (YYYY-MM-DD) and time (HH:mm) in EST
 */
export function convertUTCToEST(utcISOString: string): { date: string; time: string } {
  const date = new Date(utcISOString)
  
  // Format date in EST
  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  
  // Format time in EST (24-hour format)
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
  
  // Convert date from MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = dateStr.split('/')
  const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  
  // Ensure time is in HH:mm format
  const [hours, minutes] = timeStr.split(':')
  const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
  
  return { date: formattedDate, time: formattedTime }
}

/**
 * Formats a 24-hour time string (HH:mm) to 12-hour format (h:mm AM/PM)
 * @param time24 - Time string in HH:mm format (24-hour)
 * @returns Time string in h:mm AM/PM format
 */
export function formatTime12Hour(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24
  
  const [hours, minutes] = time24.split(":")
  const hour = parseInt(hours, 10)
  const minute = minutes || "00"
  
  if (isNaN(hour)) return time24
  
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const ampm = hour >= 12 ? "PM" : "AM"
  
  return `${hour12}:${minute} ${ampm}`
}

/**
 * Formats a UTC ISO string to 12-hour time in EST
 * @param utcISOString - ISO string in UTC
 * @returns Time string in h:mm AM/PM format (EST)
 */
export function formatTimeEST12Hour(utcISOString: string): string {
  const date = new Date(utcISOString)
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
  
  return timeStr
}

/**
 * Formats a UTC ISO string to date and 12-hour time in EST
 * @param utcISOString - ISO string in UTC
 * @returns Formatted string like "Jan 1, 2024, 7:00 PM"
 */
export function formatDateTimeEST(utcISOString: string): string {
  const date = new Date(utcISOString)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}
