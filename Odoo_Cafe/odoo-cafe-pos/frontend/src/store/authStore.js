import { create } from 'zustand'
import api from '../lib/api'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,

  setToken: (token) => {
    localStorage.setItem('token', token)
    set({ token })
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data })
      return data
    } catch {
      set({ user: null, token: null })
      localStorage.removeItem('token')
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))
