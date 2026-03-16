'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  Search,
  Plus,
  Loader2,
  RefreshCw,
  Package,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  stock: number
  costPrice: number
}

interface Restock {
  id: string
  product: Product
  variation: { name: string } | null
  quantity: number
  costPrice: number
  supplier: string | null
  notes: string | null
  user: { name: string }
  createdAt: string
}

export default function RestockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [restocks, setRestocks] = useState<Restock[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    costPrice: '',
    supplier: '',
    notes: '',
  })

  const fetchData = async () => {
    try {
      const [productsRes, restocksRes] = await Promise.all([
        fetch('/api/products?limit=100'),
        fetch('/api/restock?limit=50'),
      ])
      const [productsData, restocksData] = await Promise.all([
        productsRes.json(),
        restocksRes.json(),
      ])
      setProducts(productsData.products || [])
      setRestocks(restocksData.restocks || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowModal(false)
        setFormData({
          productId: '',
          quantity: '',
          costPrice: '',
          supplier: '',
          notes: '',
        })
        fetchData()
      }
    } catch (error) {
      console.error('Error creating restock:', error)
    }
  }

  const selectedProduct = products.find((p) => p.id === formData.productId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restok</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Restok Baru
        </button>
      </div>

      {/* Low Stock Alert */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Stok Menipis
        </h3>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {products
            .filter((p) => p.stock <= 5)
            .slice(0, 6)
            .map((product) => (
              <div key={product.id} className="bg-white rounded-lg p-2 text-center">
                <div className="text-sm font-medium truncate">{product.name}</div>
                <div className="text-xs text-yellow-600">Stok: {product.stock}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Restock History */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold">Riwayat Restok</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Produk</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Jumlah</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Harga Modal</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Supplier</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Petugas</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {restocks.map((restock) => (
              <tr key={restock.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{restock.product.name}</div>
                  {restock.variation && (
                    <div className="text-xs text-slate-500">{restock.variation.name}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-green-600 font-medium">+{restock.quantity}</span>
                </td>
                <td className="px-4 py-3">{formatCurrency(restock.costPrice)}</td>
                <td className="px-4 py-3 text-slate-500">{restock.supplier || '-'}</td>
                <td className="px-4 py-3">{restock.user.name}</td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {formatDateTime(restock.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {restocks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-12 h-12 mx-auto mb-2" />
            <p>Belum ada riwayat restok</p>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">Restok Produk</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pilih Produk</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        productId: product.id,
                        costPrice: product.costPrice.toString(),
                      })}
                      className={`w-full px-4 py-2 text-left hover:bg-slate-50 ${
                        formData.productId === product.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-slate-500">
                        Stok: {product.stock} | Modal: {formatCurrency(product.costPrice)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedProduct && (
                <div className="p-3 bg-slate-100 rounded-lg">
                  <div className="text-sm">Stok saat ini: {selectedProduct.stock}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Jumlah</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Harga Modal</label>
                <input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Supplier (Opsional)</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
