// Placeholder for Whisper model loading using transformers.js
// This will be implemented to load and run Whisper models in the browser
import { pipeline, AutomaticSpeechRecognitionPipeline } from '@xenova/transformers';

export interface WhisperModel {
  transcribe: (audioData: Float32Array) => Promise<string>
}

export class WhisperTranscriber {
  private model: AutomaticSpeechRecognitionPipeline | null = null
  private isLoading = false

  // To store the full transcript text if needed, or manage chunks
  private fullTranscript: string = ""
  private lastProcessedChunkEndTime: number = 0

  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) return

    this.isLoading = true
    console.log('Loading Whisper model...')

    try {
      this.model = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en')
      
      console.log('Whisper model loaded successfully')
    } catch (error) {
      console.error('Failed to load Whisper model:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }

  async transcribe(audioData: Float32Array): Promise<{ text: string, chunks: Array<{ timestamp: [number, number], text: string }> }> {
    if (!this.model) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }

    try {
      const output = await this.model(audioData, { return_timestamps: true }) as any;

      // The output now contains { text: "full text", chunks: [{timestamp: [start, end], text: "chunk text"}, ...] }
      // We might want to process chunks incrementally in a real-time scenario.
      // For now, we'll return the structure as is, and let the App component handle it.
      // However, for a live panel, we only want to return *new* chunks.

      let newChunks = [];
      if (output.chunks && Array.isArray(output.chunks)) {
        newChunks = output.chunks.filter(chunk => {
          // Ensure chunk and chunk.timestamp exist and timestamp is an array with at least two numbers
          return chunk && chunk.timestamp && Array.isArray(chunk.timestamp) && chunk.timestamp.length >= 2 && typeof chunk.timestamp[1] === 'number' && chunk.timestamp[1] > this.lastProcessedChunkEndTime;
        });

        if (newChunks.length > 0) {
          // Update the last processed chunk's end time
          const lastNewChunk = newChunks[newChunks.length - 1];
          if (lastNewChunk && lastNewChunk.timestamp && typeof lastNewChunk.timestamp[1] === 'number') {
            this.lastProcessedChunkEndTime = lastNewChunk.timestamp[1];
          }
        }
      }

      // Update full transcript - this might be useful if the model re-evaluates context
      // For simplicity, we'll just append new text based on new chunks for now
      // this.fullTranscript = output.text;

      return { text: output.text, chunks: newChunks };
    } catch (error) {
      console.error('Transcription failed:', error)
      throw error
    }
  }

  isModelLoaded(): boolean {
    return this.model !== null
  }

  isModelLoading(): boolean {
    return this.isLoading
  }
}

export const whisperTranscriber = new WhisperTranscriber()

