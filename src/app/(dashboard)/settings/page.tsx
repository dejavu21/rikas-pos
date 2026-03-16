'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'

interface Settings {
  store_profile: {
    name: string
    address: string
    phone: string
    email: string
  }
  app_settings: {
    language: string
    currency: string
    taxEnabled: boolean
    receiptFooter: string
  }
  payment_methods: { id: string; name: string; isDefault: boolean }[]
  additional_fees: { id: string; name: string; type: string; value: number }[]
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeForm, setStoreForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  })
  const [appForm, setAppForm] = useState({
    language: 'id',
    currency: 'IDR',
    taxEnabled: true,
    receiptFooter: 'Terima Kasih',
  })
  const [newPaymentMethod, setNewPaymentMethod] = useState('')
  const [newFee, setNewFee] = useState({ name: '', type: 'percentage', value: 0 })

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings(data)
      if (data.store_profile) setStoreForm(data.store_profile)
      if (data.app_settings) setAppForm(data.app_settings)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const saveSetting = async (key: string, value: any) => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
    } catch (error) {
      console.error('Error saving setting:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStoreProfile = () => {
    saveSetting('store_profile', storeForm)
  }

  const handleSaveAppSettings = () => {
    saveSetting('app_settings', appForm)
  }

  const addPaymentMethod = () => {
    if (!newPaymentMethod || !settings) return
    const methods = [...(settings.payment_methods || []), {
      id: newPaymentMethod.toLowerCase().replace(/\s/g, '_'),
      name: newPaymentMethod,
      isDefault: false,
    }]
    saveSetting('payment_methods', methods)
    setNewPaymentMethod('')
  }

  const removePaymentMethod = (id: string) => {
    if (!settings) return
    const methods = (settings.payment_methods || []).filter((m) => m.id !== id)
    saveSetting('payment_methods', methods)
  }

  const addFee = () => {
    if (!newFee.name || !settings) return
    const fees = [...(settings.additional_fees || []), {
      id: newFee.name.toLowerCase().replace(/\s/g, '_'),
      name: newFee.name,
      type: newFee.type,
      value: newFee.value,
    }]
    saveSetting('additional_fees', fees)
    setNewFee({ name: '', type: 'percentage', value: 0 })
  }

  const removeFee = (id: string) => {
    if (!settings) return
    const fees = (settings.additional_fees || []).filter((f) => f.id !== id)
    saveSetting('additional_fees', fees)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      {/* Store Profile */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Profil Toko</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Toko</label>
            <input
              type="text"
              value={storeForm.name}
              onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alamat</label>
            <textarea
              value={storeForm.address}
              onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">No. Telepon</label>
              <input
                type="tel"
                value={storeForm.phone}
                onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={storeForm.email}
                onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <button
            onClick={handleSaveStoreProfile}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Simpan
          </button>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Pengaturan Aplikasi</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bahasa</label>
              <select
                value={appForm.language}
                onChange={(e) => setAppForm({ ...appForm, language: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mata Uang</label>
              <select
                value={appForm.currency}
                onChange={(e) => setAppForm({ ...appForm, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="IDR">IDR (Rupiah)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Footer Struk</label>
            <input
              type="text"
              value={appForm.receiptFooter}
              onChange={(e) => setAppForm({ ...appForm, receiptFooter: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <button
            onClick={handleSaveAppSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Simpan
          </button>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Metode Pembayaran</h2>
        <div className="space-y-2 mb-4">
          {(settings?.payment_methods || []).map((method) => (
            <div key={method.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span>{method.name}</span>
              <button
                onClick={() => removePaymentMethod(method.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPaymentMethod}
            onChange={(e) => setNewPaymentMethod(e.target.value)}
            placeholder="Metode pembayaran baru"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
          />
          <button
            onClick={addPaymentMethod}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* Additional Fees */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Biaya Tambahan</h2>
        <div className="space-y-2 mb-4">
          {(settings?.additional_fees || []).map((fee) => (
            <div key={fee.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="font-medium">{fee.name}</span>
                <span className="text-sm text-slate-500 ml-2">
                  {fee.type === 'percentage' ? `${fee.value}%` : `Rp ${fee.value}`}
                </span>
              </div>
              <button
                onClick={() => removeFee(fee.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFee.name}
            onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
            placeholder="Nama biaya"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
          />
          <select
            value={newFee.type}
            onChange={(e) => setNewFee({ ...newFee, type: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          >
            <option value="percentage">Persen (%)</option>
            <option value="fixed">Tetap (Rp)</option>
          </select>
          <input
            type="number"
            value={newFee.value || ''}
            onChange={(e) => setNewFee({ ...newFee, value: parseFloat(e.target.value) || 0 })}
            placeholder="Nilai"
            className="w-24 px-3 py-2 border border-slate-300 rounded-lg"
          />
          <button
            onClick={addFee}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tambah
          </button>
        </div>
      </div>
    </div>
  )
}
