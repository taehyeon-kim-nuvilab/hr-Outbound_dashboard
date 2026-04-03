'use client'

import { useEffect, useState, useCallback } from 'react'

interface Position {
  id: string
  name: string
}

interface Sourcer {
  id: string
  name: string
}

interface SourcingCandidate {
  id: string
  platform: string
  position_id: string | null
  position: Position | null
  candidate_id: string
  candidate_url: string
  recent_company: string | null
  signals: string[] | null
  ai_note: string | null
  personalization_hooks: string[] | null
  confidence: string | null
  status: string
  message_content: string | null
  sourcer_id: string | null
  created_at: string
}

const CONFIDENCE_BADGE: Record<string, string> = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

const STATUS_TABS = [
  { value: 'pending', label: '검토 대기' },
  { value: 'approved', label: '승인됨' },
  { value: 'message_sent', label: '발송 완료' },
  { value: 'rejected', label: '거절됨' },
]

export default function SourcingPage() {
  const [candidates, setCandidates] = useState<SourcingCandidate[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [sourcers, setSourcers] = useState<Sourcer[]>([])
  const [selectedSourcer, setSelectedSourcer] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState('pending')
  const [positionFilter, setPositionFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [editingMessage, setEditingMessage] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [fadingOut, setFadingOut] = useState<Record<string, boolean>>({})
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const [potentialMemo, setPotentialMemo] = useState<Record<string, string>>({})
  const [potentialOpen, setPotentialOpen] = useState<Record<string, boolean>>({})
  const [potentialLoading, setPotentialLoading] = useState<Record<string, boolean>>({})
  const [potentialSaved, setPotentialSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/positions')
      .then(r => r.json())
      .then(data => setPositions(Array.isArray(data) ? data : []))
      .catch(console.error)
    fetch('/api/sourcers')
      .then(r => r.json())
      .then(data => setSourcers(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: statusTab })
      if (positionFilter) params.set('position_id', positionFilter)
      if (platformFilter) params.set('platform', platformFilter)

      const res = await fetch(`/api/sourcing-queue?${params}`)
      const data = await res.json()
      setCandidates(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [statusTab, positionFilter, platformFilter])

  useEffect(() => { fetchCandidates(); setCurrentPage(1) }, [fetchCandidates])

  const handleSavePotential = async (c: SourcingCandidate) => {
    setPotentialLoading(prev => ({ ...prev, [c.id]: true }))
    try {
      const res = await fetch('/api/sheets/save-potential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcing_id: c.id,
          position: c.position?.name ?? '',
          url: c.candidate_url,
          platform: c.platform,
          recent_company: c.recent_company ?? '',
          memo: potentialMemo[c.id] ?? '',
        }),
      })
      if (res.ok) {
        setPotentialSaved(prev => ({ ...prev, [c.id]: true }))
        setPotentialOpen(prev => ({ ...prev, [c.id]: false }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPotentialLoading(prev => ({ ...prev, [c.id]: false }))
    }
  }

  const handleRevert = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }))
    setFadingOut(prev => ({ ...prev, [id]: true }))
    try {
      await fetch('/api/sourcing-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'pending' }),
      })
    } catch (err) {
      console.error(err)
      setFadingOut(prev => ({ ...prev, [id]: false }))
      fetchCandidates()
    } finally {
      setTimeout(() => {
        setCandidates(prev => prev.filter(c => c.id !== id))
        setActionLoading(prev => ({ ...prev, [id]: false }))
        setFadingOut(prev => { const n = { ...prev }; delete n[id]; return n })
      }, 300)
    }
  }

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(prev => ({ ...prev, [id]: true }))
    // 페이드 아웃 시작
    setFadingOut(prev => ({ ...prev, [id]: true }))
    try {
      const message = editingMessage[id]
      const sourcer_id = selectedSourcer[id] || null
      await fetch('/api/sourcing-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, message_content: message, sourcer_id }),
      })
    } catch (err) {
      console.error(err)
      setFadingOut(prev => ({ ...prev, [id]: false }))
      fetchCandidates()
    } finally {
      // 애니메이션(300ms) 후 제거
      setTimeout(() => {
        setCandidates(prev => prev.filter(c => c.id !== id))
        setActionLoading(prev => ({ ...prev, [id]: false }))
        setFadingOut(prev => { const n = { ...prev }; delete n[id]; return n })
      }, 300)
    }
  }

  const filteredCandidates = highConfidenceOnly
    ? candidates.filter(c => c.confidence === 'high')
    : candidates

  const totalPages = Math.ceil(filteredCandidates.length / PAGE_SIZE)
  const displayedCandidates = filteredCandidates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const pendingCount = candidates.length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI 소싱 검토</h1>
        <p className="text-gray-500 text-sm mt-1">AI가 수집한 후보자를 검토하고 메시지 발송을 승인하세요</p>
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusTab === tab.value
                ? 'bg-violet-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.value === statusTab && !loading && (
              <span className="ml-2 bg-white bg-opacity-20 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex gap-3 mb-6">
        <select
          value={positionFilter}
          onChange={e => setPositionFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="">전체 포지션</option>
          {positions.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={platformFilter}
          onChange={e => setPlatformFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="">전체 플랫폼</option>
          <option value="wanted">원티드</option>
          <option value="remember">리멤버</option>
        </select>
        <button
          onClick={() => setHighConfidenceOnly(v => !v)}
          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
            highConfidenceOnly
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          신뢰도 높음만
        </button>
      </div>

      {/* 후보 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">불러오는 중...</div>
      ) : displayedCandidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-sm">검토할 후보자가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedCandidates.map(c => (
            <div key={c.id} className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm transition-opacity duration-300 ${fadingOut[c.id] ? 'opacity-0' : 'opacity-100'}`}>
              {/* 헤더 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.platform === 'wanted' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {c.platform === 'wanted' ? '원티드' : '리멤버'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {c.position?.name ?? '포지션 미지정'}
                  </span>
                  {c.recent_company && (
                    <span className="text-sm text-gray-500">· {c.recent_company}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {c.confidence && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONFIDENCE_BADGE[c.confidence] ?? 'bg-gray-100 text-gray-600'}`}>
                      신뢰도 {CONFIDENCE_LABEL[c.confidence] ?? c.confidence}
                    </span>
                  )}
                  <a
                    href={c.candidate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-600 hover:underline"
                  >
                    프로필 보기 →
                  </a>
                </div>
              </div>

              {/* AI 판단 근거 */}
              {c.ai_note && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1 font-medium">AI 판단 근거</p>
                  <p className="text-sm text-gray-700">{c.ai_note}</p>
                </div>
              )}

              {/* 시그널 */}
              {c.signals && c.signals.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {c.signals.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* 개인화 소재 */}
              {c.personalization_hooks && c.personalization_hooks.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">메시지 개인화 소재</p>
                  <ul className="space-y-1">
                    {c.personalization_hooks.map((hook, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-violet-400 mt-0.5">•</span>
                        {hook}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 메시지 편집 (pending일 때만) */}
              {statusTab === 'pending' && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">발송 메시지 (승인 전 수정 가능)</p>
                  <textarea
                    rows={4}
                    value={editingMessage[c.id] ?? c.message_content ?? ''}
                    onChange={e => setEditingMessage(prev => ({ ...prev, [c.id]: e.target.value }))}
                    placeholder="메시지를 입력하거나 수정하세요..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>
              )}

              {/* 승인됨 탭: 메시지 + 담당자 수정 가능 */}
              {statusTab === 'approved' && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">발송 메시지 (수정 가능)</p>
                  <textarea
                    rows={4}
                    value={editingMessage[c.id] ?? c.message_content ?? ''}
                    onChange={e => setEditingMessage(prev => ({ ...prev, [c.id]: e.target.value }))}
                    placeholder="메시지를 수정하세요..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={selectedSourcer[c.id] ?? c.sourcer_id ?? ''}
                      onChange={e => setSelectedSourcer(prev => ({ ...prev, [c.id]: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 bg-white"
                    >
                      <option value="">담당자 선택</option>
                      {sourcers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={async () => {
                        setActionLoading(prev => ({ ...prev, [c.id]: true }))
                        try {
                          const res = await fetch('/api/sourcing-queue', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: c.id,
                              status: 'approved',
                              message_content: editingMessage[c.id],
                              sourcer_id: selectedSourcer[c.id] ?? c.sourcer_id ?? null,
                            }),
                          })
                          if (res.ok) {
                            const updated = await res.json()
                            setCandidates(prev => prev.map(item => item.id === c.id ? { ...item, ...updated } : item))
                          }
                        } finally {
                          setActionLoading(prev => ({ ...prev, [c.id]: false }))
                        }
                      }}
                      disabled={actionLoading[c.id]}
                      className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
                    >
                      {actionLoading[c.id] ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => handleRevert(c.id)}
                      disabled={actionLoading[c.id]}
                      className="px-3 py-1.5 bg-white text-red-500 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-40 transition-colors"
                    >
                      검토 대기로 되돌리기
                    </button>
                  </div>
                </div>
              )}

              {/* 발송된 메시지 표시 (message_sent, rejected) */}
              {statusTab !== 'pending' && statusTab !== 'approved' && c.message_content && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1 font-medium">발송 메시지</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.message_content}</p>
                </div>
              )}

              {/* 액션 버튼 */}
              {statusTab === 'pending' && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSourcer[c.id] ?? ''}
                    onChange={e => setSelectedSourcer(prev => ({ ...prev, [c.id]: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-700 bg-white"
                  >
                    <option value="">담당자 선택</option>
                    {sourcers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAction(c.id, 'approved')}
                    disabled={actionLoading[c.id]}
                    className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading[c.id] ? '처리 중...' : '승인 · 발송 대기'}
                  </button>
                  <button
                    onClick={() => handleAction(c.id, 'rejected')}
                    disabled={actionLoading[c.id]}
                    className="px-4 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    거절
                  </button>
                </div>
              )}

              {/* 잠재 후보자 저장 */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                {potentialSaved[c.id] ? (
                  <span className="text-xs text-green-600 font-medium">✓ 잠재 후보자 시트에 저장됨</span>
                ) : potentialOpen[c.id] ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={potentialMemo[c.id] ?? ''}
                      onChange={e => setPotentialMemo(prev => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder="저장 메모 입력 (선택사항)"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSavePotential(c)}
                        disabled={potentialLoading[c.id]}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {potentialLoading[c.id] ? '저장 중...' : '시트에 저장'}
                      </button>
                      <button
                        onClick={() => setPotentialOpen(prev => ({ ...prev, [c.id]: false }))}
                        className="px-3 py-1.5 text-xs text-gray-500 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setPotentialOpen(prev => ({ ...prev, [c.id]: true }))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + 잠재 후보자로 저장
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                수집일: {new Date(c.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          <button
            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            이전
          </button>
          {(() => {
            const pages = []
            const delta = 2
            const left = Math.max(1, currentPage - delta)
            const right = Math.min(totalPages, currentPage + delta)
            if (left > 1) {
              pages.push(1)
              if (left > 2) pages.push('...')
            }
            for (let i = left; i <= right; i++) pages.push(i)
            if (right < totalPages) {
              if (right < totalPages - 1) pages.push('...')
              pages.push(totalPages)
            }
            return pages.map((p, idx) =>
              p === '...'
                ? <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
                : <button
                    key={p}
                    onClick={() => { setCurrentPage(p as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${currentPage === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
            )
          })()}
          <button
            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
