import { NextRequest, NextResponse } from 'next/server'
import { getSheetsClient } from '@/lib/sheets'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!
const SHEET_NAME = '잠재 후보자'

const HEADER_ROW = ['sourcing_id', '포지션', '링크', '플랫폼', '최근 재직', '메모', '저장일시']

export async function POST(request: NextRequest) {
  try {
    const { sourcing_id, position, url, platform, recent_company, memo } = await request.json()

    if (!url) {
      return NextResponse.json({ error: '후보자 링크가 없습니다.' }, { status: 400 })
    }

    const sheets = getSheetsClient()

    // 시트 존재 여부 확인
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
    const sheet = meta.data.sheets?.find(s => s.properties?.title === SHEET_NAME)

    if (!sheet) {
      // 시트 없으면 자동 생성 + 헤더 추가
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
        },
      })
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [HEADER_ROW] },
      })
    }

    // KST 시간으로 저장
    const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19)

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[sourcing_id ?? '', position ?? '', url, platform ?? '', recent_company ?? '', memo ?? '', kstDate]],
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[save-potential]', err)
    return NextResponse.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
