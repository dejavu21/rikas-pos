'use client'

import { useState, useRef } from 'react'
import { Loader2, Download, Upload, FileSpreadsheet, Trash2, AlertTriangle } from 'lucide-react'

export default function DataPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportTransactions = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/reports/sales')
      const data = await res.json()

      // Convert to CSV
      const headers = ['No. Pesanan', 'Pelanggan', 'Kasir', 'Subtotal', 'Diskon', 'Total', 'Metode', 'Status', 'Tanggal']
      const rows = (data.orders || []).map((order: any) => [
        order.orderNumber,
        order.customer?.name || '-',
        order.user.name,
        order.subtotal,
        order.discount,
        order.total,
        order.paymentMethod,
        order.status,
        new Date(order.createdAt).toLocaleString('id-ID'),
      ])

      const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transaksi_${new Date().toISOString().split('T')[0]}.csv`
      a.click()

      setMessage({ type: 'success', text: 'Transaksi berhasil diekspor' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengekspor transaksi' })
    } finally {
      setLoading(false)
    }
  }

  const handleExportCustomers = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/customers?limit=1000')
      const data = await res.json()

      const headers = ['Nama', 'Email', 'Telepon', 'Alamat', 'Poin']
      const rows = (data.customers || []).map((customer: any) => [
        customer.name,
        customer.email || '',
        customer.phone || '',
        customer.address || '',
        customer.points,
      ])

      const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pelanggan_${new Date().toISOString().split('T')[0]}.csv`
      a.click()

      setMessage({ type: 'success', text: 'Pelanggan berhasil diekspor' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengekspor pelanggan' })
    } finally {
      setLoading(false)
    }
  }

  const handleExportProducts = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/products?limit=1000')
      const data = await res.json()

      const headers = ['Nama', 'Barcode', 'Kategori', 'Harga Jual', 'Harga Modal', 'Stok', 'Min. Stok', 'Unit']
      const rows = (data.products || []).map((product: any) => [
        product.name,
        product.barcode || '',
        product.category?.name || '',
        product.price,
        product.costPrice,
        product.stock,
        product.minStock,
        product.unit,
      ])

      const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `produk_${new Date().toISOString().split('T')[0]}.csv`
      a.click()

      setMessage({ type: 'success', text: 'Produk berhasil diekspor' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengekspor produk' })
    } finally {
      setLoading(false)
    }
  }

  const handleImportProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage(null)

    try {
      const text = await file.text()
      const rows = text.split('\n').slice(1) // Skip header
      
      let imported = 0
      for (const row of rows) {
        const cols = row.split(',')
        if (cols.length < 4) continue

        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cols[0],
            barcode: cols[1] || null,
            price: parseFloat(cols[2]) || 0,
            costPrice: parseFloat(cols[3]) || 0,
            stock: parseInt(cols[4]) || 0,
          }),
        })
        imported++
      }

      setMessage({ type: 'success', text: `${imported} produk berhasil diimpor` })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengimpor produk' })
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleBackup = async () => {
    setLoading(true)
    setMessage(null)
    try {
      // Get all data
      const [productsRes, categoriesRes, customersRes, ordersRes, expensesRes] = await Promise.all([
        fetch('/api/products?limit=1000'),
        fetch('/api/categories'),
        fetch('/api/customers?limit=1000'),
        fetch('/api/orders?limit=1000'),
        fetch('/api/expenses?limit=1000'),
      ])

      const [products, categories, customers, orders, expenses] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
        customersRes.json(),
        ordersRes.json(),
        expensesRes.json(),
      ])

      const backup = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        data: { products, categories, customers, orders, expenses },
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_kasirpos_${new Date().toISOString().split('T')[0]}.json`
      a.click()

      setMessage({ type: 'success', text: 'Backup berhasil diunduh' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal membuat backup' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Kelola Data</h1>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Backup & Restore */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Backup & Restore</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <h3 className="font-medium">Backup Data</h3>
              <p className="text-sm text-slate-500">Unduh semua data dalam format JSON</p>
            </div>
            <button
              onClick={handleBackup}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Backup
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <h3 className="font-medium">Restore Data</h3>
              <p className="text-sm text-slate-500">Pulihkan data dari file backup</p>
            </div>
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              Restore
            </button>
          </div>
        </div>
      </div>

      {/* Import */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Impor Data</h2>
        <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg">
          <div className="text-center">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-500 mb-4">
              Impor produk dari file CSV
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportProducts}
              className="hidden"
              id="import-products"
            />
            <label
              htmlFor="import-products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Pilih File
            </label>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Ekspor Data</h2>
        <div className="space-y-2">
          <button
            onClick={handleExportTransactions}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <div>
              <h3 className="font-medium">Ekspor Transaksi</h3>
              <p className="text-sm text-slate-500">Unduh laporan transaksi dalam format CSV</p>
            </div>
            <Download className="w-5 h-5 text-slate-400" />
          </button>

          <button
            onClick={handleExportCustomers}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <div>
              <h3 className="font-medium">Ekspor Pelanggan</h3>
              <p className="text-sm text-slate-500">Unduh data pelanggan dalam format CSV</p>
            </div>
            <Download className="w-5 h-5 text-slate-400" />
          </button>

          <button
            onClick={handleExportProducts}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <div>
              <h3 className="font-medium">Ekspor Produk</h3>
              <p className="text-sm text-slate-500">Unduh data produk dalam format CSV</p>
            </div>
            <Download className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Delete All Data */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
        <h2 className="font-semibold text-lg mb-4 text-red-600">Hapus Semua Data</h2>
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
          <div>
            <h3 className="font-medium text-red-700">Hapus Semua Data</h3>
            <p className="text-sm text-red-600">PERINGATAN: Tindakan ini tidak dapat dibatalkan!</p>
          </div>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 opacity-50 cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}
