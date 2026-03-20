import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { STAGE_ORDER } from '@/lib/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { position_id, url, sourcing_platform_id, sourcer_id, stage, outcome, memo, proposal_date } = body

    if (stage && !STAGE_ORDER.includes(stage)) {
      return NextResponse.json({ error: '유효하지 않은 단계입니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('candidates')
      .update({
        position_id: position_id || null,
        url: url || null,
        sourcing_platform_id: sourcing_platform_id || null,
        sourcer_id: sourcer_id || null,
        stage,
        outcome: outcome || 'in_progress',
        memo: memo || null,
        proposal_date: proposal_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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

    if (!data) {
      return NextResponse.json({ error: '후보자를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: '후보자 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '후보자 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
