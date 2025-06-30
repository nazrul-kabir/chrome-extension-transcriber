// Audio capture utility using Web Audio API
// This handles microphone access and audio processing for transcription

export interface AudioCaptureOptions {
  sampleRate?: number
  channelCount?: number
  bufferSize?: number
}

export class AudioCapture {
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null
  private processor: ScriptProcessorNode | null = null
  private isRecording = false
  private audioBuffer: Float32Array[] = []
  private onAudioData?: (audioData: Float32Array) => void
  private options: AudioCaptureOptions

  constructor(options: AudioCaptureOptions = {}) {
    this.options = {
      sampleRate: 16000,
      channelCount: 1,
      bufferSize: 4096,
      ...options
    }
  }

  async startRecording(onAudioData?: (audioData: Float32Array) => void): Promise<void> {
    if (this.isRecording) {
      console.warn('Recording is already in progress')
      return
    }

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.options.sampleRate,
          channelCount: this.options.channelCount,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      // Create audio context
      this.audioContext = new AudioContext({
        sampleRate: this.options.sampleRate
      })

      // Create media stream source
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.mediaStream)

      // Create script processor for audio processing
      this.processor = this.audioContext.createScriptProcessor(
        this.options.bufferSize,
        this.options.channelCount,
        this.options.channelCount
      )

      this.onAudioData = onAudioData

      // Process audio data
      this.processor.onaudioprocess = (event) => {
        if (!this.isRecording) return

        const inputBuffer = event.inputBuffer
        const audioData = inputBuffer.getChannelData(0)
        
        // Store audio data
        this.audioBuffer.push(new Float32Array(audioData))

        // Call callback if provided
        if (this.onAudioData) {
          this.onAudioData(new Float32Array(audioData))
        }
      }

      // Connect audio nodes
      this.mediaStreamSource.connect(this.processor)
      this.processor.connect(this.audioContext.destination)

      this.isRecording = true
      console.log('Audio recording started')

    } catch (error) {
      console.error('Failed to start audio recording:', error)
      throw error
    }
  }

  stopRecording(): Float32Array {
    if (!this.isRecording) {
      console.warn('No recording in progress')
      return new Float32Array(0)
    }

    this.isRecording = false

    // Disconnect audio nodes
    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect()
      this.mediaStreamSource = null
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    // Combine all audio buffers
    const totalLength = this.audioBuffer.reduce((sum, buffer) => sum + buffer.length, 0)
    const combinedBuffer = new Float32Array(totalLength)
    
    let offset = 0
    for (const buffer of this.audioBuffer) {
      combinedBuffer.set(buffer, offset)
      offset += buffer.length
    }

    // Clear buffer
    this.audioBuffer = []

    console.log('Audio recording stopped')
    return combinedBuffer
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      return result.state === 'granted'
    } catch (error) {
      console.warn('Could not check microphone permission:', error)
      return false
    }
  }
}

export const audioCapture = new AudioCapture()

