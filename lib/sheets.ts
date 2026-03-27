import { google } from 'googleapis'

export function getSheetsClient() {
  const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyRaw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set')

  const key = JSON.parse(keyRaw)
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export const SHEET_COLUMNS = {
  ID: 0,           // A - hidden
  POSITION: 1,     // B
  URL: 2,          // C
  NINEHIRE: 3,     // D
  SOURCER: 4,      // E
  PLATFORM: 5,     // F
  STAGE: 6,        // G - editable dropdown
  OUTCOME: 7,      // H - editable dropdown
  MEMO: 8,         // I - editable
  PROPOSAL_DATE: 9, // J
  LAST_SYNCED: 10, // K - hidden
}

export const HEADER_ROW = [
  'id', '포지션', '링크', '나인하이어', '담당자', '플랫폼',
  '단계', '결과', '메모', '발송일', 'last_synced_at',
]

export const STAGE_LABELS: Record<string, string> = {
  proposal_sent: '제안 발송',
  applied: '지원',
  coffee_chat: '커피챗',
  phone_interview: '전화 인터뷰',
  job_interview: '직무 인터뷰',
  culture_interview: '컬처 인터뷰',
  final_accepted: '최종 합격',
  joined: '최종 합류',
}

export const OUTCOME_LABELS: Record<string, string> = {
  in_progress: '진행 중',
  rejected: '탈락',
  withdrawn: '포기',
  no_response: '무응답',
  accepted: '수락',
  declined: '거절',
}

export const STAGE_VALUES = Object.keys(STAGE_LABELS)
export const OUTCOME_VALUES = Object.keys(OUTCOME_LABELS)
