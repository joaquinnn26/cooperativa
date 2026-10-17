import React from 'react'
import { nuevoBeneficiario } from '@/utils/adhesiones.js'

const money = amount => Number(amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
export default function AdhesionForm({ value, onChange, servicios = [], correccion = false }) {
  const set = patch => onChange({ ...value, ...patch })
  const familiar = (index, patch) => set({ Familiares: value.Familiares.map((f, i) => i === index ? { ...f, ...patch } : f) })
  return <fieldset className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
    <legend className="px-2 text-lg font-semibold">Sepelio y Ortopedia · adhesión voluntaria</legend>
    <p className="text-sm text-slate-600">Son servicios de cuota fija mensual. Los cargos se incluyen en la factura eléctrica, dentro de “Otros servicios / conceptos”. Solicitar la adhesión no activa la cobertura.</p>
    {!correccion && <div className="grid gap-3 sm:grid-cols-2">{[['Sepelio', 'SEPELIO'], ['Ortopedia', 'ORTOPEDIA']].map(([field, tipo]) => {
      const servicio = servicios.find(s => s.Tipo === tipo)
      return <label key={tipo} className="flex items-start gap-3 rounded-lg border bg-white p-3"><input type="checkbox" className="mt-1" checked={value[field]} disabled={!servicio || Number(servicio.TarifaBase) <= 0} onChange={e => set({ [field]: e.target.checked })} /><span><b>{field}</b><span className="block text-sm text-slate-600">{servicio && Number(servicio.TarifaBase) > 0 ? `${money(servicio.TarifaBase)} por mes · tarifa vigente al activar` : 'Pendiente de configuración'}</span><span className="block text-sm">{tipo === 'SEPELIO' ? 'Elegí a quiénes cubrir y adjuntá el DNI de cada persona.' : 'Sin documentación adicional para adherirse.'}</span></span></label>
    })}</div>}
    {value.Sepelio && <div className="space-y-3">
      <h3 className="font-semibold">Personas incluidas en Sepelio</h3>
      <p className="text-sm text-slate-600">Podés elegir al titular, a familiares o a ambos; no es obligatorio incluir a todo el grupo. Los hijos fuera de la localidad pueden mantener la adhesión, sujeta a verificación. La cobertura requiere que el titular siga siendo socio activo con un medidor a su nombre. Adjuntá el DNI de cada persona elegida (hasta 2 MB por archivo y 6 MB en total).</p>
      {value.Familiares.map((f, i) => <fieldset key={f.idBeneficiario || f.clave} className="space-y-3 rounded-lg border bg-white p-3"><legend className="px-1 text-sm font-medium">Persona {i + 1}</legend><div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">Nombre y apellido<input className="input-field" required maxLength={150} value={f.Nombre} onChange={e => familiar(i, { Nombre: e.target.value })} /></label>
        <label className="grid gap-1 text-sm">DNI<input className="input-field" required inputMode="numeric" maxLength={20} value={f.Documento} onChange={e => familiar(i, { Documento: e.target.value })} /></label>
        <label className="grid gap-1 text-sm">Vínculo<input className="input-field" required maxLength={60} placeholder="Titular, hijo/a, cónyuge…" value={f.Vinculo} onChange={e => familiar(i, { Vinculo: e.target.value })} /></label>
      </div><label className="grid gap-1 text-sm">Copia del DNI<input type="file" accept="application/pdf,image/png,image/jpeg" required onChange={e => familiar(i, { archivo: e.target.files?.[0] || null })} /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.MismoDomicilio} onChange={e => familiar(i, { MismoDomicilio: e.target.checked, ConservaAdhesion: false })} />Esta persona vive en el domicilio de la adhesión.</label>
        {!f.MismoDomicilio && <label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean(f.ConservaAdhesion)} onChange={e => familiar(i, { ConservaAdhesion: e.target.checked })} />Es hijo/a que vive fuera de la localidad y mantiene la adhesión familiar (Administración verificará esta condición).</label>}
        {value.Familiares.length > 1 && <button type="button" className="text-sm text-red-700 underline" onClick={() => set({ Familiares: value.Familiares.filter((_, j) => j !== i) })}>Quitar persona {i + 1}</button>}
      </fieldset>)}
      <button type="button" className="btn-secondary" disabled={value.Familiares.length >= 15} onClick={() => set({ Familiares: [...value.Familiares, nuevoBeneficiario()] })}>Agregar familiar</button>
    </div>}
    {!correccion && (value.Sepelio || value.Ortopedia) && <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" required checked={value.Consentimiento} onChange={e => set({ Consentimiento: e.target.checked })} /><span>Solicito la contratación de los servicios seleccionados y acepto sus cargos mensuales una vez activados. Para Sepelio, autorizo el uso de los datos y DNI del grupo familiar para gestionar la cobertura y su derivación al prestador.</span></label>}
  </fieldset>
}
