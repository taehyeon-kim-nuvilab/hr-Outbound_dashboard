import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { STAGE_ORDER } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { candidates } = await request.json()

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: '후보자 데이터가 없습니다.' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]

    // URL 중복 검사
    const urls = candidates.map((c: any) => c.url).filter(Boolean)
    const duplicateUrls: string[] = []

    if (urls.length > 0) {
      const { data: existing } = await supabase
        .from('candidates')
        .select('url')
        .in('url', urls)

      if (existing && existing.length > 0) {
        existing.forEach((e: any) => duplicateUrls.push(e.url))
      }
    }

    // CSV 내 중복 URL 검사
    const seenUrls = new Set<string>()
    candidates.forEach((c: any) => {
      if (c.url && seenUrls.has(c.url)) duplicateUrls.push(c.url)
      if (c.url) seenUrls.add(c.url)
    })

    const uniqueDuplicates = [...new Set(duplicateUrls)]

    if (uniqueDuplicates.length > 0) {
      const duplicateRows = candidates
        .filter((c: any) => c.url && uniqueDuplicates.includes(c.url))
        .map((c: any) => ({ row: c._row, url: c.url }))

      return NextResponse.json({
        error: `중복된 URL이 있습니다.`,
        duplicateRows,
      }, { status: 409 })
    }

    const rows = candidates.map((c: any) => ({
      position_id: c.position_id || null,
      url: c.url || null,
      sourcing_platform_id: c.sourcing_platform_id || null,
      stage: STAGE_ORDER.includes(c.stage) ? c.stage : 'proposal_sent',
      outcome: ['in_progress', 'rejected', 'withdrawn'].includes(c.outcome) ? c.outcome : 'in_progress',
      memo: c.memo || null,
      proposal_date: c.proposal_date || today,
    }))

    const { data, error } = await supabase
      .from('candidates')
      .insert(rows)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: data?.length ?? 0 }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '일괄 등록 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
