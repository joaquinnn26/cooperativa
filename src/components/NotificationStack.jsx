import React from 'react'
import { X } from 'lucide-react'
import useAppStore from '../store/appStore.js'

export default function NotificationStack() {
  const notifications = useAppStore((state) => state.notifications)
  const removeNotification = useAppStore((state) => state.removeNotification)

  if (!notifications.length) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
        >
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
