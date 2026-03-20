import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL 파라미터가 필요합니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('candidates')
      .select(`
        id,
        stage,
        created_at,
        position:positions(name)
      `)
      .eq('url', url)
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ isDuplicate: false })
    }

    const position = data.position as unknown as { name: string } | null

    return NextResponse.json({
      isDuplicate: true,
      candidate: {
        position: position?.name ?? null,
        stage: data.stage,
        createdAt: data.created_at,
      },
    })
  } catch {
    return NextResponse.json({ error: 'URL 확인 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
