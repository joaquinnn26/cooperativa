import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({ id, label, ...props }) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <input {...props} id={id} type={visible ? 'text' : 'password'} className="input-field pr-12" />
      <button
        type="button"
        onClick={() => setVisible(current => !current)}
        aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label}`}
        aria-controls={id}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-gray-500 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}
