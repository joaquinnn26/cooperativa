export const adhesionLabels = { EnRevision: 'En revisión', Observada: 'Documentación observada', Activa: 'Adhesión activa', Rechazada: 'Rechazada', Baja: 'Baja' }
let siguientePersona = 0
export const nuevoBeneficiario = () => ({ clave: ++siguientePersona, Nombre: '', Documento: '', Vinculo: '', MismoDomicilio: false, ConservaAdhesion: false, archivo: null })
export const nuevaAdhesion = () => ({ Sepelio: false, Ortopedia: false, Consentimiento: false, Familiares: [nuevoBeneficiario()] })
const normal = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
export const esEnergia = name => normal(name) === 'luz' || /energ|electric/.test(normal(name))
export const esAdicional = name => ['sepelio', 'ortopedia'].includes(normal(name))

export function validarAdhesion(form, { correccion = false } = {}) {
  if (!correccion && !form.Sepelio && !form.Ortopedia) throw new Error('Elegí Sepelio u Ortopedia.')
  if (!correccion && !form.Consentimiento) throw new Error('Confirmá la contratación y los cargos mensuales.')
  if (form.Sepelio) {
    if (!form.Familiares?.length || form.Familiares.length > 15) throw new Error('Elegí entre una y quince personas para la cobertura.')
    const docs = new Set()
    let total = 0
    for (const f of form.Familiares) {
      if (!f.Nombre.trim() || f.Nombre.trim().length > 150 || !f.Vinculo.trim() || f.Vinculo.trim().length > 60) throw new Error('Completá nombre y vínculo de cada persona.')
      const dni = f.Documento.trim()
      if (!/^\d{1,20}$/.test(dni) || docs.has(dni)) throw new Error('Los DNI deben ser numéricos y no repetirse.')
      docs.add(dni)
      if (!f.MismoDomicilio && !(f.ConservaAdhesion && normal(f.Vinculo).startsWith('hij'))) throw new Error('Verificá el domicilio o la continuidad de adhesión de hijos fuera de la localidad.')
      if (!f.archivo || !['application/pdf', 'image/png', 'image/jpeg'].includes(f.archivo.type) || f.archivo.size > 2 * 1024 * 1024 || f.archivo.size === 0) throw new Error('Adjuntá la copia del DNI de cada persona en PDF, PNG o JPEG, hasta 2 MB.')
      total += f.archivo.size
    }
    if (total > 6 * 1024 * 1024) throw new Error('Los DNI no pueden superar 6 MB en total.')
  }
  return true
}
export async function adhesionPayload(form, direccion, readFile) {
  validarAdhesion(form)
  return {
    Sepelio: Boolean(form.Sepelio), Ortopedia: Boolean(form.Ortopedia), Consentimiento: true, Direccion: direccion.trim(),
    Familiares: form.Sepelio ? await Promise.all(form.Familiares.map(async f => ({ Nombre: f.Nombre.trim(), Documento: f.Documento.trim(), Vinculo: f.Vinculo.trim(), MismoDomicilio: f.MismoDomicilio, ConservaAdhesion: Boolean(f.ConservaAdhesion), Archivo: await readFile(f.archivo) }))) : []
  }
}
