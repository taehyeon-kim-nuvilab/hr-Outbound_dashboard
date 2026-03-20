import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { STAGE_ORDER } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const positionId = searchParams.get('position_id')
    const sourcerId = searchParams.get('sourcer_id')
    const stage = searchParams.get('stage')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabase
      .from('candidates')
      .select(`
        *,
        position:positions(id, name, created_at),
        sourcing_platform:sourcing_platforms(id, name, created_at),
        sourcer:sourcers(id, name, created_at)
      `)
      .order('proposal_date', { ascending: false })

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

    if (stage) {
      // When a stage filter is applied, return candidates at that stage
      // (cumulative: candidates who are at or beyond the given stage)
      const stageIndex = STAGE_ORDER.indexOf(stage as any)
      if (stageIndex !== -1) {
        const includedStages = STAGE_ORDER.slice(stageIndex)
        query = query.in('stage', includedStages)
      }
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: '후보자 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { position_id, url, ninehire_url, sourcing_platform_id, sourcer_id, stage, outcome, memo, proposal_date } = body

    if (!stage) {
      return NextResponse.json({ error: '단계는 필수입니다.' }, { status: 400 })
    }

    if (!STAGE_ORDER.includes(stage)) {
      return NextResponse.json({ error: '유효하지 않은 단계입니다.' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('candidates')
      .insert({
        position_id: position_id || null,
        url: url || null,
        ninehire_url: ninehire_url || null,
        sourcing_platform_id: sourcing_platform_id || null,
        sourcer_id: sourcer_id || null,
        stage,
        outcome: outcome || 'in_progress',
        memo: memo || null,
        proposal_date: proposal_date || today,
      })
      .select(`
        *,
        position:positions(id, name, created_at),
        sourcing_platform:sourcing_platforms(id, name, created_at),
        sourcer:sourcers(id, name, created_at)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: '후보자 추가 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
