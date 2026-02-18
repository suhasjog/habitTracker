import { useState, useEffect, useCallback } from 'react'
import { getHabits, getCompletions, getTodayKey } from '../utils/storage'

export function useNotification() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
  }, [])

  useEffect(() => {
    if (permission !== 'granted') return

    function scheduleReminder() {
      const now = new Date()
      const tenPM = new Date()
      tenPM.setHours(22, 0, 0, 0)

      let ms = tenPM.getTime() - now.getTime()
      if (ms < 0) {
        // Already past 10 PM today, schedule for tomorrow
        ms += 24 * 60 * 60 * 1000
      }

      const timerId = setTimeout(() => {
        const habits = getHabits()
        const completions = getCompletions()
        const today = getTodayKey()
        const todayDone = completions[today] || []
        const incomplete = habits.filter((h) => !todayDone.includes(h.id))

        if (incomplete.length > 0) {
          const reg = navigator.serviceWorker?.controller
          if (reg && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification('Habit Tracker', {
                body: `You have ${incomplete.length} habit${incomplete.length > 1 ? 's' : ''} left today!`,
                icon: '/icons/icon-192.png',
              })
            })
          } else {
            new Notification('Habit Tracker', {
              body: `You have ${incomplete.length} habit${incomplete.length > 1 ? 's' : ''} left today!`,
              icon: '/icons/icon-192.png',
            })
          }
        }

        // Reschedule for the next day
        scheduleReminder()
      }, ms)

      return timerId
    }

    const timerId = scheduleReminder()
    return () => clearTimeout(timerId)
  }, [permission])

  return { permission, requestPermission }
}
