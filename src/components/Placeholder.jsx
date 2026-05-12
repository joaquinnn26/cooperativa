import React from 'react'

export default function Placeholder({ title, description }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-lg text-gray-600">{description}</p>
    </div>
  )
}
