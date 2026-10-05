import { apiUrl } from '@/config/api.js'
import { territoryRequest } from './territory.js'

export function eventosOperativosApi(path = '', options = {}) {
  return territoryRequest(apiUrl(`/eventos-operativos${path}`), {
    token: localStorage.getItem('token'),
    ...options
  })
}
