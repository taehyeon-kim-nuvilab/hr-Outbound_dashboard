import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSheetsClient, HEADER_ROW, STAGE_LABELS, OUTCOME_LABELS } from '@/lib/sheets'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? '후보자 현황'

export async function POST(request: NextRequest) {
  try {
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select(`
        id, stage, outcome, memo, url, ninehire_url, proposal_date,
        position:positions(name),
        sourcer:sourcers(name),
        sourcing_platform:sourcing_platforms(name)
      `)
      .order('proposal_date', { ascending: false })

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

    // 1. 전체 시트 초기화 및 헤더+데이터 기록
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:K`,
    })

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [HEADER_ROW, ...rows] },
    })

    // 2. 시트 ID 조회
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
    const sheet = meta.data.sheets?.find(s => s.properties?.title === SHEET_NAME)
    const sheetId = sheet?.properties?.sheetId ?? 0

    // 3. 드롭다운 및 서식 설정
    const stageLabels = Object.values(STAGE_LABELS)
    const outcomeLabels = Object.values(OUTCOME_LABELS)

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          // 단계 드롭다운 (G열, index 6)
          {
            setDataValidation: {
              range: { sheetId, startRowIndex: 1, endRowIndex: 10000, startColumnIndex: 6, endColumnIndex: 7 },
              rule: {
                condition: { type: 'ONE_OF_LIST', values: stageLabels.map(v => ({ userEnteredValue: v })) },
                showCustomUi: true,
                strict: true,
              },
            },
          },
          // 결과 드롭다운 (H열, index 7)
          {
            setDataValidation: {
              range: { sheetId, startRowIndex: 1, endRowIndex: 10000, startColumnIndex: 7, endColumnIndex: 8 },
              rule: {
                condition: { type: 'ONE_OF_LIST', values: outcomeLabels.map(v => ({ userEnteredValue: v })) },
                showCustomUi: true,
                strict: true,
              },
            },
          },
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
