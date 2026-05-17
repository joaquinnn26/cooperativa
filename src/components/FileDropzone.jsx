import React, { useMemo, useRef, useState } from 'react'
import { FileImage, FileText, UploadCloud, X } from 'lucide-react'

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

function formatFileSize(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileDropzone({ files, onChange, error }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const items = useMemo(
    () =>
      files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      })),
    [files]
  )

  const applyFiles = (incomingFiles) => {
    const normalized = Array.from(incomingFiles || []).filter((file) => ACCEPTED_TYPES.includes(file.type))
    onChange([...files, ...normalized])
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    applyFiles(event.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      <div
        onDragEnter={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragActive(false)
        }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 transition ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(event) => applyFiles(event.target.files)}
        />

        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-white p-3 shadow-sm">
            <UploadCloud className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mt-3 text-lg font-semibold text-gray-900">Arrastra archivos o haz click para subir</h3>
          <p className="mt-1 text-sm text-gray-500">PDF, JPG, PNG o WEBP</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
              {item.previewUrl ? (
                <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
              ) : item.file.type === 'application/pdf' ? (
                <FileText className="h-8 w-8 text-red-600" />
              ) : (
                <FileImage className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{item.file.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(item.file.size)}</p>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onChange(files.filter((file) => file !== item.file))
              }}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
