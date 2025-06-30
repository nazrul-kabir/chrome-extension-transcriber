import { useState } from 'preact/hooks'
import Transcript from './components/Transcript'
import Summary from './components/Summary'
import './app.css'

export function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript] = useState('This is a placeholder transcript. Real-time transcription will be implemented using transformers.js and Whisper.')
  const [summary] = useState('This is a placeholder summary. Summarization will be implemented using T5/BART models.')

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // TODO: Implement actual recording logic
    console.log(isRecording ? 'Stopping recording...' : 'Starting recording...')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chrome Extension Transcriber</h1>
        <button 
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
        >
          {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
        </button>
      </header>
      
      <main className="app-main">
        <Transcript transcript={transcript} />
        <Summary summary={summary} />
      </main>
    </div>
  )
}

export default App

