import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, Download, FileBadge2, FileText, HeartPulse, RefreshCw, ShieldCheck, Upload, UserRound } from 'lucide-react'
import { altaSocioApi, descargarDocumentoAlta } from '@/utils/altaSocioApi.js'
import { archivoPayload } from '@/utils/laboral.js'
import useAuthStore from '@/store/authStore.js'

const TIPOS_LABORALES = [
  { code: 'LICENCIA_CONDUCIR', label: 'Licencia de conducir', hint: 'Vigencia y categoría visibles.' },
  { code: 'MATRICULAS', label: 'Matrículas o habilitaciones', hint: 'Matrículas profesionales o habilitaciones vigentes.' },
  { code: 'TITULOS', label: 'Título', hint: 'Título, certificado o constancia de formación.' }
]
const TIPOS_SOCIO = [
  { code: 'Domicilio', label: 'Constancia de domicilio', match: /domicilio/i },
  { code: 'DniFrente', label: 'DNI · frente', match: /dni.*frente/i },
  { code: 'DniDorso', label: 'DNI · dorso', match: /dni.*dorso/i }
]
const ACCEPT = 'application/pdf,image/png,image/jpeg'

export default function LegajoPersona() {
  const isSocio = useAuthStore(state => state.rol) === 'Socio'
  const [docs, setDocs] = useState([]), [types, setTypes] = useState([]), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(''), [revision, setRevision] = useState(0)
  const [person, setPerson] = useState(null), [emergency, setEmergency] = useState({ NombreContactoEmergencia: '', TelefonoContactoEmergencia: '' })
  const [editingEmergency, setEditingEmergency] = useState(false), [uploading, setUploading] = useState(null), [selectedFiles, setSelectedFiles] = useState({})

  useEffect(() => {
    const abort = new AbortController()
    Promise.all([altaSocioApi('/legajo/mis-documentos', { signal: abort.signal }), altaSocioApi('/legajo/tipos', { signal: abort.signal })])
      .then(([archive, catalog]) => {
        if (abort.signal.aborted) return
        setDocs(archive.documentos || []); setPerson(archive.persona || null); setTypes(catalog || [])
        setEmergency({ NombreContactoEmergencia: archive.persona?.NombreContactoEmergencia || '', TelefonoContactoEmergencia: archive.persona?.TelefonoContactoEmergencia || '' })
      }).catch(e => { if (!abort.signal.aborted) setError(e.message) })
    return () => abort.abort()
  }, [revision])

  const availableTypes = useMemo(() => new Map(types.map(type => [String(type.Codigo).toUpperCase(), type])), [types])
  const laboralDocs = useMemo(() => TIPOS_LABORALES.map(type => {
    const actual = docs.find(doc => String(doc.Tipo || '').toUpperCase() === type.code)
    return { ...type, actual }
  }), [docs])
  const socioDocs = useMemo(() => TIPOS_SOCIO.map(type => ({ ...type, actual: docs.find(doc => type.match.test(`${doc.Requisito || ''} ${doc.Tipo || ''}`)) || null })), [docs])
  const hasSocioAccount = Boolean(person?.idSocio)

  async function uploadDocument(event) {
    event.preventDefault()
    if (!uploading) return
    const file = selectedFiles[uploading]
    if (!file) { setError('Seleccioná el archivo que querés cargar.'); return }
    setBusy(uploading); setError(''); setNotice('')
    try {
      const payload = await archivoPayload(file)
      await altaSocioApi('/legajo/documentos', { method: 'POST', body: JSON.stringify({ Tipo: uploading, Nombre: payload.Nombre, Mime: payload.Tipo, Base64: payload.Base64 }) })
      setSelectedFiles(prev => ({ ...prev, [uploading]: null })); setUploading(null); setNotice('La documentación se envió a revisión.'); setRevision(value => value + 1)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  async function saveEmergency(event) {
    event.preventDefault(); setBusy('emergency'); setError(''); setNotice('')
    try {
      await altaSocioApi('/legajo/contacto-emergencia', { method: 'PUT', body: JSON.stringify(emergency) })
      setEditingEmergency(false); setNotice('Contacto de emergencia guardado.'); setRevision(value => value + 1)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  return <div className="employee-archive mx-auto max-w-5xl space-y-6">
    <header className="archive-hero"><div><span className="archive-eyebrow"><ShieldCheck size={15}/> {isSocio ? "Mi información de socio" : "Mi información laboral"}</span><h1>Mi legajo</h1><p>{isSocio ? "Consultá los documentos aprobados de tu alta y actualizalos cuando necesites renovarlos." : "Administrá tu documentación laboral y mantené actualizado tu contacto de emergencia en un solo lugar."}</p></div><div className="archive-hero-icon" aria-hidden="true"><FileBadge2 size={42}/></div></header>

    {error && <p role="alert" className="archive-alert archive-alert-error"><AlertCircle size={18}/>{error}<button type="button" onClick={() => setError('')} aria-label="Cerrar aviso">×</button></p>}
    {notice && <p role="status" className="archive-alert archive-alert-success"><CheckCircle2 size={18}/>{notice}<button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso">×</button></p>}

    <section className="archive-section"><div className="archive-section-heading"><span className="archive-section-icon"><UserRound size={19}/></span><div><h2>{isSocio ? "Datos personales" : "Datos del empleado"}</h2><p>{isSocio ? "Información de referencia de tu cuenta de socio." : "Información de referencia de tu cuenta laboral."}</p></div></div><div className="archive-person-grid"><div><span>Nombre</span><strong>{person?.Nombre || '—'} {person?.Apellido || ''}</strong></div><div><span>Documento</span><strong>{person?.Documento || '—'}</strong></div><div><span>Correo</span><strong>{person?.Email || '—'}</strong></div><div><span>Teléfono</span><strong>{person?.Telefono || '—'}</strong></div></div></section>

    {hasSocioAccount && <section className="archive-section"><div className="archive-section-heading"><span className="archive-section-icon archive-icon-teal"><FileText size={19}/></span><div><h2>Documentación del socio</h2><p>Los documentos aprobados al dar el alta ya forman parte de tu legajo. Desde acá solo podés actualizarlos si renovás o corregís alguno.</p></div></div><div className="archive-doc-grid">
      {socioDocs.map(item => { const doc = item.actual; const isUploading = Boolean(doc && uploading === doc.Tipo); return <article className="archive-doc-card" key={item.code}><div className="archive-doc-top"><span className="archive-doc-icon"><FileBadge2 size={19}/></span><span className={`archive-status ${doc?.Estado === 'Aprobado' ? 'archive-status-approved' : doc ? 'archive-status-pending' : 'archive-status-empty'}`}>{doc?.Estado || 'No disponible'}</span></div><h3>{item.label}</h3><p>{doc ? doc.Nombre : 'No se encontró un archivo de alta aprobado para este requisito.'}</p>{doc && <div className="archive-doc-meta"><span>Presentado {new Date(doc.FechaUtc).toLocaleDateString('es-AR')}</span><button type="button" className="archive-download" onClick={() => descargarDocumentoAlta(doc)}><Download size={14}/>Ver archivo</button></div>}
        {doc && !isUploading && <button type="button" className="archive-update-trigger" onClick={() => { setError(''); setUploading(doc.Tipo) }}><RefreshCw size={15}/>Actualizar documentación</button>}
        {isUploading && <form className="archive-upload-form" onSubmit={uploadDocument}><label>Documento actualizado (PDF, PNG o JPEG; hasta 2 MB)<input required type="file" accept={ACCEPT} onChange={e => setSelectedFiles(prev => ({ ...prev, [doc.Tipo]: e.target.files?.[0] || null }))}/></label><div><button type="button" className="archive-cancel" disabled={busy === doc.Tipo} onClick={() => setUploading(null)}>Cancelar</button><button type="submit" className="archive-submit" disabled={busy === doc.Tipo || !selectedFiles[doc.Tipo]}>{busy === doc.Tipo ? 'Enviando…' : 'Enviar actualización'}</button></div></form>}
      </article> })}
    </div></section>}

    {!isSocio && (<section className="archive-section"><div className="archive-section-heading"><span className="archive-section-icon archive-icon-teal"><FileText size={19}/></span><div><h2>Documentación del empleado</h2><p>Cargá una vez cada requisito. Si renovás un documento, usá la opción de actualizar de esa tarjeta.</p></div></div><div className="archive-doc-grid">
      {laboralDocs.map(item => { const requirement = availableTypes.get(item.code); const doc = item.actual; const isUploading = uploading === item.code; return <article className="archive-doc-card" key={item.code}><div className="archive-doc-top"><span className="archive-doc-icon"><FileBadge2 size={19}/></span><span className={`archive-status ${doc?.Estado === 'Aprobado' ? 'archive-status-approved' : doc ? 'archive-status-pending' : 'archive-status-empty'}`}>{doc?.Estado || 'Pendiente de carga'}</span></div><h3>{requirement?.Nombre || item.label}</h3><p>{doc ? doc.Nombre : item.hint}</p>{doc && <div className="archive-doc-meta"><span>Presentado {new Date(doc.FechaUtc).toLocaleDateString('es-AR')}</span><button type="button" className="archive-download" onClick={() => descargarDocumentoAlta(doc)}><Download size={14}/>Ver archivo</button></div>}
        {!doc && !isUploading && <button type="button" className="archive-upload-trigger" disabled={!requirement} onClick={() => { setError(''); setUploading(item.code) }}><Upload size={16}/>Cargar documento</button>}
        {doc && !isUploading && <button type="button" className="archive-update-trigger" onClick={() => { setError(''); setUploading(item.code) }}><RefreshCw size={15}/>Actualizar documentación</button>}
        {isUploading && <form className="archive-upload-form" onSubmit={uploadDocument}><label>Nuevo archivo (PDF, PNG o JPEG; hasta 2 MB)<input required type="file" accept={ACCEPT} onChange={e => setSelectedFiles(prev => ({ ...prev, [item.code]: e.target.files?.[0] || null }))}/></label><div><button type="button" className="archive-cancel" disabled={busy === item.code} onClick={() => setUploading(null)}>Cancelar</button><button type="submit" className="archive-submit" disabled={busy === item.code || !selectedFiles[item.code]}>{busy === item.code ? 'Enviando…' : doc ? 'Enviar actualización' : 'Enviar a revisión'}</button></div></form>}
      </article> })}
      {!laboralDocs.some(item => availableTypes.has(item.code)) && <p className="archive-catalog-note">Los tipos de documentación laboral todavía no están disponibles en el catálogo.</p>}
    </div></section>)}

    {!isSocio && (<section className="archive-emergency"><div className="archive-emergency-copy"><span className="archive-section-icon archive-icon-rose"><HeartPulse size={19}/></span><div><h2>Contacto de emergencia</h2><p>Persona a quien contactar ante una emergencia laboral.</p>{!editingEmergency && <strong>{emergency.NombreContactoEmergencia ? `${emergency.NombreContactoEmergencia} · ${emergency.TelefonoContactoEmergencia}` : 'Todavía no cargaste un contacto de emergencia.'}</strong>}</div></div>
      {editingEmergency ? <form className="archive-emergency-form" onSubmit={saveEmergency}><label>Nombre de la persona<input required maxLength={120} autoComplete="name" value={emergency.NombreContactoEmergencia} onChange={e => setEmergency(prev => ({ ...prev, NombreContactoEmergencia: e.target.value }))} placeholder="Nombre y apellido"/></label><label>Número de teléfono<input required type="tel" maxLength={25} autoComplete="tel" value={emergency.TelefonoContactoEmergencia} onChange={e => setEmergency(prev => ({ ...prev, TelefonoContactoEmergencia: e.target.value }))} placeholder="Ej.: +54 9 11 5555-5555"/></label><div><button type="button" className="archive-cancel" disabled={busy === 'emergency'} onClick={() => { setEditingEmergency(false); setEmergency({ NombreContactoEmergencia: person?.NombreContactoEmergencia || '', TelefonoContactoEmergencia: person?.TelefonoContactoEmergencia || '' }) }}>Cancelar</button><button className="archive-submit" disabled={busy === 'emergency'}>{busy === 'emergency' ? 'Guardando…' : 'Guardar contacto'}</button></div></form> : <button type="button" className="archive-update-trigger" onClick={() => setEditingEmergency(true)}>{emergency.NombreContactoEmergencia ? 'Editar contacto' : 'Agregar contacto'}<ChevronDown size={15}/></button>}</section>)}
  </div>
}