/**
 * API service for communicating with the backend
 * 
 * NOTE: For new features, prefer using liveSyncApi from '@/services/liveSyncApi'
 * This service maintains backward compatibility with legacy upload-based features
 */

// Use relative path in development to leverage Vite proxy
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api'


class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  /**
   * Get analysis files (legacy support)
   */
  async getFiles(): Promise<{ files: any[] }> {
    return this.get('/files')
  }

  /**
   * Get analysis data by ID (legacy support)
   */
  async getAnalysisData(analysisId: string): Promise<any> {
    return this.get(`/analysis/${analysisId}`)
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`)

    if (!response.ok) {
      throw new Error(`GET ${endpoint} failed: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: any, options?: { params?: Record<string, any> }): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`

    // Add query parameters if provided
    if (options?.params) {
      const searchParams = new URLSearchParams()
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`POST ${endpoint} failed: ${response.statusText}`)
    }

    return response.json()
  }


  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString()
  }

  /**
   * Legacy method - use liveSyncApi for new implementations
   * @deprecated Use liveSyncApi.getSyncOverview() instead
   */
  async getSyncStatus(): Promise<any> {
    return this.get('/sync/status')
  }

  /**
   * Legacy method - use liveSyncApi for new implementations
   * @deprecated Use liveSyncApi.triggerManualSync() instead
   */
  async triggerSync(): Promise<any> {
    return this.post('/sync/trigger')
  }
}

export const apiService = new ApiService()
