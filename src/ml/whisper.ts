// Placeholder for Whisper model loading using transformers.js
// This will be implemented to load and run Whisper models in the browser
import { pipeline, AutomaticSpeechRecognitionPipeline } from '@xenova/transformers';

export interface WhisperModel {
  transcribe: (audioData: Float32Array) => Promise<string>
}

export class WhisperTranscriber {
  private model: AutomaticSpeechRecognitionPipeline | null = null
  private isLoading = false

  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) return

    this.isLoading = true
    console.log('Loading Whisper model...')
    try {
      this.model = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny')
      
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
      // The audioData received here is a small chunk from ScriptProcessorNode.
      // Whisper models generally expect more audio context.
      const output = await this.model(audioData, {
        return_timestamps: true,
        // Potentially add chunk_length_s here if we were sending larger audio files
        // and wanted the model to internally chunk. For small inputs, this might not be relevant.
      }) as any; // Cast to any to access .text and .chunks

      console.log('Raw model output for current audioData:', JSON.stringify(output));

      // If output.text is empty and output.chunks is empty, it means the model
      // didn't transcribe anything from this specific audioData chunk.
      // The App.tsx will need to accumulate audio and send larger segments.

      // Return the direct output; App.tsx will decide how to use it.
      // If output.chunks is null/undefined, default to empty array.
      return { text: output.text || "", chunks: output.chunks || [] };
    } catch (error) {
      console.error('Transcription failed for this audio chunk:', error);
      // Return empty result on error for this chunk to avoid breaking the stream
      return { text: "", chunks: [] };
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

