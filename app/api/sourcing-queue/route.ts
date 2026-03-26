import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const positionId = searchParams.get('position_id')
    const platform = searchParams.get('platform')

    let query = supabase
      .from('sourcing_queue')
      .select('*, position:positions(id, name)')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (positionId) query = query.eq('position_id', positionId)
    if (platform) query = query.eq('platform', platform)

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '조회 중 오류 발생' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, message_content } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id, status 필수' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      status,
      reviewed_at: new Date().toISOString(),
    }

    if (message_content !== undefined) {
      updateData.message_content = message_content
    }

    const { data, error } = await supabase
      .from('sourcing_queue')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '업데이트 중 오류 발생' }, { status: 500 })
  }
}
