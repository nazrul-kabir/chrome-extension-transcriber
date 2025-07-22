import { pipeline, SummarizationPipeline } from '@xenova/transformers';

export class TextSummarizer {
  private model: SummarizationPipeline | null = null
  private isLoading = false

  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) return

    this.isLoading = true
    console.log('Loading summarization model...')

    try {
      this.model = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6') as SummarizationPipeline;
      console.log('Summarization model loaded successfully');
    } catch (error) {
      console.error('Failed to load summarization model:', error);
      throw error
    } finally {
      this.isLoading = false
    }
  }

  async summarize(text: string): Promise<string> {
    if (!this.model) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }

    if (!text || text.trim().length === 0) {
      return 'No text to summarize.'
    }

    try {
      // The pipeline returns an array of objects, each with a 'summary_text' field
      const result = await this.model(text, {
          min_length: 10, // Example: set min summary length
          max_length: 50  // Example: set max summary length
      });
      if (Array.isArray(result) && result.length > 0 && result[0].summary_text) {
        return result[0].summary_text;
      }
      return "Could not generate summary."; // Fallback if structure is unexpected
    } catch (error) {
      console.error('Summarization failed:', error);
      throw error;
    }
  }

  isModelLoaded(): boolean {
    return this.model !== null
  }

  isModelLoading(): boolean {
    return this.isLoading
  }
}

export const textSummarizer = new TextSummarizer()

