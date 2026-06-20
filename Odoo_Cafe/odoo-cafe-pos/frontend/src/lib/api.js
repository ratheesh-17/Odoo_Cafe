import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.detail
    if (err?.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else if (err?.response?.status !== 404) {
      toast.error(typeof msg === 'string' ? msg : 'Something went wrong')
    }
    return Promise.reject(err)
  },
)

export default api
