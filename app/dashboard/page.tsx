'use client'

import { useEffect, useState, useCallback } from 'react'
import { STAGES, OUTCOMES, STAGE_ORDER } from '@/lib/types'
import type { Candidate, Position, Sourcer, FunnelStats, Stage } from '@/lib/types'

interface ActiveFunnelItem {
  stage: string
  label: string
  count: number
  rejected: number
}

export default function DashboardPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [sourcers, setSourcers] = useState<Sourcer[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [funnelCumulative, setFunnelCumulative] = useState<FunnelStats[]>([])
  const [funnelActive, setFunnelActive] = useState<ActiveFunnelItem[]>([])
  const [total, setTotal] = useState(0)
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedStage, setSelectedStage] = useState('')
  const [selectedSourcer, setSelectedSourcer] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [listStageFilter, setListStageFilter] = useState('')
  const [showCount, setShowCount] = useState(10)
  const [loading, setLoading] = useState(true)

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

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedPosition) params.set('position_id', selectedPosition)
      if (selectedStage) params.set('stage', selectedStage)
      if (selectedSourcer) params.set('sourcer_id', selectedSourcer)
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const [dashRes, candRes] = await Promise.all([
        fetch(`/api/dashboard?${params}`),
        fetch(`/api/candidates?${params}`),
      ])
      const dashData = await dashRes.json()
      const candData = await candRes.json()

      setFunnelCumulative(dashData.funnelCumulative || dashData.funnel || [])
      setFunnelActive(dashData.funnelActive || [])
      setTotal(dashData.total || 0)
      setCandidates(Array.isArray(candData) ? candData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedPosition, selectedStage, selectedSourcer, startDate, endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStageLabel = (value: string) =>
    STAGES.find(s => s.value === value)?.label ?? value

  const getOutcomeLabel = (value: string) =>
    OUTCOMES.find(o => o.value === value)?.label ?? value

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'withdrawn': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const cumulativeColors = [
    'from-blue-700 to-blue-600',
    'from-blue-600 to-blue-500',
    'from-blue-500 to-blue-400',
    'from-blue-400 to-blue-300',
    'from-blue-300 to-blue-200',
    'from-blue-200 to-blue-100',
    'from-blue-100 to-blue-50',
  ]
  const cumulativeTextColors = [
    'text-white', 'text-white', 'text-white', 'text-white',
    'text-blue-900', 'text-blue-800', 'text-blue-700',
  ]

  const activeColors = [
    'from-emerald-600 to-emerald-500',
    'from-emerald-500 to-emerald-400',
    'from-emerald-400 to-emerald-300',
    'from-emerald-300 to-emerald-200',
    'from-emerald-200 to-emerald-100',
    'from-emerald-100 to-emerald-50',
  ]
  const activeTextColors = [
    'text-white', 'text-white', 'text-white',
    'text-emerald-900', 'text-emerald-800', 'text-emerald-700',
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">아웃바운드 채용 대시보드</h1>
        <p className="mt-1 text-gray-500">채용 파이프라인 현황을 한눈에 확인하세요</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">포지션</label>
          <select
            value={selectedPosition}
            onChange={e => setSelectedPosition(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            {positions.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">단계</label>
          <select
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            {STAGES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">담당자</label>
          <select
            value={selectedSourcer}
            onChange={e => setSelectedSourcer(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            {sourcers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">기간</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-gray-400 text-sm">~</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {(selectedPosition || selectedStage || selectedSourcer || startDate || endDate) && (
          <button
            onClick={() => { setSelectedPosition(''); setSelectedStage(''); setSelectedSourcer(''); setStartDate(''); setEndDate('') }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            필터 초기화
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* 채용 퍼널 (누계) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-gray-900">채용 퍼널 (누계)</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">각 단계에 도달한 전체 인원</span>
            </div>
            <p className="text-xs text-gray-400 mb-5">탈락/합류 포함, 해당 단계 이상에 도달한 누적 인원 기준</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
              {funnelCumulative.map((item, idx) => (
                <div
                  key={item.stage}
                  className={`bg-gradient-to-b ${cumulativeColors[idx]} rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm`}
                >
                  <p className={`text-xs font-medium mb-1 ${cumulativeTextColors[idx]} opacity-80`}>{item.label}</p>
                  <p className={`text-3xl font-bold ${cumulativeTextColors[idx]}`}>{item.count}</p>
                  <p className={`text-xs mt-1 ${cumulativeTextColors[idx]} opacity-70`}>{item.percent.toFixed(1)}%</p>
                </div>
              ))}
            </div>

            {/* 단계별 전환 분석 - 누계 기준 */}
            {funnelCumulative.length > 1 && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-3">단계별 전환 분석 (누계 기준)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-4 text-xs font-medium text-gray-400 whitespace-nowrap">이전 단계</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium text-gray-400 whitespace-nowrap">다음 단계</th>
                        <th className="text-right py-2 pr-4 text-xs font-medium text-gray-400 whitespace-nowrap">이전 인원</th>
                        <th className="text-right py-2 pr-4 text-xs font-medium text-gray-400 whitespace-nowrap">다음 인원</th>
                        <th className="text-right py-2 text-xs font-medium text-gray-400 whitespace-nowrap">전환율</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {funnelCumulative.slice(1).map((item, idx) => {
                        const prev = funnelCumulative[idx]
                        const rate = prev.count > 0 ? (item.count / prev.count) * 100 : 0
                        const rateColor = rate >= 50 ? 'text-green-600' : rate >= 25 ? 'text-amber-600' : 'text-red-500'
                        return (
                          <tr key={item.stage} className="hover:bg-gray-50">
                            <td className="py-2.5 pr-4 text-gray-500 whitespace-nowrap">{prev.label}</td>
                            <td className="py-2.5 pr-4 text-gray-700 font-medium whitespace-nowrap">
                              <span className="flex items-center gap-1"><span className="text-gray-300">→</span>{item.label}</span>
                            </td>
                            <td className="py-2.5 pr-4 text-right text-gray-500">{prev.count}명</td>
                            <td className="py-2.5 pr-4 text-right text-gray-700 font-medium">{item.count}명</td>
                            <td className="py-2.5 text-right">
                              <span className={`font-bold ${rateColor}`}>{rate.toFixed(1)}%</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 채용 퍼널 (진행형) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-gray-900">채용 퍼널 (진행형)</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">현재 진행 중인 인원만</span>
            </div>
            <p className="text-xs text-gray-400 mb-5">outcome이 '진행 중'인 사람만 집계. 숫자 아래 회색은 해당 단계에서 탈락/포기한 인원</p>

            {funnelActive.every(f => f.count === 0) ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <p className="text-sm">현재 진행 중인 후보자가 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {funnelActive.map((item, idx) => (
                  <div
                    key={item.stage}
                    className={`bg-gradient-to-b ${activeColors[idx]} rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm`}
                  >
                    <p className={`text-xs font-medium mb-1 ${activeTextColors[idx]} opacity-80`}>{item.label}</p>
                    <p className={`text-3xl font-bold ${activeTextColors[idx]}`}>{item.count}</p>
                    {item.rejected > 0 && (
                      <p className={`text-xs mt-1 ${activeTextColors[idx]} opacity-60`}>탈락 {item.rejected}명</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sourcer Breakdown */}
          {sourcers.length > 0 && !selectedSourcer && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">담당자별 현황</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 pr-4 text-xs font-medium text-gray-400">담당자</th>
                      <th className="text-right py-2 pr-4 text-xs font-medium text-gray-400">제안</th>
                      <th className="text-right py-2 pr-4 text-xs font-medium text-gray-400">지원</th>
                      <th className="text-right py-2 pr-4 text-xs font-medium text-gray-400">전화</th>
                      <th className="text-right py-2 pr-4 text-xs font-medium text-gray-400">직무</th>
                      <th className="text-right py-2 pr-4 text-xs font-medium text-gray-400">컬처</th>
                      <th className="text-right py-2 pr-4 text-xs font-medium text-gray-400">최합</th>
                      <th className="text-right py-2 text-xs font-medium text-gray-400">합류</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sourcers.map(sourcer => {
                      const srcCands = candidates.filter(c => c.sourcer_id === sourcer.id)
                      if (srcCands.length === 0) return null
                      const counts = STAGE_ORDER.map((stage, i) =>
                        srcCands.filter(c => (STAGE_ORDER.slice(i) as Stage[]).includes(c.stage as Stage)).length
                      )
                      return (
                        <tr key={sourcer.id} className="hover:bg-gray-50">
                          <td className="py-2.5 pr-4 font-medium text-gray-800">{sourcer.name}</td>
                          {counts.map((count, i) => (
                            <td key={i} className="py-2.5 pr-4 text-right text-gray-600">{count}</td>
                          ))}
                        </tr>
                      )
                    })}
                    {candidates.filter(c => !c.sourcer_id).length > 0 && (
                      <tr className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4 text-gray-400">미지정</td>
                        {STAGE_ORDER.map((stage, i) => {
                          const unassigned = candidates.filter(c => !c.sourcer_id)
                          const count = unassigned.filter(c => (STAGE_ORDER.slice(i) as Stage[]).includes(c.stage as Stage)).length
                          return <td key={i} className="py-2.5 pr-4 text-right text-gray-400">{count}</td>
                        })}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Candidate List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">후보자 목록</h2>
                <span className="text-sm text-gray-500">총 {candidates.length}명</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 whitespace-nowrap">단계 필터</label>
                <select
                  value={listStageFilter}
                  onChange={e => { setListStageFilter(e.target.value); setShowCount(10) }}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  {STAGES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {(() => {
              const filtered = listStageFilter
                ? candidates.filter(c => c.stage === listStageFilter)
                : candidates
              const visible = filtered.slice(0, showCount)
              const hasMore = filtered.length > showCount

              return filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <p className="text-sm">해당하는 후보자가 없습니다</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">포지션</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">담당자</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">소싱 플랫폼</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">단계</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">결과</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">URL</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">메모</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">제안일</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {visible.map(c => (
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {c.position?.name ?? <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {c.sourcer?.name ?? <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {c.sourcing_platform?.name ?? <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                {getStageLabel(c.stage)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOutcomeBadge(c.outcome)}`}>
                                {getOutcomeLabel(c.outcome)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm max-w-xs truncate">
                              {c.url ? (
                                c.url.startsWith('http://') || c.url.startsWith('https://') ? (
                                  <a href={c.url} target="_blank" rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-xs">
                                    {c.url}
                                  </a>
                                ) : (
                                  <span className="text-gray-700">{c.url}</span>
                                )
                              ) : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {c.memo || <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {c.proposal_date ? new Date(c.proposal_date).toLocaleDateString('ko-KR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {hasMore && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm text-gray-400">{visible.length}명 표시 중 / 전체 {filtered.length}명</span>
                      <button
                        onClick={() => setShowCount(c => c + 10)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        10명 더보기
                      </button>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}
