'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import {
  BarChart3,
  Loader2,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Wallet,
  CreditCard,
} from 'lucide-react'

type ReportType = 'sales' | 'profit' | 'products' | 'cashier' | 'expenses' | 'stock' | 'payment'

const reportTypes = [
  { id: 'sales', name: 'Penjualan', icon: TrendingUp },
  { id: 'profit', name: 'Keuntungan', icon: DollarSign },
  { id: 'products', name: 'Produk Terjual', icon: Package },
  { id: 'cashier', name: 'Kasir', icon: Users },
  { id: 'expenses', name: 'Pengeluaran', icon: Wallet },
  { id: 'stock', name: 'Stok', icon: Package },
  { id: 'payment', name: 'Pembayaran', icon: CreditCard },
]

export default function ReportsPage() {
  const searchParams = useSearchParams()
  const [activeReport, setActiveReport] = useState<ReportType>('sales')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')

  useEffect(() => {
    const type = searchParams.get('type') as ReportType
    if (type && reportTypes.find((r) => r.id === type)) {
      setActiveReport(type)
    }
  }, [searchParams])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/reports/${activeReport}?${params}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [activeReport, startDate, endDate])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Laporan</h1>

      {/* Report Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {reportTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveReport(type.id as ReportType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
              activeReport === type.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <type.icon className="w-4 h-4" />
            {type.name}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sales Report */}
          {activeReport === 'sales' && data && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-sm text-slate-500">Total Transaksi</div>
                  <div className="text-2xl font-bold">{data.summary?.totalTransactions || 0}</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-sm text-slate-500">Total Penjualan</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(data.summary?.totalSales || 0)}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-sm text-slate-500">Total Item</div>
                  <div className="text-2xl font-bold">{data.summary?.totalItems || 0}</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">No. Pesanan</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Pelanggan</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Kasir</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.orders?.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">{order.orderNumber}</td>
                        <td className="px-4 py-3">{order.customer?.name || '-'}</td>
                        <td className="px-4 py-3">{order.user.name}</td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Profit Report */}
          {activeReport === 'profit' && data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-slate-500">Total Pendapatan</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary?.totalRevenue || 0)}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-slate-500">Total Modal</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.summary?.totalCost || 0)}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-slate-500">Keuntungan Kotor</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.summary?.grossProfit || 0)}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-slate-500">Margin Keuntungan</div>
                <div className="text-2xl font-bold">
                  {(data.summary?.profitMargin || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Products Report */}
          {activeReport === 'products' && data && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Produk</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Total Terjual</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Total Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.products?.map((item: any) => (
                    <tr key={item.product.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{item.product.name}</td>
                      <td className="px-4 py-3">{item.totalQty}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(item.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Cashier Report */}
          {activeReport === 'cashier' && data && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Kasir</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Total Transaksi</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Total Penjualan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.cashiers?.map((item: any) => (
                    <tr key={item.user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{item.user.name}</td>
                      <td className="px-4 py-3">{item.totalTransactions}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(item.totalSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Expenses Report */}
          {activeReport === 'expenses' && data && (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-slate-500">Total Pengeluaran</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.summary?.totalExpenses || 0)}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Deskripsi</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Kategori</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Jumlah</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.expenses?.map((expense: any) => (
                      <tr key={expense.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">{expense.description}</td>
                        <td className="px-4 py-3">{expense.category}</td>
                        <td className="px-4 py-3 font-medium text-red-600">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {formatDate(expense.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Stock Report */}
          {activeReport === 'stock' && data && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-sm text-slate-500">Total Produk</div>
                  <div className="text-2xl font-bold">{data.summary?.totalProducts || 0}</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-sm text-slate-500">Stok Menipis</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.summary?.lowStockCount || 0}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-sm text-slate-500">Stok Habis</div>
                  <div className="text-2xl font-bold text-red-600">
                    {data.summary?.outOfStockCount || 0}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Produk</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Kategori</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Stok</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Min. Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.products?.map((product: any) => (
                      <tr 
                        key={product.id} 
                        className={`hover:bg-slate-50 ${
                          product.stock === 0 ? 'bg-red-50' : 
                          product.stock <= product.minStock ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">{product.name}</td>
                        <td className="px-4 py-3">{product.category?.name || '-'}</td>
                        <td className="px-4 py-3 font-medium">{product.stock}</td>
                        <td className="px-4 py-3 text-slate-500">{product.minStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Payment Method Report */}
          {activeReport === 'payment' && data && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Metode Pembayaran</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.payments?.map((item: any) => (
                    <tr key={item.method} className="hover:bg-slate-50">
                      <td className="px-4 py-3 capitalize">{item.method}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
