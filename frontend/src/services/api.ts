/**
 * Base API client configuration.
 *
 * Sets up Axios instance with base URL, interceptors for
 * authentication tokens, and error handling.
 * To be implemented in Phase 2 (Core setup).
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      // Redirect to login will be handled by AuthContext
    }
    return Promise.reject(error)
  }
)

export default api
