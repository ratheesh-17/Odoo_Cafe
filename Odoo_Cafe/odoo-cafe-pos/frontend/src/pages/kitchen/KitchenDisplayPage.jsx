import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, RefreshCw, ChefHat, Clock, CheckCircle2, Flame } from 'lucide-react'
import api from '../../lib/api'
import { clsx } from 'clsx'

const POLL_INTERVAL = 5000 // ms

// ── Stage config ──────────────────────────────────────────────────────────────
// Mirrors _NEXT_STAGE from services/kitchen/__init__.py

const STAGE_META = {
  to_cook:   { label: 'To Cook',   color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-400', icon: Flame,        next: 'preparing' },
  preparing: { label: 'Preparing', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',       dot: 'bg-blue-400',   icon: ChefHat,      next: 'completed' },
  completed: { label: 'Done',      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', icon: CheckCircle2, next: null },
}

const NEXT_LABEL = { to_cook: 'Start Cooking →', preparing: 'Mark Done →', completed: null }

// ── Time-since helper ─────────────────────────────────────────────────────────

function timeSince(iso) {
  if (!iso) return ''
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)  return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

// ── Ticket card ───────────────────────────────────────────────────────────────

function TicketCard({ ticket, onAdvance, onItemDone, advancing, itemDoing }) {
  const meta = STAGE_META[ticket.stage]
  const Icon = meta.icon
  const isCompleted = ticket.stage === 'completed'
  const doneCount = ticket.items.filter(i => i.is_done).length
  const totalItems = ticket.items.length

  return (
    <div
      className={clsx(
        'flex flex-col bg-card border rounded-2xl overflow-hidden transition-all',
        isCompleted ? 'border-emerald-500/20 opacity-70' : 'border-border hover:border-primary-500/40',
      )}
    >
      {/* Card header — click advances stage */}
      <button
        onClick={() => !isCompleted && onAdvance(ticket.id)}
        disabled={isCompleted || advancing === ticket.id}
        className={clsx(
          'flex items-start justify-between p-4 text-left transition-colors',
          !isCompleted && 'hover:bg-white/5 active:bg-white/10 cursor-pointer',
          isCompleted && 'cursor-default',
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{ticket.order.order_number}</span>
            {ticket.order.table_number && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-muted">
                T{ticket.order.table_number}
              </span>
            )}
            <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full border', meta.color)}>
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Clock size={10} /> {timeSince(ticket.sent_at)}
            </span>
            <span>{doneCount}/{totalItems} items done</span>
          </div>
        </div>

        {/* Progress ring */}
        <div className="flex-shrink-0 ml-3 flex flex-col items-center gap-1">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={isCompleted ? '#10b981' : '#6366f1'}
                strokeWidth="3"
                strokeDasharray={`${totalItems > 0 ? (doneCount / totalItems) * 94.25 : 0} 94.25`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon size={13} className={isCompleted ? 'text-emerald-400' : 'text-primary-400'} />
            </div>
          </div>
          {!isCompleted && (
            <span className="text-[9px] text-muted text-center leading-tight">
              {advancing === ticket.id ? '…' : NEXT_LABEL[ticket.stage]}
            </span>
          )}
        </div>
      </button>

      {/* Items list */}
      <div className="border-t border-border/50 divide-y divide-border/30">
        {ticket.items.map(item => (
          <button
            key={item.id}
            onClick={() => !item.is_done && onItemDone(ticket.id, item.id)}
            disabled={item.is_done || itemDoing === item.id}
            className={clsx(
              'w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors',
              item.is_done
                ? 'opacity-50 cursor-default'
                : 'hover:bg-white/5 cursor-pointer',
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', item.is_done ? 'bg-emerald-400' : meta.dot)} />
              <span className={clsx('text-sm', item.is_done ? 'line-through text-muted' : 'text-white')}>
                {item.product_name}
              </span>
              {item.note && (
                <span className="text-[10px] text-muted italic truncate max-w-[80px]">"{item.note}"</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className={clsx(
                'text-sm font-bold',
                item.is_done ? 'text-emerald-400' : 'text-white'
              )}>
                ×{item.quantity}
              </span>
              {itemDoing === item.id && (
                <div className="w-3 h-3 border border-primary-400/50 border-t-primary-400 rounded-full animate-spin" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Stage column ──────────────────────────────────────────────────────────────

function StageColumn({ stage, tickets, onAdvance, onItemDone, advancing, itemDoing }) {
  const meta = STAGE_META[stage]
  const Icon = meta.icon

  return (
    <div className="flex flex-col min-w-0">
      {/* Column header */}
      <div className={clsx('flex items-center gap-2 px-1 py-3 mb-3 border-b-2', {
        'border-yellow-500/40': stage === 'to_cook',
        'border-blue-500/40':   stage === 'preparing',
        'border-emerald-500/40':stage === 'completed',
      })}>
        <Icon size={16} className={clsx({
          'text-yellow-400':  stage === 'to_cook',
          'text-blue-400':    stage === 'preparing',
          'text-emerald-400': stage === 'completed',
        })} />
        <span className="font-semibold text-white text-sm">{meta.label}</span>
        <span className="ml-auto text-xs font-bold text-muted bg-white/10 px-2 py-0.5 rounded-full">
          {tickets.length}
        </span>
      </div>

      {/* Tickets */}
      <div className="space-y-3 overflow-y-auto flex-1">
        {tickets.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted text-sm">
            No tickets
          </div>
        ) : (
          tickets.map(t => (
            <TicketCard
              key={t.id}
              ticket={t}
              onAdvance={onAdvance}
              onItemDone={onItemDone}
              advancing={advancing}
              itemDoing={itemDoing}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Kitchen Display Page ──────────────────────────────────────────────────────

export default function KitchenDisplayPage() {
  const [tickets, setTickets]     = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [lastPoll, setLastPoll]   = useState(null)

  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState(null)
  const [stageFilter, setStageFilter] = useState(null) // null = show all columns

  const [advancing, setAdvancing] = useState(null)  // ticket id
  const [itemDoing, setItemDoing] = useState(null)  // ticket_item id

  const pollRef = useRef(null)

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams()
      if (catFilter) params.set('category_id', catFilter)
      const { data } = await api.get(`/kitchen/tickets?${params}`)
      setTickets(data)
      setLastPoll(new Date())
    } catch {
    } finally {
      if (!silent) setLoading(false)
    }
  }, [catFilter])

  // Initial load + filter-driven refetch
  useEffect(() => { fetchTickets() }, [fetchTickets])

  // Polling every 5 s
  useEffect(() => {
    pollRef.current = setInterval(() => fetchTickets(true), POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [fetchTickets])

  // Load filter options once
  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
    api.get('/products').then(r => setProducts(r.data)).catch(() => {})
  }, [])

  const handleAdvance = async (ticketId) => {
    setAdvancing(ticketId)
    try {
      const { data } = await api.post(`/kitchen/tickets/${ticketId}/advance`)
      setTickets(prev => prev.map(t => t.id === ticketId ? data : t))
    } catch {
    } finally { setAdvancing(null) }
  }

  const handleItemDone = async (ticketId, itemId) => {
    setItemDoing(itemId)
    try {
      const { data } = await api.post(`/kitchen/tickets/${ticketId}/items/${itemId}/done`)
      setTickets(prev => prev.map(t => t.id === ticketId ? data : t))
    } catch {
    } finally { setItemDoing(null) }
  }

  // Client-side search filter (by order number or product name)
  const filteredTickets = tickets.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.order.order_number.toLowerCase().includes(q) ||
      t.items.some(i => i.product_name.toLowerCase().includes(q))
    )
  })

  const byStage = (stage) => filteredTickets.filter(t => t.stage === stage)

  const STAGES = ['to_cook', 'preparing', 'completed']
  const visibleStages = stageFilter ? [stageFilter] : STAGES

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 h-14 bg-panel border-b border-border flex items-center px-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
            <ChefHat size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">Kitchen Display</span>
        </div>

        {/* Search */}
        <div className="relative w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-8 py-1.5 text-sm w-full"
            placeholder="Order # or product…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setCatFilter(null)}
            className={clsx('flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors', {
              'bg-primary-500/15 text-primary-400': !catFilter,
              'text-muted hover:text-white hover:bg-white/5': catFilter,
            })}
          >
            All Items
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}
              className={clsx('flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors', {
                'bg-primary-500/15 text-primary-400': catFilter === c.id,
                'text-muted hover:text-white hover:bg-white/5': catFilter !== c.id,
              })}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </button>
          ))}
        </div>

        {/* Stage filter */}
        <div className="ml-auto flex items-center gap-1.5">
          {STAGES.map(s => (
            <button
              key={s}
              onClick={() => setStageFilter(stageFilter === s ? null : s)}
              className={clsx('px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors border', {
                [STAGE_META[s].color]: stageFilter === s,
                'border-transparent text-muted hover:text-white hover:bg-white/5': stageFilter !== s,
              })}
            >
              {STAGE_META[s].label}
            </button>
          ))}
          <button
            onClick={() => fetchTickets()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors ml-1"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Poll indicator */}
      {lastPoll && (
        <div className="flex-shrink-0 bg-black/20 px-4 py-1 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-muted">
            Live · Updated {timeSince(lastPoll)} · auto-refreshes every {POLL_INTERVAL / 1000}s
          </span>
          <span className="text-[10px] text-muted ml-2">
            {filteredTickets.filter(t => t.stage !== 'completed').length} active ticket{filteredTickets.filter(t => t.stage !== 'completed').length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted">
            <div className="w-8 h-8 border-2 border-primary-500/40 border-t-primary-400 rounded-full animate-spin" />
            <span className="text-sm">Loading tickets…</span>
          </div>
        </div>
      ) : (
        <div className={clsx(
          'flex-1 overflow-hidden p-4 gap-4',
          visibleStages.length === 1 ? 'flex flex-col max-w-xl mx-auto w-full' : 'grid',
        )}
          style={visibleStages.length > 1 ? { gridTemplateColumns: `repeat(${visibleStages.length}, 1fr)` } : {}}
        >
          {visibleStages.map(stage => (
            <StageColumn
              key={stage}
              stage={stage}
              tickets={byStage(stage)}
              onAdvance={handleAdvance}
              onItemDone={handleItemDone}
              advancing={advancing}
              itemDoing={itemDoing}
            />
          ))}
        </div>
      )}
    </div>
  )
}
