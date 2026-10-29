import React from 'react'
import { UserRoundX } from 'lucide-react'
export default function ModalEliminarEmpleado({ show, empleado, onClose, onConfirm }) {
  if (!show || !empleado) return null
  return <div className="people-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="people-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="baja-empleado-title"><span className="people-confirm-icon"><UserRoundX size={25} /></span><h2 id="baja-empleado-title">¿Dar de baja al empleado?</h2><p><strong>{empleado.Persona?.Nombre} {empleado.Persona?.Apellido}</strong> perderá el acceso laboral. Su información y el historial de tareas permanecerán registrados.</p><footer><button type="button" onClick={onClose} className="btn-secondary">Conservar empleado</button><button type="button" onClick={onConfirm} className="people-danger-button">Confirmar baja</button></footer></div></div>
}
