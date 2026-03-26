'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { Position, SourcingPlatform, Sourcer } from '@/lib/types'

export default function SettingsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [platforms, setPlatforms] = useState<SourcingPlatform[]>([])
  const [sourcers, setSourcers] = useState<Sourcer[]>([])
  const [newPosition, setNewPosition] = useState('')
  const [newPlatform, setNewPlatform] = useState('')
  const [newSourcer, setNewSourcer] = useState('')
  const [posLoading, setPosLoading] = useState(false)
  const [platLoading, setPlatLoading] = useState(false)
  const [srcLoading, setSrcLoading] = useState(false)
  const [posError, setPosError] = useState<string | null>(null)
  const [platError, setPlatError] = useState<string | null>(null)
  const [srcError, setSrcError] = useState<string | null>(null)
  const [deletePos, setDeletePos] = useState<string | null>(null)
  const [deletePlat, setDeletePlat] = useState<string | null>(null)
  const [deleteSrc, setDeleteSrc] = useState<string | null>(null)
  const [editingPosId, setEditingPosId] = useState<string | null>(null)
  const [editingPosName, setEditingPosName] = useState('')
  const [editPosError, setEditPosError] = useState<string | null>(null)
  const [editingSrcId, setEditingSrcId] = useState<string | null>(null)
  const [editingSrcName, setEditingSrcName] = useState('')
  const [editSrcError, setEditSrcError] = useState<string | null>(null)

  const loadPositions = useCallback(async () => {
    const res = await fetch('/api/positions')
    const data = await res.json()
    setPositions(Array.isArray(data) ? data : [])
  }, [])

  const loadPlatforms = useCallback(async () => {
    const res = await fetch('/api/sourcing-platforms')
    const data = await res.json()
    setPlatforms(Array.isArray(data) ? data : [])
  }, [])

  const loadSourcers = useCallback(async () => {
    const res = await fetch('/api/sourcers')
    const data = await res.json()
    setSourcers(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    loadPositions()
    loadPlatforms()
    loadSourcers()
  }, [loadPositions, loadPlatforms, loadSourcers])

  const addPosition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPosition.trim()) return
    setPosLoading(true)
    setPosError(null)
    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPosition.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        setPosError(err.error || '추가 실패')
        return
      }
      setNewPosition('')
      loadPositions()
    } catch {
      setPosError('추가 중 오류가 발생했습니다.')
    } finally {
      setPosLoading(false)
    }
  }

  const startEditPos = (p: { id: string; name: string }) => {
    setEditingPosId(p.id)
    setEditingPosName(p.name)
    setEditPosError(null)
  }

  const saveEditPos = async (id: string) => {
    if (!editingPosName.trim()) return
    setEditPosError(null)
    try {
      const res = await fetch(`/api/positions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingPosName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        setEditPosError(err.error || '수정 실패')
        return
      }
      setEditingPosId(null)
      loadPositions()
    } catch {
      setEditPosError('수정 중 오류가 발생했습니다.')
    }
  }

  const deletePosition = async (id: string) => {
    try {
      await fetch(`/api/positions/${id}`, { method: 'DELETE' })
      setDeletePos(null)
      loadPositions()
    } catch (err) {
      console.error(err)
    }
  }

  const addPlatform = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlatform.trim()) return
    setPlatLoading(true)
    setPlatError(null)
    try {
      const res = await fetch('/api/sourcing-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlatform.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        setPlatError(err.error || '추가 실패')
        return
      }
      setNewPlatform('')
      loadPlatforms()
    } catch {
      setPlatError('추가 중 오류가 발생했습니다.')
    } finally {
      setPlatLoading(false)
    }
  }

  const deletePlatform = async (id: string) => {
    try {
      await fetch(`/api/sourcing-platforms/${id}`, { method: 'DELETE' })
      setDeletePlat(null)
      loadPlatforms()
    } catch (err) {
      console.error(err)
    }
  }

  const addSourcer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSourcer.trim()) return
    setSrcLoading(true)
    setSrcError(null)
    try {
      const res = await fetch('/api/sourcers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSourcer.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        setSrcError(err.error || '추가 실패')
        return
      }
      setNewSourcer('')
      loadSourcers()
    } catch {
      setSrcError('추가 중 오류가 발생했습니다.')
    } finally {
      setSrcLoading(false)
    }
  }

  const startEditSrc = (s: { id: string; name: string }) => {
    setEditingSrcId(s.id)
    setEditingSrcName(s.name)
    setEditSrcError(null)
  }

  const saveEditSrc = async (id: string) => {
    if (!editingSrcName.trim()) return
    setEditSrcError(null)
    try {
      const res = await fetch(`/api/sourcers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingSrcName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        setEditSrcError(err.error || '수정 실패')
        return
      }
      setEditingSrcId(null)
      loadSourcers()
    } catch {
      setEditSrcError('수정 중 오류가 발생했습니다.')
    }
  }

  const deleteSourcer = async (id: string) => {
    try {
      await fetch(`/api/sourcers/${id}`, { method: 'DELETE' })
      setDeleteSrc(null)
      loadSourcers()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">설정</h1>
          <p className="text-gray-500 mt-1">포지션, 소싱 플랫폼, 담당자를 관리합니다</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Positions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">포지션 관리</h2>
            <p className="text-sm text-gray-500 mt-0.5">채용 포지션을 추가하거나 삭제합니다</p>
          </div>
          <div className="p-6">
            <form onSubmit={addPosition} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPosition}
                onChange={e => setNewPosition(e.target.value)}
                placeholder="새 포지션 이름"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={posLoading || !newPosition.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                추가
              </button>
            </form>
            {posError && <p className="text-xs text-red-500 mb-3">{posError}</p>}
            <ul className="space-y-2">
              {positions.length === 0 ? (
                <li className="text-sm text-gray-400 text-center py-4">포지션이 없습니다</li>
              ) : (
                positions.map(p => (
                  <li key={p.id} className="bg-gray-50 rounded-lg group">
                    {editingPosId === p.id ? (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <input
                          autoFocus
                          value={editingPosName}
                          onChange={e => setEditingPosName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditPos(p.id); if (e.key === 'Escape') setEditingPosId(null) }}
                          className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={() => saveEditPos(p.id)} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50">저장</button>
                        <button onClick={() => setEditingPosId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">취소</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-gray-800 font-medium truncate">{p.name}</span>
                          {p.skip_phone_interview && (
                            <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">전화생략</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={async () => {
                              await fetch(`/api/positions/${p.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: p.name, skip_phone_interview: !p.skip_phone_interview }),
                              })
                              loadPositions()
                            }}
                            title={p.skip_phone_interview ? '전화 인터뷰 포함' : '전화 인터뷰 생략'}
                            className={`text-xs px-2 py-1 rounded font-medium transition-colors ${p.skip_phone_interview ? 'text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                          >
                            {p.skip_phone_interview ? '전화✓' : '전화-'}
                          </button>
                          <button onClick={() => startEditPos(p)} className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeletePos(p.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    {editingPosId === p.id && editPosError && (
                      <p className="text-xs text-red-500 px-3 pb-2">{editPosError}</p>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Sourcing Platforms */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">소싱 플랫폼 관리</h2>
            <p className="text-sm text-gray-500 mt-0.5">소싱 채널을 추가하거나 삭제합니다</p>
          </div>
          <div className="p-6">
            <form onSubmit={addPlatform} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPlatform}
                onChange={e => setNewPlatform(e.target.value)}
                placeholder="새 플랫폼 이름"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={platLoading || !newPlatform.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                추가
              </button>
            </form>
            {platError && <p className="text-xs text-red-500 mb-3">{platError}</p>}
            <ul className="space-y-2">
              {platforms.length === 0 ? (
                <li className="text-sm text-gray-400 text-center py-4">플랫폼이 없습니다</li>
              ) : (
                platforms.map(p => (
                  <li key={p.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg group">
                    <span className="text-sm text-gray-800 font-medium">{p.name}</span>
                    <button
                      onClick={() => setDeletePlat(p.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Sourcers */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">아웃바운드 담당자 관리</h2>
            <p className="text-sm text-gray-500 mt-0.5">소싱 담당자를 추가하거나 삭제합니다</p>
          </div>
          <div className="p-6">
            <form onSubmit={addSourcer} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSourcer}
                onChange={e => setNewSourcer(e.target.value)}
                placeholder="새 담당자 이름"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={srcLoading || !newSourcer.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                추가
              </button>
            </form>
            {srcError && <p className="text-xs text-red-500 mb-3">{srcError}</p>}
            <ul className="space-y-2">
              {sourcers.length === 0 ? (
                <li className="text-sm text-gray-400 text-center py-4">담당자가 없습니다</li>
              ) : (
                sourcers.map(s => (
                  <li key={s.id} className="bg-gray-50 rounded-lg group">
                    {editingSrcId === s.id ? (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <input
                          autoFocus
                          value={editingSrcName}
                          onChange={e => setEditingSrcName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditSrc(s.id); if (e.key === 'Escape') setEditingSrcId(null) }}
                          className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={() => saveEditSrc(s.id)} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50">저장</button>
                        <button onClick={() => setEditingSrcId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">취소</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-gray-800 font-medium">{s.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditSrc(s)} className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteSrc(s.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    {editingSrcId === s.id && editSrcError && (
                      <p className="text-xs text-red-500 px-3 pb-2">{editSrcError}</p>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Position Confirm */}
      {deletePos && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">포지션 삭제</h3>
                <p className="text-sm text-gray-500">이 포지션을 삭제할까요?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeletePos(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={() => deletePosition(deletePos)} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">삭제하기</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Platform Confirm */}
      {deletePlat && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">플랫폼 삭제</h3>
                <p className="text-sm text-gray-500">이 플랫폼을 삭제할까요?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeletePlat(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={() => deletePlatform(deletePlat)} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">삭제하기</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sourcer Confirm */}
      {deleteSrc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">담당자 삭제</h3>
                <p className="text-sm text-gray-500">이 담당자를 삭제할까요?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteSrc(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={() => deleteSourcer(deleteSrc)} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
