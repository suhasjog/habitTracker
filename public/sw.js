import { precacheAndRoute } from 'workbox-precaching'

// Inject the Workbox manifest at build time
precacheAndRoute(self.__WB_MANIFEST)

// Handle push notifications from Supabase Edge Function
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Habit Tracker', {
      body: data.body || 'Time to check in on your habits!',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-192.png',
      tag: data.tag || 'habit-reminder',
      renotify: true,
    })
  )
})

// Open the app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})
