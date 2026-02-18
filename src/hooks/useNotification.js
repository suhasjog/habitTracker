import { useState, useContext } from 'react'
import { AuthContext } from '../App'
import { supabase } from '../services/supabase'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)))
}

export function useNotification() {
  const { user } = useContext(AuthContext)
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  async function requestPermission() {
    if (typeof Notification === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.')
      return
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    if (result !== 'granted') return

    try {
      const registration = await navigator.serviceWorker.ready
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const sub = subscription.toJSON()
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: user.id,
            endpoint: sub.endpoint,
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          { onConflict: 'user_id,endpoint' }
        )

      if (error) throw error
      setNotificationsEnabled(true)
    } catch (err) {
      console.error('Failed to subscribe to push:', err)
    }
  }

  async function revokePermission() {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint)
        await subscription.unsubscribe()
      }
      setNotificationsEnabled(false)
    } catch (err) {
      console.error('Failed to revoke push subscription:', err)
    }
  }

  return { permission, notificationsEnabled, requestPermission, revokePermission }
}
