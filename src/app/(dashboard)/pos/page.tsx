'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePOSStore, CartItem } from '@/lib/store/pos-store'
import { formatCurrency } from '@/lib/utils'
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Printer,
  User,
  X,
  Star,
  ScanBarcode,
  Camera,
  Loader2,
  Check,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  barcode: string | null
  price: number
  stock: number
  image: string | null
  category: { id: string; name: string } | null
  isFavorite: boolean
  variations: { id: string; name: string; price: number; stock: number }[]
}

interface Category {
  id: string
  name: string
  color: string
}

interface Customer {
  id: string
  name: string
  phone: string | null
}

interface PaymentMethod {
  id: string
  name: string
}

interface Settings {
  payment_methods: PaymentMethod[]
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [settings, setSettings] = useState<Settings>({ payment_methods: [] })
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const barcodeRef = useRef<HTMLInputElement>(null)

  const {
    cart,
    customerId,
    customerName,
    discount,
    discountType,
    paymentMethod,
    amountPaid,
    notes,
    isPreOrder,
    addItem,
    updateQuantity,
    removeItem,
    setCustomer,
    setDiscount,
    setPaymentMethod,
    setAmountPaid,
    setNotes,
    setPreOrder,
    clearCart,
    getSubtotal,
    getTotal,
  } = usePOSStore()

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes, customersRes, settingsRes] = await Promise.all([
        fetch(`/api/products?search=${search}&categoryId=${selectedCategory || ''}&limit=100`),
        fetch('/api/categories'),
        fetch('/api/customers?limit=100'),
        fetch('/api/settings?key=payment_methods'),
      ])

      const [productsData, categoriesData, customersData, settingsData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
        customersRes.json(),
        settingsRes.json(),
      ])

      setProducts(productsData.products || [])
      setCategories(categoriesData || [])
      setCustomers(customersData.customers || [])
      const paymentMethods = Array.isArray(settingsData) ? settingsData : []
      setSettings({ payment_methods: paymentMethods })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && barcodeRef.current) {
        barcodeRef.current.focus()
      }
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault()
        if (cart.length > 0) {
          setShowPaymentModal(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart.length])

  const handleBarcodeScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput) {
      try {
        const res = await fetch(`/api/products/barcode/${barcodeInput}`)
        if (res.ok) {
          const product = await res.json()
          addToCart(product)
        }
      } catch (error) {
        console.error('Error scanning barcode:', error)
      }
      setBarcodeInput('')
    }
  }

  const addToCart = (product: Product) => {
    const item: CartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      costPrice: 0,
      discount: 0,
      discountType: 'PERCENTAGE',
    }
    addItem(item)
  }

  const handleSubmitOrder = async () => {
    setSubmitting(true)
    try {
      const subtotal = getSubtotal()
      const total = getTotal()
      const change = amountPaid - total

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          items: cart.map((item) => ({
            productId: item.productId,
            variationId: item.variationId,
            quantity: item.quantity,
            price: item.price,
            costPrice: item.costPrice,
            discount: item.discount,
            discountType: item.discountType,
            notes: item.notes,
          })),
          subtotal,
          discount,
          discountType,
          tax: 0,
          additionalFees: 0,
          total,
          paymentMethod,
          amountPaid,
          change,
          notes,
          isPreOrder,
        }),
      })

      if (res.ok) {
        const order = await res.json()
        setOrderResult(order)
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          clearCart()
        }, 3000)
      }
    } catch (error) {
      console.error('Error submitting order:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const subtotal = getSubtotal()
  const total = getTotal()
  const change = amountPaid - total

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-600">Pesanan Berhasil!</h2>
        <p className="text-slate-500 mt-2">No. Pesanan: {orderResult?.orderNumber}</p>
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-48px)]">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk... (F2 untuk scan barcode)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => barcodeRef.current?.focus()}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
            >
              <ScanBarcode className="w-5 h-5" />
            </button>
            <input
              ref={barcodeRef}
              type="text"
              placeholder="Scan barcode..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeScan}
              className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={{
                  backgroundColor: selectedCategory === cat.id ? cat.color : undefined,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className="p-3 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <h3 className="font-medium text-sm text-slate-900 truncate">{product.name}</h3>
                <p className="text-xs text-slate-500">{product.category?.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-blue-600">{formatCurrency(product.price)}</span>
                  <span className="text-xs text-slate-400">Stok: {product.stock}</span>
                </div>
                {product.isFavorite && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 absolute top-2 right-2" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Keranjang
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Customer & PreOrder */}
          <div className="space-y-2">
            <button
              onClick={() => setShowCustomerModal(true)}
              className="w-full flex items-center gap-2 p-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm">
                {customerName || 'Pilih Pelanggan'}
              </span>
            </button>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPreOrder}
                onChange={(e) => setPreOrder(e.target.checked)}
                className="rounded border-slate-300"
              />
              Pre-Order
            </label>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Keranjang kosong</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.productName}</h4>
                      {item.variationName && (
                        <p className="text-xs text-slate-500">{item.variationName}</p>
                      )}
                      <p className="text-sm font-bold text-blue-600 mt-1">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded hover:bg-slate-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded hover:bg-slate-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-bold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          {/* Discount */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              placeholder="Diskon"
              value={discount || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0, discountType)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <select
              value={discountType}
              onChange={(e) => setDiscount(discount, e.target.value as 'PERCENTAGE' | 'FIXED')}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="PERCENTAGE">%</option>
              <option value="FIXED">Rp</option>
            </select>
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon</span>
                <span>
                  -{discountType === 'PERCENTAGE' ? `${discount}%` : formatCurrency(discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Bayar & Cetak
          </button>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Pilih Pelanggan</h3>
              <button onClick={() => setShowCustomerModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <button
                onClick={() => {
                  setCustomer(null, null)
                  setShowCustomerModal(false)
                }}
                className="w-full p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <span className="font-medium">Pelanggan Umum</span>
              </button>
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setCustomer(customer.id, customer.name)
                    setShowCustomerModal(false)
                  }}
                  className="w-full p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <span className="font-medium">{customer.name}</span>
                  {customer.phone && (
                    <span className="text-sm text-slate-500 ml-2">{customer.phone}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Pembayaran</h3>
              <button onClick={() => setShowPaymentModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-100 rounded-lg">
                <div className="text-sm text-slate-600">Total Pembayaran</div>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {settings.payment_methods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 border rounded-lg text-sm font-medium ${
                        paymentMethod === method.id
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {method.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Jumlah Bayar</label>
                <input
                  type="number"
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-lg font-bold"
                  placeholder="0"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  {[1000, 2000, 5000, 10000, 20000, 50000, 100000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setAmountPaid(amount)}
                      className="flex-1 py-2 border border-slate-200 rounded text-xs hover:bg-slate-50"
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {amountPaid > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600">Kembalian</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(change)}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Catatan (Opsional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={2}
                  placeholder="Tambahkan catatan..."
                />
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={submitting || amountPaid < total}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Selesai
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
