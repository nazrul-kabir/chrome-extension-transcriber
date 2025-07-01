import { useState, useEffect } from 'preact/hooks'
import Transcript from './components/Transcript'
import type { TranscriptSegment } from './components/Transcript'
import Summary from './components/Summary'
import './app.css'
import { audioCapture } from './utils/audioCapture'
import { whisperTranscriber } from './ml/whisper'
import { textSummarizer } from './ml/summarizer' // Import the summarizer

const TARGET_AUDIO_DURATION_S = 5; // Target 5 seconds of audio per transcription call
const SAMPLE_RATE = 16000; // Should match AudioCapture settings
const MAX_BUFFER_LENGTH = SAMPLE_RATE * TARGET_AUDIO_DURATION_S;

export function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [summary, setSummary] = useState('Summary will appear here once generated.'); // Updated initial summary
  const [isLoadingWhisper, setIsLoadingWhisper] = useState(true); // Renamed for clarity
  const [isLoadingSummarizer, setIsLoadingSummarizer] = useState(true);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);


  // Refs to store mutable values without causing re-renders
  const audioBufferRef = useRef<Float32Array[]>([]);
  const accumulatedAudioLengthRef = useRef(0);
  const recordingStartTimeRef = useRef<number>(0); // To calculate absolute timestamps
  const currentBufferOffsetTimeRef = useRef<number>(0); // Time offset of the current audioBuffer being processed

  useEffect(() => {
    async function loadModels() {
      try {
        setTranscriptionError(null);
        setIsLoadingWhisper(true);
        await whisperTranscriber.loadModel();
        setIsLoadingWhisper(false);
      } catch (err) {
        console.error("Error loading Whisper model:", err);
        setTranscriptionError('Failed to load transcription model.');
        setIsLoadingWhisper(false);
      }

      try {
        setSummaryError(null);
        setIsLoadingSummarizer(true);
        await textSummarizer.loadModel();
        setIsLoadingSummarizer(false);
      } catch (err) {
        console.error("Error loading Summarizer model:", err);
        setSummaryError('Failed to load summarization model.');
        setIsLoadingSummarizer(false);
      }
    }
    loadModels();
  }, []);

  const handleGenerateSummary = async () => {
    if (transcriptSegments.length === 0) {
      setSummaryError("No transcript available to summarize.");
      setSummary("No transcript available to summarize.");
      return;
    }
    if (!textSummarizer.isModelLoaded() || isLoadingSummarizer) {
      setSummaryError("Summarization model not ready.");
      return;
    }

    const fullTranscript = transcriptSegments.map(seg => seg.text).join(" ");
    if (fullTranscript.trim().length === 0) {
      setSummary("Transcript is empty, nothing to summarize.");
      return;
    }

    console.log("Generating summary for:", fullTranscript);
    setSummary("Generating summary...");
    setSummaryError(null);

    try {
      const generatedSummary = await textSummarizer.summarize(fullTranscript);
      setSummary(generatedSummary);
    } catch (err) {
      console.error("Error generating summary:", err);
      setSummaryError("Failed to generate summary.");
      setSummary("Failed to generate summary.");
    }
  };

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
      } catch (err) { // Corrected variable name
        console.error('Error during transcription of accumulated audio:', err);
        setTranscriptionError('Error during transcription.'); // Corrected state setter
      }
    }
  };

  const toggleRecording = async () => {
    // Use isLoadingWhisper and setTranscriptionError
    if (!whisperTranscriber.isModelLoaded() && !isLoadingWhisper) {
      setTranscriptionError('Transcription model is not loaded yet. Please wait or try reloading.');
      return;
    }
    if (isLoadingWhisper) {
      setTranscriptionError('Transcription model is still loading. Please wait.');
      return;
    }

    setIsRecording(prevIsRecording => {
      const newIsRecording = !prevIsRecording;
      if (newIsRecording) {
        // Start recording
        setTranscriptionError(null); // Corrected state setter
        setSummaryError(null);
        setSummary("Summary will appear here once generated."); // Reset summary
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
          setTranscriptionError('Failed to start audio capture. Please check microphone permissions.'); // Corrected state setter
          setIsRecording(false); // Reset recording state if start failed
        });
      } else {
        // Stop recording
        audioCapture.stopRecording();
        // Process any remaining audio in the buffer
        processAccumulatedAudio().then(() => {
            console.log('Recording stopped, final audio processed.');
            // Automatically generate summary after final audio processing
            if (transcriptSegments.length > 0 || audioBufferRef.current.length > 0 /* check if there was any audio at all */) {
                 handleGenerateSummary();
            }
        });
      }
      return newIsRecording;
    });
  };

  const isLoading = isLoadingWhisper || isLoadingSummarizer; // Combined loading state for UI

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chrome Extension Transcriber</h1>
        <div className="controls">
          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            disabled={isLoading} // Use combined loading state
          >
            {isLoadingWhisper ? 'Loading Transcriber...' : (isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording')}
          </button>
          <button
            className="summary-button"
            onClick={handleGenerateSummary}
            disabled={isLoading || isRecording || transcriptSegments.length === 0 || isLoadingSummarizer}
          >
            {isLoadingSummarizer ? 'Loading Summarizer...' : '📝 Generate Summary'}
          </button>
        </div>
      </header>
      
      {transcriptionError && <div className="error-message transcript-error">Transcription Error: {transcriptionError}</div>}
      {summaryError && <div className="error-message summary-error">Summary Error: {summaryError}</div>}

      <main className="app-main">
        <Transcript segments={transcriptSegments} />
        <Summary summary={summary} />
      </main>
    </div>
  )
}

export default App

