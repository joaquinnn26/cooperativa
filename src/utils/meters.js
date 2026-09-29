import { apiUrl } from '../config/api.js'
import { territoryRequest } from './territory.js'
export { meterActions, physicalStates, allowedMeterActions, meterStatus, isMeterAvailable, compatibleMeterType } from './meterWorkflow.js'
export function meterApi(path = '', options = {}) {
  return territoryRequest(apiUrl(`/inventario-medidores${path}`), { token: localStorage.getItem('token'), ...options })
}
