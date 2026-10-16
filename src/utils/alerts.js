import Swal from 'sweetalert2'

const TYPE_TO_ICON = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info'
}

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4200,
  timerProgressBar: true,
  buttonsStyling: false,
  customClass: {
    popup: 'rounded-xl shadow-xl border border-gray-200',
    title: 'text-sm font-semibold text-gray-900',
    htmlContainer: 'text-sm text-gray-600'
  }
})

export function showToast({ title, message, type = 'info', target }) {
  return toast.fire({
    ...(target ? { target } : {}),
    icon: TYPE_TO_ICON[type] || 'info',
    title: title || 'Aviso',
    text: message || ''
  })
}

export function showInfo({ title, message, type = 'info', target }) {
  return Swal.fire({
    ...(target ? { target } : {}),
    icon: TYPE_TO_ICON[type] || 'info',
    title: title || 'Aviso',
    text: message || '',
    confirmButtonText: 'Entendido',
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-xl',
      htmlContainer: 'whitespace-pre-line text-sm text-gray-700',
      confirmButton: 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700'
    }
  })
}

export async function confirmAction({
  title,
  message,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar',
  type = 'question',
  danger = false,
  target
}) {
  const result = await Swal.fire({
    ...(target ? { target } : {}),
    icon: TYPE_TO_ICON[type] || type || 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-xl',
      actions: 'gap-2',
      confirmButton: [
        'rounded-lg px-4 py-2 text-sm font-semibold text-white',
        danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
      ].join(' '),
      cancelButton: 'rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200'
    }
  })

  return result.isConfirmed
}
