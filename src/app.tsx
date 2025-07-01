import { useState, useEffect } from 'preact/hooks'
import Transcript from './components/Transcript'
import type { TranscriptSegment } from './components/Transcript' // Updated import style
import Summary from './components/Summary'
import './app.css'
import { audioCapture } from './utils/audioCapture'
import { whisperTranscriber } from './ml/whisper'

const TARGET_AUDIO_DURATION_S = 5; // Target 5 seconds of audio per transcription call
const SAMPLE_RATE = 16000; // Should match AudioCapture settings
const MAX_BUFFER_LENGTH = SAMPLE_RATE * TARGET_AUDIO_DURATION_S;

export function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [summary] = useState('This is a placeholder summary. Summarization will be implemented using T5/BART models.');
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to store mutable values without causing re-renders
  const audioBufferRef = useRef<Float32Array[]>([]);
  const accumulatedAudioLengthRef = useRef(0);
  const recordingStartTimeRef = useRef<number>(0); // To calculate absolute timestamps
  const currentBufferOffsetTimeRef = useRef<number>(0); // Time offset of the current audioBuffer being processed

  useEffect(() => {
    async function loadModel() {
      try {
        setError(null);
        setIsLoadingModel(true);
        await whisperTranscriber.loadModel();
        setIsLoadingModel(false);
      } catch (err) {
        console.error("Error loading model:", err);
        setError('Failed to load transcription model.');
        setIsLoadingModel(false);
      }
    }
    loadModel();
  }, []);

  const processAccumulatedAudio = async () => {
    if (audioBufferRef.current.length === 0) return;

    const combinedAudio = new Float32Array(accumulatedAudioLengthRef.current);
    let offset = 0;
    for (const buffer of audioBufferRef.current) {
      combinedAudio.set(buffer, offset);
      offset += buffer.length;
    }

    // Clear the buffer for new audio
    const bufferProcessStartTime = currentBufferOffsetTimeRef.current;
    audioBufferRef.current = [];
    accumulatedAudioLengthRef.current = 0;
    currentBufferOffsetTimeRef.current += combinedAudio.length / SAMPLE_RATE;


    if (whisperTranscriber.isModelLoaded()) {
      try {
        console.log(`Processing accumulated audio of length: ${combinedAudio.length / SAMPLE_RATE}s`);
        const result = await whisperTranscriber.transcribe(combinedAudio);
        console.log('Transcription result from accumulated audio:', result);

        if (result && result.chunks && result.chunks.length > 0) {
          const newSegments: TranscriptSegment[] = result.chunks.map(chunk => ({
            text: chunk.text,
            // Adjust timestamps to be absolute from the start of this processed buffer
            timestamp: [
              bufferProcessStartTime + chunk.timestamp[0],
              bufferProcessStartTime + chunk.timestamp[1]
            ],
          }));
          setTranscriptSegments(prevSegments => [...prevSegments, ...newSegments]);
        }
      } catch (transcriptionError) {
        console.error('Error during transcription of accumulated audio:', transcriptionError);
        setError('Error during transcription.');
      }
    }
  };

  const toggleRecording = async () => {
    if (!whisperTranscriber.isModelLoaded() && !isLoadingModel) {
      setError('Transcription model is not loaded yet. Please wait or try reloading.');
      return;
    }
    if (isLoadingModel) {
      setError('Model is still loading. Please wait.');
      return;
    }

    setIsRecording(prevIsRecording => {
      const newIsRecording = !prevIsRecording;
      if (newIsRecording) {
        // Start recording
        setError(null);
        audioBufferRef.current = [];
        accumulatedAudioLengthRef.current = 0;
        recordingStartTimeRef.current = performance.now();
        currentBufferOffsetTimeRef.current = 0;
        setTranscriptSegments([]); // Clear previous transcript


        audioCapture.startRecording(async (audioData) => {
          audioBufferRef.current.push(audioData);
          accumulatedAudioLengthRef.current += audioData.length;

          if (accumulatedAudioLengthRef.current >= MAX_BUFFER_LENGTH) {
            await processAccumulatedAudio();
          }
        }).then(() => {
          console.log('Recording started...');
        }).catch(captureError => {
          console.error('Error starting audio capture:', captureError);
          setError('Failed to start audio capture. Please check microphone permissions.');
          setIsRecording(false); // Reset recording state if start failed
        });
      } else {
        // Stop recording
        audioCapture.stopRecording();
        // Process any remaining audio in the buffer
        processAccumulatedAudio().then(() => {
            console.log('Recording stopped, final audio processed.');
        });
      }
      return newIsRecording;
    });
  };

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

