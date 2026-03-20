import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { STAGE_ORDER, STAGES } from '@/lib/types'
import type { Stage } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const positionId = searchParams.get('position_id')
    const sourcerId = searchParams.get('sourcer_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabase
      .from('candidates')
      .select('id, stage, outcome, position_id, sourcer_id, proposal_date')

    if (positionId) {
      query = query.eq('position_id', positionId)
    }

    if (sourcerId) {
      query = query.eq('sourcer_id', sourcerId)
    }

    if (startDate) {
      query = query.gte('proposal_date', startDate)
    }

    if (endDate) {
      query = query.lte('proposal_date', endDate)
    }

    const { data: candidates, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = candidates?.length ?? 0

    // 누계 퍼널: 모든 단계 누적 (해당 단계 이상에 도달한 전체 인원)
    const funnelCumulative = STAGE_ORDER.map((stage, i) => {
      const includedStages = STAGE_ORDER.slice(i) as Stage[]
      const count = candidates?.filter(c => includedStages.includes(c.stage as Stage)).length ?? 0
      const percent = total > 0 ? (count / total) * 100 : 0
      const label = STAGES.find(s => s.value === stage)?.label ?? stage
      return { stage, label, count, percent: Math.round(percent * 10) / 10 }
    })

    // 진행형 퍼널: 현재 in_progress인 사람만, 각 단계 독립 카운트 (proposal_sent 제외)
    const activeStages = STAGE_ORDER.slice(1) // applied부터
    const activeCandidates = candidates?.filter(c => c.outcome === 'in_progress') ?? []
    const funnelActive = activeStages.map((stage) => {
      const count = activeCandidates.filter(c => c.stage === stage).length
      const label = STAGES.find(s => s.value === stage)?.label ?? stage
      // 해당 단계에 도달한 전체 인원 (탈락 포함) - 탈락 수 계산용
      const totalAtStage = candidates?.filter(c =>
        STAGE_ORDER.slice(STAGE_ORDER.indexOf(stage)).includes(c.stage as Stage) ||
        (c.stage === stage)
      ).length ?? 0
      const rejected = (candidates?.filter(c => c.stage === stage && c.outcome !== 'in_progress').length) ?? 0
      return { stage, label, count, rejected }
    })

    return NextResponse.json({ funnel: funnelCumulative, funnelCumulative, funnelActive, total })
  } catch (err) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ error: '대시보드 데이터 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
