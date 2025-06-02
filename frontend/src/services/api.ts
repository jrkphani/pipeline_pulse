/**
 * API service for communicating with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export interface UploadResponse {
  analysis_id: string
  filename: string
  total_deals: number
  processed_deals: number
  is_duplicate: boolean
  message: string
}

export interface AnalysisFile {
  id: string
  original_filename: string
  filename: string
  file_size: number
  total_deals: number
  processed_deals: number
  total_value: number
  is_latest: boolean
  created_at: string
  updated_at: string
}

export interface FileListResponse {
  files: AnalysisFile[]
  stats: {
    total_files: number
    total_size_bytes: number
    total_size_mb: number
    latest_analysis_id: string | null
    latest_filename: string | null
  }
  limit: number
  offset: number
}

export interface LatestAnalysisResponse {
  analysis_id: string
  filename: string
  total_deals: number
  processed_deals: number
  total_value: number
  created_at: string
}

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
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

  async uploadCsv(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseUrl}/upload/csv`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Upload failed')
    }

    return response.json()
  }

  async getFiles(limit = 50, offset = 0): Promise<FileListResponse> {
    const response = await fetch(
      `${this.baseUrl}/upload/files?limit=${limit}&offset=${offset}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch files')
    }

    return response.json()
  }

  async getLatestAnalysis(): Promise<LatestAnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/upload/latest`)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No analysis found')
      }
      throw new Error('Failed to fetch latest analysis')
    }

    return response.json()
  }

  async deleteFile(analysisId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/upload/files/${analysisId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete file')
    }

    return response.json()
  }

  async downloadFile(analysisId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/upload/download/${analysisId}`)

    if (!response.ok) {
      throw new Error('Failed to download file')
    }

    // Get filename from response headers
    const contentDisposition = response.headers.get('content-disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : 'download.csv'

    // Create blob and download
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  async setLatestAnalysis(analysisId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/upload/set-latest/${analysisId}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to set latest analysis')
    }

    return response.json()
  }

  async getAnalysisStatus(analysisId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/upload/status/${analysisId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch analysis status')
    }

    return response.json()
  }

  async getAnalysisData(analysisId: string): Promise<{
    analysis_id: string;
    filename: string;
    total_deals: number;
    processed_deals: number;
    total_value: number;
    is_latest: boolean;
    created_at: string;
    data: any[];
  }> {
    const response = await fetch(`${this.baseUrl}/upload/analysis/${analysisId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch analysis data')
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
}

export const apiService = new ApiService()
