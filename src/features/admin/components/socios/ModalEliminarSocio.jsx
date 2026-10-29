import React from 'react'
import { UserRoundX } from 'lucide-react'
export default function ModalEliminarSocio({ show, socio, onClose, onConfirm }) {
  if (!show || !socio) return null
  return <div className="people-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="people-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="baja-socio-title"><span className="people-confirm-icon"><UserRoundX size={25} /></span><h2 id="baja-socio-title">¿Dar de baja al socio?</h2><p><strong>{socio.Persona?.Nombre} {socio.Persona?.Apellido}</strong> quedará inactivo y no podrá operar con su cuenta. Sus registros y el historial se conservarán.</p><footer><button type="button" onClick={onClose} className="btn-secondary">Conservar socio</button><button type="button" onClick={onConfirm} className="people-danger-button">Confirmar baja</button></footer></div></div>
}
