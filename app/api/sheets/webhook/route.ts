import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
    const { id, position, url, ninehire_url, sourcer, platform, stage, outcome, memo, proposal_date } = body as {
      id?: string
      position?: string
      url?: string
      ninehire_url?: string
      sourcer?: string
      platform?: string
      stage?: string
      outcome?: string
      memo?: string
      proposal_date?: string
    }

    // 새 후보자 추가 (id 없음)
    if (!id) {
      // 이름으로 UUID 조회
      const [posRes, srcRes, pltRes] = await Promise.all([
        position ? supabase.from('positions').select('id').eq('name', position).single() : Promise.resolve({ data: null }),
        sourcer ? supabase.from('sourcers').select('id').eq('name', sourcer).single() : Promise.resolve({ data: null }),
        platform ? supabase.from('sourcing_platforms').select('id').eq('name', platform).single() : Promise.resolve({ data: null }),
      ])

      const { data: newCandidate, error } = await supabase
        .from('candidates')
        .insert({
          position_id: posRes.data?.id ?? null,
          url: url || null,
          ninehire_url: ninehire_url || null,
          sourcer_id: srcRes.data?.id ?? null,
          sourcing_platform_id: pltRes.data?.id ?? null,
          stage: STAGE_MAP[stage ?? ''] ?? 'proposal_sent',
          outcome: OUTCOME_MAP[outcome ?? ''] ?? 'in_progress',
          memo: memo || null,
          proposal_date: proposal_date || null,
        })
        .select('id')
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, action: 'created', id: newCandidate.id })
    }

    // 기존 후보자 수정 (stage, outcome, memo만 허용)
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

    return NextResponse.json({ success: true, action: 'updated', updated: updates })
  } catch (err) {
    console.error('Sheets webhook error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
