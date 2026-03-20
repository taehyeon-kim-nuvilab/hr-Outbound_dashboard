import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { STAGE_ORDER, STAGES } from '@/lib/types'
import type { Stage } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const positionId = searchParams.get('position_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabase
      .from('candidates')
      .select('id, stage, position_id, proposal_date')

    if (positionId) {
      query = query.eq('position_id', positionId)
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

    // For each stage at index i, count candidates whose stage is in STAGE_ORDER.slice(i)
    const funnel = STAGE_ORDER.map((stage, i) => {
      const includedStages = STAGE_ORDER.slice(i) as Stage[]
      const count = candidates?.filter(c => includedStages.includes(c.stage as Stage)).length ?? 0
      const percent = total > 0 ? (count / total) * 100 : 0
      const label = STAGES.find(s => s.value === stage)?.label ?? stage

      return {
        stage,
        label,
        count,
        percent: Math.round(percent * 10) / 10,
      }
    })

    return NextResponse.json({ funnel, total })
  } catch (err) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ error: '대시보드 데이터 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
