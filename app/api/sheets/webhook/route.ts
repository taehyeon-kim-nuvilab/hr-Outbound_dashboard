import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 스프레드시트에서 수정 가능한 필드만 역방향 동기화
const STAGE_MAP: Record<string, string> = {
  '제안 발송': 'proposal_sent',
  '지원': 'applied',
  '커피챗': 'coffee_chat',
  '전화 인터뷰': 'phone_interview',
  '직무 인터뷰': 'job_interview',
  '컬처 인터뷰': 'culture_interview',
  '최종 합격': 'final_accepted',
  '최종 합류': 'joined',
}

const OUTCOME_MAP: Record<string, string> = {
  '진행 중': 'in_progress',
  '탈락': 'rejected',
  '포기': 'withdrawn',
  '무응답': 'no_response',
  '수락': 'accepted',
  '거절': 'declined',
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.SHEETS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, stage, outcome, memo } = body as {
      id: string
      stage?: string
      outcome?: string
      memo?: string
    }

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, string | null> = {}
    if (stage !== undefined) {
      const mapped = STAGE_MAP[stage]
      if (mapped) updates.stage = mapped
    }
    if (outcome !== undefined) {
      const mapped = OUTCOME_MAP[outcome]
      if (mapped) updates.outcome = mapped
    }
    if (memo !== undefined) updates.memo = memo || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'no editable fields' })
    }

    const { error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, updated: updates })
  } catch (err) {
    console.error('Sheets webhook error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
