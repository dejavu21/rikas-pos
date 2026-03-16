import { create } from 'zustand'

export interface CartItem {
  id: string
  productId: string
  productName: string
  variationId?: string
  variationName?: string
  quantity: number
  price: number
  costPrice: number
  notes?: string
  discount: number
  discountType: 'PERCENTAGE' | 'FIXED'
}

interface POSState {
  cart: CartItem[]
  customerId: string | null
  customerName: string | null
  discount: number
  discountType: 'PERCENTAGE' | 'FIXED'
  paymentMethod: string
  amountPaid: number
  notes: string
  isPreOrder: boolean
  addItem: (item: CartItem) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  updateItem: (id: string, updates: Partial<CartItem>) => void
  setCustomer: (id: string | null, name: string | null) => void
  setDiscount: (discount: number, type: 'PERCENTAGE' | 'FIXED') => void
  setPaymentMethod: (method: string) => void
  setAmountPaid: (amount: number) => void
  setNotes: (notes: string) => void
  setPreOrder: (isPreOrder: boolean) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotal: () => number
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  customerId: null,
  customerName: null,
  discount: 0,
  discountType: 'PERCENTAGE',
  paymentMethod: 'tunai',
  amountPaid: 0,
  notes: '',
  isPreOrder: false,

  addItem: (item) => {
    const { cart } = get()
    const existingIndex = cart.findIndex(
      (i) => i.productId === item.productId && i.variationId === item.variationId
    )

    if (existingIndex >= 0) {
      const newCart = [...cart]
      newCart[existingIndex].quantity += item.quantity
      set({ cart: newCart })
    } else {
      set({ cart: [...cart, item] })
    }
  },

  updateQuantity: (id, quantity) => {
    const { cart } = get()
    if (quantity <= 0) {
      set({ cart: cart.filter((item) => item.id !== id) })
    } else {
      set({
        cart: cart.map((item) =>
          item.id === id ? { ...item, quantity } : item
        ),
      })
    }
  },

  removeItem: (id) => {
    const { cart } = get()
    set({ cart: cart.filter((item) => item.id !== id) })
  },

  updateItem: (id, updates) => {
    const { cart } = get()
    set({
      cart: cart.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })
  },

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  
  setDiscount: (discount, type) => set({ discount, discountType: type }),
  
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  
  setAmountPaid: (amount) => set({ amountPaid: amount }),
  
  setNotes: (notes) => set({ notes }),
  
  setPreOrder: (isPreOrder) => set({ isPreOrder }),
  
  clearCart: () => set({
    cart: [],
    customerId: null,
    customerName: null,
    discount: 0,
    paymentMethod: 'tunai',
    amountPaid: 0,
    notes: '',
    isPreOrder: false,
  }),

  getSubtotal: () => {
    const { cart } = get()
    return cart.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity
      const discount = item.discountType === 'PERCENTAGE'
        ? itemTotal * (item.discount / 100)
        : item.discount
      return sum + itemTotal - discount
    }, 0)
  },

  getTotal: () => {
    const { getSubtotal, discount, discountType } = get()
    const subtotal = getSubtotal()
    const discountAmount = discountType === 'PERCENTAGE'
      ? subtotal * (discount / 100)
      : discount
    return subtotal - discountAmount
  },
}))
