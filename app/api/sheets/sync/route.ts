import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSheetsClient, HEADER_ROW, STAGE_LABELS, OUTCOME_LABELS } from '@/lib/sheets'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? '후보자 현황'

// Vercel Cron (GET) + 수동 호출 (POST) 모두 지원
export async function GET(request: NextRequest) {
  return handleSync(request)
}

export async function POST(request: NextRequest) {
  return handleSync(request)
}

async function handleSync(request: NextRequest) {
  try {
    const [{ data: candidates, error }, { data: positions }, { data: sourcers }, { data: platforms }] = await Promise.all([
      supabase
        .from('candidates')
        .select(`id, stage, outcome, memo, url, ninehire_url, proposal_date,
          position:positions(name), sourcer:sourcers(name), sourcing_platform:sourcing_platforms(name)`)
        .order('created_at', { ascending: false })
        .order('proposal_date', { ascending: false, nullsFirst: false }),
      supabase.from('positions').select('name').order('name'),
      supabase.from('sourcers').select('name').order('name'),
      supabase.from('sourcing_platforms').select('name').order('name'),
    ])

    if (error) throw error

    const rows = (candidates ?? []).map(c => {
      const pos = Array.isArray(c.position) ? c.position[0] : c.position
      const src = Array.isArray(c.sourcer) ? c.sourcer[0] : c.sourcer
      const plt = Array.isArray(c.sourcing_platform) ? c.sourcing_platform[0] : c.sourcing_platform
      return [
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
    })

    const sheets = getSheetsClient()

    // 1. 헤더+데이터를 한번에 덮어쓰기 (clear 없이 atomic하게)
    const allValues = [HEADER_ROW, ...rows]
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:K${allValues.length}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: allValues },
    })

    // 데이터 아래 남은 이전 행 제거
    const clearFrom = allValues.length + 1
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${clearFrom}:K`,
    })

    // 2. 시트 ID 조회
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
    const sheet = meta.data.sheets?.find(s => s.properties?.title === SHEET_NAME)
    const sheetId = sheet?.properties?.sheetId ?? 0

    // 3. 드롭다운 및 서식 설정
    const stageLabels = Object.values(STAGE_LABELS)
    const outcomeLabels = Object.values(OUTCOME_LABELS)
    const positionNames = (positions ?? []).map(p => p.name)
    const sourcerNames = (sourcers ?? []).map(s => s.name)
    const platformNames = (platforms ?? []).map(p => p.name)

    const makeDropdown = (colStart: number, values: string[]) => ({
      setDataValidation: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 10000, startColumnIndex: colStart, endColumnIndex: colStart + 1 },
        rule: {
          condition: { type: 'ONE_OF_LIST' as const, values: values.map(v => ({ userEnteredValue: v })) },
          showCustomUi: true,
          strict: false, // 새 항목 추가 시 에러 방지
        },
      },
    })

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          makeDropdown(1, positionNames),   // B열 포지션
          makeDropdown(4, sourcerNames),    // E열 담당자
          makeDropdown(5, platformNames),   // F열 플랫폼
          makeDropdown(6, stageLabels),     // G열 단계
          makeDropdown(7, outcomeLabels),   // H열 결과
          // A열(id), K열(last_synced_at) 숨기기
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
              properties: { hiddenByUser: true },
              fields: 'hiddenByUser',
            },
          },
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: 'COLUMNS', startIndex: 10, endIndex: 11 },
              properties: { hiddenByUser: true },
              fields: 'hiddenByUser',
            },
          },
          // 헤더 굵게
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
              fields: 'userEnteredFormat(textFormat,backgroundColor)',
            },
          },
          // 행 고정 (헤더)
          {
            updateSheetProperties: {
              properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
              fields: 'gridProperties.frozenRowCount',
            },
          },
        ],
      },
    })

    return NextResponse.json({ success: true, synced: rows.length })
  } catch (err) {
    console.error('Sheets sync error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
