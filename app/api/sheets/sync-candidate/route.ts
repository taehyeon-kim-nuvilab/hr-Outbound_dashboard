import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSheetsClient, STAGE_LABELS, OUTCOME_LABELS } from '@/lib/sheets'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? '후보자 현황'

// 시트에 반영되는 필드만 변경 감지
const SHEET_FIELDS = ['stage', 'outcome', 'memo', 'url', 'ninehire_url', 'proposal_date', 'position_id', 'sourcer_id', 'sourcing_platform_id']

function hasRelevantChange(record: Record<string, unknown>, oldRecord: Record<string, unknown> | null) {
  if (!oldRecord) return true // INSERT
  return SHEET_FIELDS.some(f => record[f] !== oldRecord[f])
}

export async function POST(request: NextRequest) {
  // Supabase webhook secret 검증
  const secret = request.headers.get('x-webhook-secret') ?? request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await request.json()
    const { type, record, old_record } = payload as {
      type: 'INSERT' | 'UPDATE' | 'DELETE'
      record: Record<string, unknown>
      old_record: Record<string, unknown> | null
    }

    if (type === 'DELETE') return NextResponse.json({ ok: true, skipped: 'delete' })
    if (!hasRelevantChange(record, old_record)) return NextResponse.json({ ok: true, skipped: 'no_change' })

    const candidateId = record.id as string

    // DB에서 조인된 데이터 재조회
    const { data: c, error } = await supabase
      .from('candidates')
      .select(`id, stage, outcome, memo, url, ninehire_url, proposal_date,
        position:positions(name), sourcer:sourcers(name), sourcing_platform:sourcing_platforms(name)`)
      .eq('id', candidateId)
      .single()

    if (error || !c) return NextResponse.json({ error: 'candidate not found' }, { status: 404 })

    const pos = Array.isArray(c.position) ? c.position[0] : c.position
    const src = Array.isArray(c.sourcer) ? c.sourcer[0] : c.sourcer
    const plt = Array.isArray(c.sourcing_platform) ? c.sourcing_platform[0] : c.sourcing_platform

    const row = [
      c.id,
      (pos as { name: string } | null)?.name ?? '',
      c.url ?? '',
      c.ninehire_url ?? '',
      (src as { name: string } | null)?.name ?? '',
      (plt as { name: string } | null)?.name ?? '',
      STAGE_LABELS[c.stage] ?? c.stage,
      OUTCOME_LABELS[c.outcome] ?? c.outcome,
      c.memo ?? '',
      c.proposal_date ?? '',
      new Date().toISOString(),
    ]

    const sheets = getSheetsClient()

    // A열에서 ID로 행 위치 찾기
    const idCol = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:A`,
    })
    const ids = (idCol.data.values ?? []).flat()
    const idx = ids.indexOf(candidateId)

    if (idx >= 0) {
      // 기존 행 업데이트
      const rowNum = idx + 2
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNum}:K${rowNum}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      })
      return NextResponse.json({ ok: true, action: 'updated', row: rowNum })
    } else {
      // 새 행 추가
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:K`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      })
      return NextResponse.json({ ok: true, action: 'appended' })
    }
  } catch (err) {
    console.error('sync-candidate error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
