export interface Position {
  id: string
  name: string
  skip_phone_interview: boolean
  created_at: string
}

export interface SourcingPlatform {
  id: string
  name: string
  created_at: string
}

export interface Sourcer {
  id: string
  name: string
  created_at: string
}

export interface Candidate {
  id: string
  position_id: string | null
  url: string | null
  sourcing_platform_id: string | null
  sourcer_id: string | null
  ninehire_url: string | null
  stage: Stage
  outcome: Outcome
  memo: string | null
  proposal_date: string | null
  created_at: string
  updated_at: string
  position?: Position | null
  sourcing_platform?: SourcingPlatform | null
  sourcer?: Sourcer | null
}

export type Stage =
  | 'proposal_sent'
  | 'applied'
  | 'coffee_chat'
  | 'phone_interview'
  | 'job_interview'
  | 'culture_interview'
  | 'final_accepted'
  | 'joined'

export type Outcome = 'in_progress' | 'rejected' | 'withdrawn' | 'no_response'

export interface FunnelStats {
  stage: Stage
  label: string
  count: number
  countNoSkip?: number
  countSkipOnly?: number
  percent: number
}

export interface DashboardStats {
  funnel: FunnelStats[]
  total: number
}

export const STAGES = [
  { value: 'proposal_sent', label: '제안 발송' },
  { value: 'applied', label: '지원' },
  { value: 'coffee_chat', label: '커피챗' },
  { value: 'phone_interview', label: '전화 인터뷰' },
  { value: 'job_interview', label: '직무 인터뷰' },
  { value: 'culture_interview', label: '컬처 인터뷰' },
  { value: 'final_accepted', label: '최종 합격' },
  { value: 'joined', label: '최종 합류' },
] as const

export const OUTCOMES = [
  { value: 'in_progress', label: '진행 중' },
  { value: 'rejected', label: '탈락' },
  { value: 'withdrawn', label: '포기' },
  { value: 'no_response', label: '무응답' },
] as const

// 전환율 계산에서 커피챗 제외 (유동적 단계)
export const CONVERSION_STAGE_ORDER: Stage[] = [
  'proposal_sent',
  'applied',
  'phone_interview',
  'job_interview',
  'culture_interview',
  'final_accepted',
  'joined',
]

export const STAGE_ORDER: Stage[] = [
  'proposal_sent',
  'applied',
  'coffee_chat',
  'phone_interview',
  'job_interview',
  'culture_interview',
  'final_accepted',
  'joined',
]
