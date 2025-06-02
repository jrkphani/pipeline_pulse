import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Upload as UploadIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  Star,
  Clock,
  HardDrive
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiService, type AnalysisFile, type FileListResponse } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  analysisId?: string
  data?: any
}

interface UploadMode {
  type: 'pipeline' | 'o2r'
  label: string
  description: string
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadMode, setUploadMode] = useState<UploadMode['type']>('pipeline')
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  })
  const [fileHistory, setFileHistory] = useState<FileListResponse | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const { toast } = useToast()

  const uploadModes: UploadMode[] = [
    {
      type: 'pipeline',
      label: 'Pipeline Analysis',
      description: 'Standard pipeline analysis with currency conversion and filtering'
    },
    {
      type: 'o2r',
      label: 'O2R Tracking',
      description: 'Opportunity-to-Revenue tracking with milestone management'
    }
  ]

  // Load file history on component mount
  useEffect(() => {
    loadFileHistory()
  }, [])

  const loadFileHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const history = await apiService.getFiles()
      setFileHistory(history)
    } catch (error) {
      console.error('Failed to load file history:', error)
      toast({
        title: "Error",
        description: "Failed to load file history",
        variant: "destructive"
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      setUploadStatus({ status: 'idle', progress: 0, message: '' })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const handleUpload = async () => {
    if (!file) return

    setUploadStatus({ status: 'uploading', progress: 50, message: 'Uploading file...' })

    try {
      let result: any

      if (uploadMode === 'o2r') {
        // Upload to O2R endpoint
        const formData = new FormData()
        formData.append('file', file)
        formData.append('updated_by', 'Pipeline Pulse User')

        const response = await fetch('/api/o2r/import/csv', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('O2R upload failed')
        }

        result = await response.json()

        setUploadStatus({
          status: 'completed',
          progress: 100,
          message: `O2R import completed! ${result.imported_count} opportunities imported.`,
          data: result
        })

        toast({
          title: "O2R Import Success",
          description: `Successfully imported ${result.imported_count} opportunities for O2R tracking`,
        })

      } else {
        // Standard pipeline analysis upload
        result = await apiService.uploadCsv(file)

        setUploadStatus({
          status: 'completed',
          progress: 100,
          message: result.is_duplicate
            ? 'File already exists. Using existing analysis as the latest.'
            : 'Analysis completed successfully!',
          analysisId: result.analysis_id,
          data: result
        })

        toast({
          title: result.is_duplicate ? "Duplicate File" : "Success",
          description: result.message,
        })

        // Reload file history for pipeline mode
        await loadFileHistory()
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.'
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: errorMessage
      })

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const resetUpload = () => {
    setFile(null)
    setUploadStatus({ status: 'idle', progress: 0, message: '' })
  }

  const handleDownload = async (analysisId: string) => {
    try {
      await apiService.downloadFile(analysisId)
      toast({
        title: "Success",
        description: "File downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download file",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (analysisId: string) => {
    try {
      await apiService.deleteFile(analysisId)
      toast({
        title: "Success",
        description: "File deleted successfully",
      })
      await loadFileHistory()
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete file",
        variant: "destructive"
      })
    }
  }

  const handleSetLatest = async (analysisId: string) => {
    try {
      await apiService.setLatestAnalysis(analysisId)
      toast({
        title: "Success",
        description: "Analysis set as latest",
      })
      await loadFileHistory()
    } catch (error) {
      toast({
        title: "Failed",
        description: "Failed to set as latest",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload CSV Data</h1>
        <p className="text-muted-foreground">
          Upload your Zoho CRM opportunity export for pipeline analysis or O2R tracking with milestone management.
        </p>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Analysis Mode</CardTitle>
          <CardDescription>
            Choose how you want to analyze your opportunity data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {uploadModes.map((mode) => (
              <div
                key={mode.type}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-colors",
                  uploadMode === mode.type
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
                onClick={() => setUploadMode(mode.type)}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2",
                    uploadMode === mode.type
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )} />
                  <div>
                    <h3 className="font-medium">{mode.label}</h3>
                    <p className="text-sm text-muted-foreground">{mode.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Export Instructions</span>
          </CardTitle>
          <CardDescription>
            {uploadMode === 'o2r'
              ? 'Export requirements for O2R tracking with milestone management'
              : 'Follow these steps to export your data from Zoho CRM for pipeline analysis'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-medium">Required Fields</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                {uploadMode === 'o2r' ? (
                  <>
                    <li>• Deal Name</li>
                    <li>• Account Name</li>
                    <li>• Amount (any currency)</li>
                    <li>• Stage</li>
                    <li>• Territory</li>
                    <li>• Service Type</li>
                    <li>• Proposal Submission Date (optional)</li>
                    <li>• PO Generation Date (optional)</li>
                  </>
                ) : (
                  <>
                    <li>• Opportunity Name</li>
                    <li>• Account Name</li>
                    <li>• OCH Revenue (required)</li>
                    <li>• Probability (%)</li>
                    <li>• Stage</li>
                    <li>• Closing Date</li>
                    <li>• Currency</li>
                    <li>• Exchange Rate</li>
                  </>
                )}
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">
                {uploadMode === 'o2r' ? 'O2R Features' : 'Export Steps'}
              </h3>
              {uploadMode === 'o2r' ? (
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 4-phase milestone tracking</li>
                  <li>• Health signal monitoring</li>
                  <li>• Territory performance analysis</li>
                  <li>• Revenue realization tracking</li>
                  <li>• Automated phase progression</li>
                </ul>
              ) : (
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Go to Deals module in Zoho CRM</li>
                  <li>2. Click "Export" → "All Records"</li>
                  <li>3. Select CSV format</li>
                  <li>4. Include all standard and custom fields</li>
                  <li>5. Download and upload here</li>
                </ol>
              )}
            </div>
          </div>

          {uploadMode === 'o2r' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">O2R Template Available</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                Download our O2R CSV template to ensure proper field mapping and data structure.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/api/o2r/sample-csv-template" download>
                  <Download className="h-4 w-4 mr-2" />
                  Download O2R Template
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Your File</CardTitle>
          <CardDescription>
            Drag and drop your CSV file or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              file ? "border-green-500 bg-green-50 dark:bg-green-950" : ""
            )}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              {file ? (
                <>
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <div>
                    <p className="text-lg font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive ? "Drop your CSV file here" : "Choose CSV file"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports CSV files up to 50MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upload Status */}
          {uploadStatus.status !== 'idle' && (
            <Card className={cn(
              "border-l-4",
              uploadStatus.status === 'completed' ? "border-l-green-500" :
              uploadStatus.status === 'error' ? "border-l-red-500" : "border-l-blue-500"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  {uploadStatus.status === 'uploading' || uploadStatus.status === 'processing' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  ) : uploadStatus.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{uploadStatus.message}</p>
                    {uploadStatus.status !== 'error' && uploadStatus.status !== 'completed' && (
                      <div className="mt-2">
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadStatus.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{uploadStatus.progress}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="space-x-2">
              {file && uploadStatus.status === 'idle' && (
                <Button onClick={handleUpload}>
                  <UploadIcon className="h-4 w-4 mr-2" />
                  {uploadMode === 'o2r' ? 'Import for O2R Tracking' : 'Analyze Pipeline'}
                </Button>
              )}

              {uploadStatus.status === 'completed' && (
                <Button asChild>
                  {uploadMode === 'o2r' ? (
                    <a href="/o2r">
                      View O2R Dashboard
                    </a>
                  ) : (
                    <a href={`/analysis/${uploadStatus.analysisId}`}>
                      View Analysis
                    </a>
                  )}
                </Button>
              )}
              
              {(file || uploadStatus.status !== 'idle') && (
                <Button variant="outline" onClick={resetUpload}>
                  Reset
                </Button>
              )}
            </div>

            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Sample CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Upload History</span>
          </CardTitle>
          <CardDescription>
            Manage your uploaded files and analysis history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading file history...</span>
            </div>
          ) : fileHistory && fileHistory.files.length > 0 ? (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{fileHistory.stats.total_files}</div>
                  <div className="text-sm text-muted-foreground">Total Files</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{fileHistory.stats.total_size_mb} MB</div>
                  <div className="text-sm text-muted-foreground">Storage Used</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {fileHistory.stats.latest_filename ?
                      fileHistory.stats.latest_filename.substring(0, 20) + '...' :
                      'None'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Latest File</div>
                </div>
              </div>

              {/* File List */}
              <div className="space-y-3">
                {fileHistory.files.map((file) => (
                  <div key={file.id} className={cn(
                    "flex items-center justify-between p-4 border rounded-lg",
                    file.is_latest ? "border-green-500 bg-green-50 dark:bg-green-950" : ""
                  )}>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        {file.is_latest && <Star className="h-4 w-4 text-green-500" />}
                      </div>
                      <div>
                        <p className="font-medium">{file.original_filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.total_deals} deals • {apiService.formatFileSize(file.file_size)} •
                          {apiService.formatDate(file.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                      >
                        <a href={`/analysis/${file.id}`}>
                          View Analysis
                        </a>
                      </Button>
                      {!file.is_latest && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetLatest(file.id)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No files uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Preview */}
      {uploadStatus.status === 'completed' && uploadStatus.data && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Preview</CardTitle>
            <CardDescription>
              Here's what we found in your pipeline data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uploadStatus.data.processed_deals}</div>
                <div className="text-sm text-muted-foreground">Processed Deals</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {uploadStatus.data.total_deals}
                </div>
                <div className="text-sm text-muted-foreground">Total Deals</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {uploadStatus.data.filename}
                </div>
                <div className="text-sm text-muted-foreground">File Uploaded</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Button asChild>
                <Link to={`/analysis/${uploadStatus.data.analysis_id}`}>
                  View Full Analysis
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
