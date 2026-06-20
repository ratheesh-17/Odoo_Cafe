import { useEffect, useState } from 'react'
import { ExternalLink, FileDown, RefreshCw } from 'lucide-react'
import { PageLoader, Toggle } from '../../components/ui'
import api from '../../lib/api'
import toast from 'react-hot-toast'

function Label({ children }) {
  return (
    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
      {children}
    </label>
  )
}

export default function SelfOrderConfigPage() {
  const [config, setConfig]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [downloading, setDownloading] = useState(false)

  const [form, setForm] = useState({
    is_enabled:       false,
    mode:             'online_ordering',
    background_color: '#111827',
    background_image: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/self-order/config')
      setConfig(data)
      setForm({
        is_enabled:       data.is_enabled,
        mode:             data.mode,
        background_color: data.background_color,
        background_image: data.background_image ?? '',
      })
    } catch {
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/self-order/config', {
        is_enabled:       form.is_enabled,
        mode:             form.mode,
        background_color: form.background_color,
        background_image: form.background_image.trim() || null,
      })
      setConfig(data)
      toast.success('Config saved!')
    } catch {
    } finally { setSaving(false) }
  }

  const handleQrPdf = async () => {
    const domain = window.location.origin
    setDownloading(true)
    try {
      const resp = await api.get(`/self-order/qr-pdf?domain=${encodeURIComponent(domain)}`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'table_qr_codes.pdf'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('QR PDF downloaded!')
    } catch {
    } finally { setDownloading(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Self Order</h1>
          <p className="text-sm text-muted mt-0.5">Customer-facing kiosk and QR menu settings</p>
        </div>
        <button
          onClick={handleQrPdf}
          disabled={downloading}
          className="btn-ghost text-sm flex items-center gap-1.5"
        >
          <FileDown size={14} />
          {downloading ? 'Downloading…' : 'Download All QR Codes'}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Enable / mode */}
        <div className="card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Enable Self Order</p>
              <p className="text-xs text-muted mt-0.5">Allow customers to browse and order via QR code</p>
            </div>
            <Toggle enabled={form.is_enabled} onChange={v => set('is_enabled', v)} />
          </div>

          <div>
            <Label>Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'online_ordering', label: '🛒 Online Ordering', desc: 'Full cart + submit order' },
                { value: 'qr_menu',         label: '📖 QR Menu',         desc: 'Browse only, no ordering' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('mode', opt.value)}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    form.mode === opt.value
                      ? 'border-primary-500 bg-primary-500/15'
                      : 'border-border hover:bg-white/5'
                  }`}
                >
                  <p className={`text-sm font-semibold ${form.mode === opt.value ? 'text-primary-400' : 'text-white'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-5 space-y-4">
          <p className="text-sm font-semibold text-white">Appearance</p>

          <div>
            <Label>Background Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.background_color}
                onChange={e => set('background_color', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-border"
              />
              <input
                className="input flex-1"
                value={form.background_color}
                onChange={e => set('background_color', e.target.value)}
                placeholder="#111827"
                maxLength={7}
              />
              <div className="w-10 h-10 rounded-lg border border-border flex-shrink-0" style={{ backgroundColor: form.background_color }} />
            </div>
          </div>

          <div>
            <Label>Background Image URL (optional)</Label>
            <input
              className="input"
              value={form.background_image}
              onChange={e => set('background_image', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {form.background_image && (
              <a href={form.background_image} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-primary-400 mt-1 hover:underline">
                <ExternalLink size={11} /> Preview image
              </a>
            )}
          </div>
        </div>

        {/* Preview URL info */}
        <div className="card p-4 bg-white/5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">How it works</p>
          <p className="text-xs text-white/60 leading-relaxed">
            Each table gets a unique QR code that opens{' '}
            <span className="text-primary-400 font-mono">{window.location.origin}/s/&#123;token&#125;</span>.
            Generate tokens per table from the{' '}
            <span className="text-white">Floors & Tables</span> page, then download the QR PDF above to print and place on tables.
          </p>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
