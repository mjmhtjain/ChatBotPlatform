import axios from 'axios'
import type { ReactFlowJsonObject } from '@xyflow/react'
import type { Flow, FlowMeta } from '../types/flow'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

// Flow API

export function listFlows(projectId: string): Promise<FlowMeta[]> {
  return api.get<FlowMeta[]>(`/api/projects/${projectId}/flows`).then(r => r.data)
}

export function createFlow(projectId: string, name: string): Promise<FlowMeta> {
  return api.post<FlowMeta>(`/api/projects/${projectId}/flows`, { name }).then(r => r.data)
}

export function getFlow(projectId: string, flowId: string): Promise<Flow> {
  return api.get<Flow>(`/api/projects/${projectId}/flows/${flowId}`).then(r => r.data)
}

export function updateFlow(
  projectId: string,
  flowId: string,
  payload: { name: string; data?: ReactFlowJsonObject }
): Promise<Flow> {
  return api.put<Flow>(`/api/projects/${projectId}/flows/${flowId}`, payload).then(r => r.data)
}

export function deleteFlow(projectId: string, flowId: string): Promise<void> {
  return api.delete(`/api/projects/${projectId}/flows/${flowId}`).then(() => undefined)
}
