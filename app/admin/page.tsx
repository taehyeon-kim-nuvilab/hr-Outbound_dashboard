'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { STAGES, OUTCOMES } from '@/lib/types'
import type { Candidate, Position, SourcingPlatform, Sourcer, Stage, Outcome } from '@/lib/types'

interface CandidateForm {
  position_id: string
  url: string
  ninehire_url: string
  sourcing_platform_id: string
  sourcer_id: string
  stage: Stage
  outcome: Outcome
  memo: string
  proposal_date: string
}

const today = new Date().toISOString().split('T')[0]

function MultiSelect({ label, options, value, onChange }: {
  label: string
  options: { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  const displayText = value.length === 0 ? `${label} 전체` : `${label} ${value.length}개`
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`border rounded-lg px-3 py-2 text-sm flex items-center gap-1 whitespace-nowrap ${value.length > 0 ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-700'}`}
      >
        {displayText} <span className="text-gray-400 text-xs">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] py-1 max-h-64 overflow-y-auto">
            {options.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const defaultForm: CandidateForm = {
  position_id: '',
  url: '',
  ninehire_url: '',
  sourcing_platform_id: '',
  sourcer_id: '',
  stage: 'proposal_sent',
  outcome: 'in_progress',
  memo: '',
  proposal_date: today,
}

export default function AdminPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [platforms, setPlatforms] = useState<SourcingPlatform[]>([])
  const [sourcers, setSourcers] = useState<Sourcer[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPosition, setFilterPosition] = useState<string[]>([])
  const [filterSearch, setFilterSearch] = useState('')
  const [filterSourcer, setFilterSourcer] = useState<string[]>([])
  const [filterPlatform, setFilterPlatform] = useState<string[]>([])
  const [filterStage, setFilterStage] = useState<string[]>([])
  const [filterOutcome, setFilterOutcome] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CandidateForm>(defaultForm)
  const [urlWarning, setUrlWarning] = useState<string | null>(null)
  const [urlChecking, setUrlChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvUploading, setCsvUploading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 20

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [candRes, posRes, platRes, srcRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/positions'),
        fetch('/api/sourcing-platforms'),
        fetch('/api/sourcers'),
      ])
      const [cands, pos, plat, src] = await Promise.all([
        candRes.json(),
        posRes.json(),
        platRes.json(),
        srcRes.json(),
      ])
      setCandidates(Array.isArray(cands) ? cands : [])
      setPositions(Array.isArray(pos) ? pos : [])
      setPlatforms(Array.isArray(plat) ? plat : [])
      setSourcers(Array.isArray(src) ? src : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => { setCurrentPage(1) }, [filterSearch, filterPosition, filterSourcer, filterPlatform, filterStage, filterOutcome])

  const openAdd = () => {
    setEditingId(null)
    setForm(defaultForm)
    setUrlWarning(null)
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (c: Candidate) => {
    setEditingId(c.id)
    setForm({
      position_id: c.position_id ?? '',
      url: c.url ?? '',
      ninehire_url: c.ninehire_url ?? '',
      sourcing_platform_id: c.sourcing_platform_id ?? '',
      sourcer_id: c.sourcer_id ?? '',
      stage: c.stage,
      outcome: c.outcome,
      memo: c.memo ?? '',
      proposal_date: c.proposal_date ?? '',
    })
    setUrlWarning(null)
    setFormError(null)
    setShowModal(true)
  }

  const checkUrl = useCallback(async (url: string) => {
    if (!url.trim()) {
      setUrlWarning(null)
      return
    }
    // URL 형식인 경우에만 중복 체크
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // 이름 중복 체크 (안내만)
      const isDupName = candidates.some(c => c.url === url && c.id !== editingId)
      setUrlWarning(isDupName ? `동일한 이름이 이미 등록되어 있습니다.` : null)
      return
    }
    setUrlChecking(true)
    try {
      const res = await fetch(`/api/candidates/check-url?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (data.isDuplicate) {
        if (editingId && candidates.find(c => c.id === editingId)?.url === url) {
          setUrlWarning(null)
        } else {
          const c = data.candidate
          setUrlWarning(`이미 등록된 URL입니다. (포지션: ${c.position ?? '-'}, 단계: ${c.stage})`)
        }
      } else {
        setUrlWarning(null)
      }
    } catch {
      setUrlWarning(null)
    } finally {
      setUrlChecking(false)
    }
  }, [editingId, candidates])

  const handleUrlBlur = () => {
    checkUrl(form.url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)

    const body = {
      position_id: form.position_id || null,
      url: form.url || null,
      ninehire_url: form.ninehire_url || null,
      sourcing_platform_id: form.sourcing_platform_id || null,
      sourcer_id: form.sourcer_id || null,
      stage: form.stage,
      outcome: form.outcome,
      memo: form.memo || null,
      proposal_date: form.proposal_date || null,
    }

    try {
      const res = editingId
        ? await fetch(`/api/candidates/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/candidates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error || '저장 중 오류가 발생했습니다.')
        return
      }

      const saved = await res.json()
      if (editingId) {
        setCandidates(prev => prev.map(c => c.id === editingId ? { ...c, ...saved } : c))
      } else {
        setCandidates(prev => [saved, ...prev])
      }
      setShowModal(false)
    } catch {
      setFormError('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleInlineUpdate = async (id: string, field: 'stage' | 'outcome' | 'sourcer_id', value: string) => {
    const candidate = candidates.find(c => c.id === id)
    if (!candidate) return
    // 즉시 로컬 state 업데이트
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, [field]: value || null } as Candidate : c))
    const body = {
      position_id: candidate.position_id,
      url: candidate.url,
      sourcing_platform_id: candidate.sourcing_platform_id,
      sourcer_id: field === 'sourcer_id' ? (value || null) : candidate.sourcer_id,
      stage: field === 'stage' ? value : candidate.stage,
      outcome: field === 'outcome' ? value : candidate.outcome,
      memo: candidate.memo,
    }
    await fetch(`/api/candidates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/candidates/${id}`, { method: 'DELETE' })
      setCandidates(prev => prev.filter(c => c.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null)
    setCsvPreview([])
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) { setCsvError('데이터가 없습니다.'); return }

      const stageMap: Record<string, string> = {
        '제안발송': 'proposal_sent', '지원': 'applied',
        '전화인터뷰': 'phone_interview', '직무인터뷰': 'job_interview',
        '컬처인터뷰': 'culture_interview', '최종합격': 'final_accepted', '최종합류': 'joined',
      }
      const normalizeKey = (s: string) => s.replace(/\s/g, '')
      const outcomeMap: Record<string, string> = {
        '진행중': 'in_progress', '탈락': 'rejected', '포기': 'withdrawn',
      }

      const rows = lines.slice(1).map((line, idx) => {
        const cols = line.split(',').map(c => c.trim())
        const rowNum = cols[0] || String(idx + 1)
        const positionName = cols[1] || ''
        const url = cols[2] || ''
        const platformName = cols[3] || ''
        const sourcerName = cols[4] || ''
        const stageLabel = cols[5] || '제안 발송'
        const outcomeLabel = cols[6] || '진행 중'
        const memo = cols[7] || ''
        const proposal_date = cols[8] || today
        const ninehire_url = cols[9] || ''

        const position = positions.find(p => p.name === positionName)
        const platform = platforms.find(p => p.name === platformName)
        const sourcer = sourcers.find(s => s.name === sourcerName)

        return {
          _row: rowNum,
          position_id: position?.id || null,
          position_name: positionName,
          url,
          sourcing_platform_id: platform?.id || null,
          platform_name: platformName,
          sourcer_id: sourcer?.id || null,
          sourcer_name: sourcerName,
          ninehire_url: ninehire_url || null,
          stage: stageMap[normalizeKey(stageLabel)] || 'proposal_sent',
          stage_label: stageLabel,
          outcome: outcomeMap[normalizeKey(outcomeLabel)] || 'in_progress',
          outcome_label: outcomeLabel,
          memo,
          proposal_date,
        }
      })
      setCsvPreview(rows)
    }
    reader.readAsText(file)
  }

  const handleCsvUpload = async () => {
    if (csvPreview.length === 0) return
    setCsvUploading(true)
    try {
      const res = await fetch('/api/candidates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: csvPreview }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.duplicateRows?.length > 0) {
          const lines = data.duplicateRows.map((d: any) => `${d.row}번: ${d.url}`).join('\n')
          setCsvError(`중복된 URL이 있어 등록할 수 없습니다:\n${lines}`)
        } else {
          setCsvError(data.error || '오류가 발생했습니다.')
        }
        return
      }
      setShowCsvModal(false)
      setCsvPreview([])
      loadData()
    } catch {
      setCsvError('업로드 중 오류가 발생했습니다.')
    } finally {
      setCsvUploading(false)
    }
  }

  const downloadCsv = () => {
    const header = '번호,포지션,URL,소싱플랫폼,담당자,단계,결과,메모,제안발송날짜,나인하이어URL'
    const rows = filteredCandidates.map((c, i) => [
      i + 1,
      c.position?.name ?? '',
      c.url ?? '',
      c.sourcing_platform?.name ?? '',
      c.sourcer?.name ?? '',
      getStageLabel(c.stage),
      getOutcomeLabel(c.outcome),
      (c.memo ?? '').replace(/,/g, ' '),
      c.proposal_date ?? '',
      c.ninehire_url ?? '',
    ].join(','))
    const blob = new Blob(['\uFEFF' + header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidates_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadTemplate = () => {
    const header = '번호,포지션,URL,소싱플랫폼,담당자,단계,결과,메모,제안발송날짜,나인하이어URL'
    const example = `1,Recruiting Manager,https://linkedin.com/in/example,LinkedIn,김태현,제안 발송,진행 중,,${today},`
    const blob = new Blob(['\uFEFF' + header + '\n' + example], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'candidates_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const getStageLabel = (value: string) => STAGES.find(s => s.value === value)?.label ?? value
  const getOutcomeLabel = (value: string) => OUTCOMES.find(o => o.value === value)?.label ?? value

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'withdrawn': return 'bg-gray-100 text-gray-600'
      case 'no_response': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const filteredCandidates = candidates.filter(c => {
    if (filterPosition.length && !filterPosition.includes(c.position_id ?? '')) return false
    if (filterSourcer.length && !filterSourcer.includes(c.sourcer_id ?? '')) return false
    if (filterPlatform.length && !filterPlatform.includes(c.sourcing_platform_id ?? '')) return false
    if (filterStage.length && !filterStage.includes(c.stage)) return false
    if (filterOutcome.length && !filterOutcome.includes(c.outcome)) return false
    if (filterSearch) {
      const q = filterSearch.toLowerCase()
      return (c.url?.toLowerCase().includes(q) ?? false)
        || (c.memo?.toLowerCase().includes(q) ?? false)
    }
    return true
  })
  const isFiltered = !!(filterSearch || filterPosition.length || filterSourcer.length || filterPlatform.length || filterStage.length || filterOutcome.length)

  const totalPages = Math.ceil(filteredCandidates.length / PAGE_SIZE)
  const pagedCandidates = filteredCandidates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">어드민</h1>
          <p className="text-gray-500 mt-1">후보자 데이터를 관리합니다</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            설정
          </Link>
          <button
            onClick={downloadCsv}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V4" />
            </svg>
            CSV 다운로드
          </button>
          <button
            onClick={() => { setCsvPreview([]); setCsvError(null); setShowCsvModal(true) }}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            CSV 일괄 등록
          </button>
          <button
            onClick={openAdd}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            후보자 추가
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          placeholder="이름 / URL / 메모 검색"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
        />
        <MultiSelect
          label="포지션"
          options={positions.map(p => ({ value: p.id, label: p.name }))}
          value={filterPosition}
          onChange={setFilterPosition}
        />
        <MultiSelect
          label="담당자"
          options={sourcers.map(s => ({ value: s.id, label: s.name }))}
          value={filterSourcer}
          onChange={setFilterSourcer}
        />
        <MultiSelect
          label="플랫폼"
          options={platforms.map(p => ({ value: p.id, label: p.name }))}
          value={filterPlatform}
          onChange={setFilterPlatform}
        />
        <MultiSelect
          label="단계"
          options={STAGES.map(s => ({ value: s.value, label: s.label }))}
          value={filterStage}
          onChange={setFilterStage}
        />
        <MultiSelect
          label="결과"
          options={OUTCOMES.map(o => ({ value: o.value, label: o.label }))}
          value={filterOutcome}
          onChange={setFilterOutcome}
        />
        {isFiltered && (
          <button
            onClick={() => { setFilterSearch(''); setFilterPosition([]); setFilterSourcer([]); setFilterPlatform([]); setFilterStage([]); setFilterOutcome([]) }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
          >
            초기화
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">후보자 목록</h2>
          <span className="text-sm text-gray-500">
            {isFiltered ? `${filteredCandidates.length}명 (전체 ${candidates.length}명)` : `총 ${candidates.length}명`}
          </span>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">{isFiltered ? '필터 조건에 맞는 후보자가 없습니다.' : '후보자가 없습니다. 추가해보세요!'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">포지션</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">URL/이름</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">나인하이어</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">담당자</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">소싱플랫폼</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">단계</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">결과</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">발송일</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">메모</th>
                  <th className="sticky right-0 bg-gray-50 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap z-10">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagedCandidates.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {c.position?.name ?? <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-[180px]">
                      {c.url ? (
                        c.url.startsWith('http://') || c.url.startsWith('https://') ? (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate block max-w-[180px]"
                            title={c.url}
                          >
                            {c.url}
                          </a>
                        ) : (
                          <span className="text-gray-700 truncate block max-w-[180px]">{c.url}</span>
                        )
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {c.ninehire_url ? (
                        <a href={c.ninehire_url} target="_blank" rel="noopener noreferrer"
                          className="text-orange-500 hover:text-orange-700 hover:underline text-xs font-medium">
                          나인하이어 ↗
                        </a>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={c.sourcer_id ?? ''}
                        onChange={e => handleInlineUpdate(c.id, 'sourcer_id', e.target.value)}
                        className="text-xs font-medium bg-purple-50 text-purple-700 border-0 rounded-full px-2.5 py-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-300"
                      >
                        <option value="">미지정</option>
                        {sourcers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.sourcing_platform?.name ?? <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={c.stage}
                        onChange={e => handleInlineUpdate(c.id, 'stage', e.target.value)}
                        className="text-xs font-medium bg-indigo-50 text-indigo-700 border-0 rounded-full px-2.5 py-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        {STAGES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={c.outcome}
                        onChange={e => handleInlineUpdate(c.id, 'outcome', e.target.value)}
                        className={`text-xs font-medium border-0 rounded-full px-2.5 py-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300 ${getOutcomeBadge(c.outcome)}`}
                      >
                        {OUTCOMES.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {c.proposal_date ? new Date(c.proposal_date + 'T00:00:00').toLocaleDateString('ko-KR') : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px]">
                      <span className="truncate block max-w-[200px]" title={c.memo ?? ''}>
                        {c.memo || <span className="text-gray-400">-</span>}
                      </span>
                    </td>
                    <td className="sticky right-0 bg-white px-6 py-4 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(c.id)}
                          className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
            <p className="text-sm text-gray-500">
              총 {filteredCandidates.length}명 · {currentPage}/{totalPages} 페이지
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                이전
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const page = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? '후보자 수정' : '후보자 추가'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">포지션</label>
                <select
                  value={form.position_id}
                  onChange={e => setForm(f => ({ ...f, position_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">선택 안 함</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">URL / 이름</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    onBlur={handleUrlBlur}
                    placeholder="https://linkedin.com/in/... 또는 이름 직접 입력"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      urlWarning ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
                    }`}
                  />
                  {urlChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {urlWarning && (
                  <div className="mt-1.5 flex items-start gap-1.5">
                    <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-amber-600">{urlWarning}</p>
                  </div>
                )}
              </div>

              {/* NineHire URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  나인하이어 링크 <span className="text-gray-400 font-normal text-xs">(선택)</span>
                </label>
                <input
                  type="url"
                  value={form.ninehire_url}
                  onChange={e => setForm(f => ({ ...f, ninehire_url: e.target.value }))}
                  placeholder="https://app.ninehire.com/..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Sourcing Platform */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">소싱 플랫폼</label>
                <select
                  value={form.sourcing_platform_id}
                  onChange={e => setForm(f => ({ ...f, sourcing_platform_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">선택 안 함</option>
                  {platforms.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Sourcer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">아웃바운드 담당자</label>
                <select
                  value={form.sourcer_id}
                  onChange={e => setForm(f => ({ ...f, sourcer_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">선택 안 함</option>
                  {sourcers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Stage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">단계</label>
                <select
                  value={form.stage}
                  onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {STAGES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">결과</label>
                <select
                  value={form.outcome}
                  onChange={e => setForm(f => ({ ...f, outcome: e.target.value as Outcome }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {OUTCOMES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Proposal Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">제안 발송 날짜</label>
                <input
                  type="date"
                  value={form.proposal_date}
                  onChange={e => setForm(f => ({ ...f, proposal_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Memo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">메모</label>
                <textarea
                  value={form.memo}
                  onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                  placeholder="자유롭게 메모를 입력하세요..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '저장 중...' : editingId ? '수정하기' : '추가하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">후보자 삭제</h3>
                <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">CSV 일괄 등록</h2>
              <button onClick={() => setShowCsvModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700">
                <p className="font-medium mb-1">CSV 파일 형식</p>
                <p className="text-xs text-blue-600">포지션, URL, 소싱플랫폼, 담당자, 단계, 결과, 메모, 제안발송날짜, 나인하이어URL 순서로 작성해주세요.</p>
                <p className="text-xs text-blue-600 mt-0.5">단계: 제안 발송 / 지원 / 전화 인터뷰 / 직무 인터뷰 / 컬처 인터뷰 / 최종 합격 / 최종 합류</p>
                <p className="text-xs text-blue-600">결과: 진행 중 / 탈락 / 포기</p>
              </div>
              <button onClick={downloadTemplate} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                템플릿 다운로드
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CSV 파일 선택</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFile}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {csvError && <p className="text-sm text-red-600">{csvError}</p>}
              {csvPreview.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">미리보기 ({csvPreview.length}명)</p>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-500">번호</th>
                          <th className="px-3 py-2 text-left text-gray-500">포지션</th>
                          <th className="px-3 py-2 text-left text-gray-500">URL</th>
                          <th className="px-3 py-2 text-left text-gray-500">플랫폼</th>
                          <th className="px-3 py-2 text-left text-gray-500">담당자</th>
                          <th className="px-3 py-2 text-left text-gray-500">단계</th>
                          <th className="px-3 py-2 text-left text-gray-500">결과</th>
                          <th className="px-3 py-2 text-left text-gray-500">날짜</th>
                          <th className="px-3 py-2 text-left text-gray-500">나인하이어URL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {csvPreview.map((row, i) => (
                          <tr key={i} className={!row.position_id && row.position_name ? 'bg-amber-50' : ''}>
                            <td className="px-3 py-2 text-gray-400 text-center">{row._row}</td>
                            <td className="px-3 py-2 text-gray-700">
                              {row.position_id ? row.position_name : <span className="text-amber-600">{row.position_name || '-'} ⚠</span>}
                            </td>
                            <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{row.url || '-'}</td>
                            <td className="px-3 py-2 text-gray-700">
                              {row.sourcing_platform_id ? row.platform_name : <span className="text-amber-600">{row.platform_name || '-'} ⚠</span>}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {row.sourcer_name ? (row.sourcer_id ? row.sourcer_name : <span className="text-amber-600">{row.sourcer_name} ⚠</span>) : '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">{row.stage_label}</td>
                            <td className="px-3 py-2 text-gray-700">{row.outcome_label}</td>
                            <td className="px-3 py-2 text-gray-500">{row.proposal_date}</td>
                            <td className="px-3 py-2 text-gray-500 max-w-[100px] truncate">{row.ninehire_url || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvPreview.some((r: any) => (!r.position_id && r.position_name) || (!r.sourcer_id && r.sourcer_name)) && (
                    <p className="text-xs text-amber-600 mt-1">⚠ 표시는 등록되지 않은 포지션/플랫폼/담당자입니다. 설정에서 먼저 추가해주세요.</p>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCsvModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  취소
                </button>
                <button
                  onClick={handleCsvUpload}
                  disabled={csvPreview.length === 0 || csvUploading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {csvUploading ? '등록 중...' : `${csvPreview.length}명 등록하기`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
