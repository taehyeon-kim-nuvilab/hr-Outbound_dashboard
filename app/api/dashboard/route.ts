import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { STAGE_ORDER, CONVERSION_STAGE_ORDER, STAGES } from '@/lib/types'
import type { Stage } from '@/lib/types'

type CandRow = {
  id: string
  stage: string
  outcome: string
  position_id: string | null
  sourcer_id: string | null
  proposal_date: string | null
  sourcer: { name: string } | null
}

const SF_STAGES = CONVERSION_STAGE_ORDER.slice(1) // applied → joined (제안발송·커피챗 제외)

function buildCumulative(cands: CandRow[], stages: Stage[], skipPhoneIds: Set<string>) {
  const total = cands.length
  const nonSkipCands = cands.filter(c => !c.position_id || !skipPhoneIds.has(c.position_id))
  const skipOnlyCands = cands.filter(c => c.position_id && skipPhoneIds.has(c.position_id))
  return stages.map((stage, i) => {
    const includedStages = stages.slice(i)
    // 전화 인터뷰 단계: skip 포지션 제외
    const eligible = stage === 'phone_interview' ? nonSkipCands : cands
    const count = eligible.filter(c => includedStages.includes(c.stage as Stage)).length
    // 전환율 계산용: 항상 skip 포지션 제외한 카운트
    const countNoSkip = nonSkipCands.filter(c => includedStages.includes(c.stage as Stage)).length
    // 전화생략 포지션만의 카운트 (지원→직무 전환율 계산용)
    const countSkipOnly = skipOnlyCands.filter(c => includedStages.includes(c.stage as Stage)).length
    const percent = total > 0 ? (count / total) * 100 : 0
    const label = STAGES.find(s => s.value === stage)?.label ?? stage
    return { stage, label, count, countNoSkip, countSkipOnly, percent: Math.round(percent * 10) / 10 }
  })
}

function buildActive(cands: CandRow[], stages: Stage[]) {
  const active = cands.filter(c => c.outcome === 'in_progress')
  return stages.map(stage => {
    const count = active.filter(c => c.stage === stage).length
    const label = STAGES.find(s => s.value === stage)?.label ?? stage
    const rejected = cands.filter(c => c.stage === stage && c.outcome !== 'in_progress').length
    return { stage, label, count, rejected }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const positionIds = searchParams.getAll('position_id')
    const sourcerId = searchParams.get('sourcer_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // 전화 인터뷰 생략 포지션 ID 목록 조회
    const { data: positionsData } = await supabase
      .from('positions')
      .select('id, skip_phone_interview')
    const skipPhoneIds = new Set(
      (positionsData ?? []).filter(p => p.skip_phone_interview).map(p => p.id)
    )

    let query = supabase
      .from('candidates')
      .select('id, stage, outcome, position_id, sourcer_id, proposal_date, sourcer:sourcers(name)')

    if (positionIds.length > 0) query = query.in('position_id', positionIds)
    if (sourcerId) query = query.eq('sourcer_id', sourcerId)
    if (startDate) query = query.gte('proposal_date', startDate)
    if (endDate) query = query.lte('proposal_date', endDate)

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const candidates = (data ?? []) as unknown as CandRow[]
    const isSearchFirm = (c: CandRow) => c.sourcer?.name?.includes('서치펌') ?? false

    const outboundCands = candidates.filter(c => !isSearchFirm(c))
    const sfCands = candidates.filter(c => isSearchFirm(c))

    // 아웃바운드 퍼널
    const funnelCumulative = buildCumulative(outboundCands, CONVERSION_STAGE_ORDER, skipPhoneIds)
    const funnelActive = buildActive(outboundCands, SF_STAGES)
    const total = outboundCands.length

    // 서치펌 퍼널 (제안발송 단계 없음)
    const funnelSFCumulative = buildCumulative(sfCands, SF_STAGES, skipPhoneIds)

    const funnelSFActive = buildActive(sfCands, SF_STAGES)
    const sfTotal = sfCands.length

    // 서치펌별 개별 breakdown
    const sfNames = [...new Set(sfCands.map(c => c.sourcer?.name ?? '기타'))]
    const sfBreakdown = sfNames.map(name => {
      const firmCands = sfCands.filter(c => (c.sourcer?.name ?? '기타') === name)
      return {
        name,
        total: firmCands.length,
        cumulative: buildCumulative(firmCands, SF_STAGES, skipPhoneIds),
        active: buildActive(firmCands, SF_STAGES),
      }
    })

    return NextResponse.json({
      funnel: funnelCumulative,
      funnelCumulative,
      funnelActive,
      total,
      funnelSFCumulative,
      funnelSFActive,
      sfTotal,
      sfBreakdown,
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ error: '대시보드 데이터 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
