'use client'

import { useEffect, useState, useRef } from 'react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  Search,
  Loader2,
  Receipt,
  Printer,
  X,
  RotateCcw,
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  customer: { name: string } | null
  user: { name: string }
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  status: string
  isPreOrder: boolean
  createdAt: string
  items: {
    id: string
    product: { name: string }
    variation: { name: string } | null
    quantity: number
    price: number
  }[]
}

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?search=${search}&status=${status}&limit=50`)
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [search, status])

  const handleVoid = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return
    
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'void' }),
      })

      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error voiding order:', error)
    }
  }

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    VOID: 'bg-red-100 text-red-700',
    PREORDER: 'bg-blue-100 text-blue-700',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="">Semua Status</option>
          <option value="COMPLETED">Selesai</option>
          <option value="PENDING">Pending</option>
          <option value="VOID">Dibatalkan</option>
          <option value="PREORDER">Pre-Order</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">No. Pesanan</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Pelanggan</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Kasir</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Waktu</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                <td className="px-4 py-3">{order.customer?.name || '-'}</td>
                <td className="px-4 py-3">{order.user.name}</td>
                <td className="px-4 py-3 font-bold">{formatCurrency(order.total)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {order.status === 'COMPLETED' ? 'Selesai' : 
                     order.status === 'VOID' ? 'Dibatalkan' :
                     order.status === 'PREORDER' ? 'Pre-Order' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {formatDateTime(order.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1 text-slate-400 hover:text-blue-600"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                    {order.status !== 'VOID' && (
                      <button
                        onClick={() => handleVoid(order.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Receipt className="w-12 h-12 mx-auto mb-2" />
            <p>Belum ada transaksi</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Detail Pesanan</h3>
              <button onClick={() => setSelectedOrder(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6" ref={receiptRef}>
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <h2 className="font-bold text-xl">KasirPOS</h2>
                <p className="text-sm text-slate-500">No. Pesanan: {selectedOrder.orderNumber}</p>
                <p className="text-sm text-slate-500">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>

              <div className="space-y-2 mb-4">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span>{item.product.name}</span>
                      {item.variation && (
                        <span className="text-slate-500"> ({item.variation.name})</span>
                      )}
                      <span className="text-slate-500"> x{item.quantity}</span>
                    </div>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode Pembayaran</span>
                  <span className="capitalize">{selectedOrder.paymentMethod}</span>
                </div>
              </div>

              <div className="text-center mt-6 pt-4 border-t border-slate-200 text-sm text-slate-500">
                Terima Kasih
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Printer className="w-5 h-5" />
                Cetak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
