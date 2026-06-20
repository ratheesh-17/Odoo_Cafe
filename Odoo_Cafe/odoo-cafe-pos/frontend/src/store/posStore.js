import { create } from 'zustand'
import api from '../lib/api'
import toast from 'react-hot-toast'

export const usePosStore = create((set, get) => ({
  activeOrder: null,
  activeTable: null,
  session: null,

  setSession: (session) => set({ session }),
  setActiveTable: (table) => set({ activeTable: table }),
  setActiveOrder: (order) => set({ activeOrder: order }),

  fetchSession: async () => {
    const { data } = await api.get('/sessions/current')
    set({ session: data })
    return data
  },

  createOrder: async (tableId, customerId = null) => {
    const { data } = await api.post('/orders', { table_id: tableId, customer_id: customerId })
    set({ activeOrder: data })
    return data
  },

  loadOrder: async (orderId) => {
    const { data } = await api.get(`/orders/${orderId}`)
    set({ activeOrder: data })
    return data
  },

  addItem: async (productId, quantity = 1, note = null) => {
    const { activeOrder } = get()
    if (!activeOrder) return
    const { data } = await api.post(`/orders/${activeOrder.id}/items`, { product_id: productId, quantity, note })
    set({ activeOrder: data })
    return data
  },

  updateItem: async (itemId, quantity, note) => {
    const { activeOrder } = get()
    if (!activeOrder) return
    const { data } = await api.put(`/orders/${activeOrder.id}/items/${itemId}`, { quantity, note })
    set({ activeOrder: data })
    return data
  },

  removeItem: async (itemId) => {
    const { activeOrder } = get()
    if (!activeOrder) return
    const { data } = await api.delete(`/orders/${activeOrder.id}/items/${itemId}`)
    set({ activeOrder: data })
    return data
  },

  applyCoupon: async (code) => {
    const { activeOrder } = get()
    if (!activeOrder) return
    const { data } = await api.post(`/orders/${activeOrder.id}/coupon`, { code })
    set({ activeOrder: data })
    toast.success('Coupon applied!')
    return data
  },

  removeCoupon: async () => {
    const { activeOrder } = get()
    if (!activeOrder) return
    const { data } = await api.delete(`/orders/${activeOrder.id}/coupon`)
    set({ activeOrder: data })
    return data
  },

  sendToKitchen: async () => {
    const { activeOrder } = get()
    if (!activeOrder) return
    const { data } = await api.post(`/orders/${activeOrder.id}/send-to-kitchen`)
    set({ activeOrder: data })
    toast.success('Sent to kitchen!')
    return data
  },

  processPayment: async (paymentType, amountPaid, transactionRef = null) => {
    const { activeOrder } = get()
    if (!activeOrder) return
    const { data } = await api.post(`/orders/${activeOrder.id}/payment`, {
      payment_type: paymentType,
      amount_paid: amountPaid,
      transaction_ref: transactionRef,
    })
    set({ activeOrder: data })
    return data
  },

  clearOrder: () => set({ activeOrder: null, activeTable: null }),
}))
