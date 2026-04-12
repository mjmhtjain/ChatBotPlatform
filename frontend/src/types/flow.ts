import type { ReactFlowJsonObject } from '@xyflow/react'

export interface FlowMeta {
  id: string
  project_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Flow extends FlowMeta {
  data: ReactFlowJsonObject | null
}

// Data stored on a Message Node in React Flow
export interface MessageNodeData extends Record<string, unknown> {
  message: string
}
