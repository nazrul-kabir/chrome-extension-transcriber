import { useState, useEffect } from 'preact/hooks'
import Transcript, { TranscriptSegment } from './components/Transcript' // Updated import
import Summary from './components/Summary'
import './app.css'
import { audioCapture } from './utils/audioCapture'
import { whisperTranscriber } from './ml/whisper'

export function App() {
  const [isRecording, setIsRecording] = useState(false)
  // Store transcript as an array of segments
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([])
  const [summary] = useState('This is a placeholder summary. Summarization will be implemented using T5/BART models.')
  const [isLoadingModel, setIsLoadingModel] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadModel() {
      try {
        setError(null)
        setIsLoadingModel(true)
        await whisperTranscriber.loadModel()
        setIsLoadingModel(false)
      } catch (err) {
        console.error("Error loading model:", err)
        setError('Failed to load transcription model.')
        setIsLoadingModel(false)
      }
    }
    loadModel()
  }, [])

  const toggleRecording = async () => {
    if (!whisperTranscriber.isModelLoaded() && !isLoadingModel) {
      setError('Transcription model is not loaded yet. Please wait or try reloading.');
      return;
    }
    if (isLoadingModel) {
      setError('Model is still loading. Please wait.');
      return;
    }

    setIsRecording(!isRecording)
    if (!isRecording) {
      try {
        setError(null)
        await audioCapture.startRecording(async (audioData) => {
          if (whisperTranscriber.isModelLoaded()) {
            try {
              const result = await whisperTranscriber.transcribe(audioData)
              if (result && result.chunks && result.chunks.length > 0) {
                const newSegments: TranscriptSegment[] = result.chunks.map(chunk => ({
                  text: chunk.text,
                  timestamp: chunk.timestamp,
                }));
                setTranscriptSegments(prevSegments => [...prevSegments, ...newSegments]);
              }
            } catch (transcriptionError) {
              console.error('Error during transcription:', transcriptionError)
              setError('Error during transcription.')
            }
          }
        })
        console.log('Recording started...')
      } catch (captureError) {
        console.error('Error starting audio capture:', captureError)
        setError('Failed to start audio capture. Please check microphone permissions.')
        setIsRecording(false) // Reset recording state
      }
    } else {
      audioCapture.stopRecording()
      console.log('Recording stopped...')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chrome Extension Transcriber</h1>
        <button 
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          disabled={isLoadingModel}
        >
          {isLoadingModel ? 'Loading Model...' : (isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording')}
        </button>
      </header>
      
      {error && <div className="error-message">{error}</div>}

      <main className="app-main">
        <Transcript segments={transcriptSegments} />
        <Summary summary={summary} />
      </main>
    </div>
  )
}

export default App

