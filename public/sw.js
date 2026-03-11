self.addEventListener('push', function (event) {
  var data = {}

  try {
    data = event.data ? event.data.json() : {}
  } catch (_error) {
    data = {}
  }

  var options = {
    body: data.body || 'Wedding weekend update.',
    icon: '/wedding-icon.png',
    badge: '/badge-icon.png',
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Wedding Weekend Update', options),
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i += 1) {
        var client = clientList[i]
        if ('focus' in client) {
          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow('/')
      }

      return Promise.resolve()
    }),
  )
})
