// Storage utility for saving and loading transcript and summary data
// Uses localStorage for persistence across browser sessions

export interface TranscriptData {
  id: string
  timestamp: number
  transcript: string
  summary?: string
  duration?: number
}

export interface StorageData {
  transcripts: TranscriptData[]
  settings: {
    autoSave: boolean
    maxStoredTranscripts: number
  }
}

class StorageManager {
  private readonly STORAGE_KEY = 'chrome-extension-transcriber'
  private readonly DEFAULT_SETTINGS = {
    autoSave: true,
    maxStoredTranscripts: 50
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private getStorageData(): StorageData {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        return {
          transcripts: parsed.transcripts || [],
          settings: { ...this.DEFAULT_SETTINGS, ...parsed.settings }
        }
      }
    } catch (error) {
      console.error('Failed to parse storage data:', error)
    }

    return {
      transcripts: [],
      settings: this.DEFAULT_SETTINGS
    }
  }

  private saveStorageData(data: StorageData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save storage data:', error)
      throw error
    }
  }

  saveTranscript(transcript: string, summary?: string, duration?: number): string {
    const data = this.getStorageData()
    
    const transcriptData: TranscriptData = {
      id: this.generateId(),
      timestamp: Date.now(),
      transcript,
      summary,
      duration
    }

    data.transcripts.unshift(transcriptData)

    // Limit stored transcripts
    if (data.transcripts.length > data.settings.maxStoredTranscripts) {
      data.transcripts = data.transcripts.slice(0, data.settings.maxStoredTranscripts)
    }

    this.saveStorageData(data)
    console.log('Transcript saved with ID:', transcriptData.id)
    
    return transcriptData.id
  }

  loadTranscript(id: string): TranscriptData | null {
    const data = this.getStorageData()
    const transcript = data.transcripts.find(t => t.id === id)
    return transcript || null
  }

  loadAllTranscripts(): TranscriptData[] {
    const data = this.getStorageData()
    return data.transcripts
  }

  loadLatestTranscript(): TranscriptData | null {
    const data = this.getStorageData()
    return data.transcripts.length > 0 ? data.transcripts[0] : null
  }

  updateTranscript(id: string, updates: Partial<Omit<TranscriptData, 'id' | 'timestamp'>>): boolean {
    const data = this.getStorageData()
    const index = data.transcripts.findIndex(t => t.id === id)
    
    if (index === -1) {
      console.warn('Transcript not found:', id)
      return false
    }

    data.transcripts[index] = { ...data.transcripts[index], ...updates }
    this.saveStorageData(data)
    console.log('Transcript updated:', id)
    
    return true
  }

  deleteTranscript(id: string): boolean {
    const data = this.getStorageData()
    const index = data.transcripts.findIndex(t => t.id === id)
    
    if (index === -1) {
      console.warn('Transcript not found:', id)
      return false
    }

    data.transcripts.splice(index, 1)
    this.saveStorageData(data)
    console.log('Transcript deleted:', id)
    
    return true
  }

  clearAllTranscripts(): void {
    const data = this.getStorageData()
    data.transcripts = []
    this.saveStorageData(data)
    console.log('All transcripts cleared')
  }

  getSettings() {
    const data = this.getStorageData()
    return data.settings
  }

  updateSettings(settings: Partial<typeof this.DEFAULT_SETTINGS>): void {
    const data = this.getStorageData()
    data.settings = { ...data.settings, ...settings }
    this.saveStorageData(data)
    console.log('Settings updated:', settings)
  }

  exportData(): string {
    const data = this.getStorageData()
    return JSON.stringify(data, null, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData)
      
      // Validate data structure
      if (!importedData.transcripts || !Array.isArray(importedData.transcripts)) {
        throw new Error('Invalid data format')
      }

      this.saveStorageData(importedData)
      console.log('Data imported successfully')
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }

  getStorageSize(): number {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? new Blob([data]).size : 0
    } catch (error) {
      console.error('Failed to calculate storage size:', error)
      return 0
    }
  }
}

export const storage = new StorageManager()

