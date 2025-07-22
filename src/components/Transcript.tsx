export interface TranscriptSegment {
  text: string;
  timestamp: [number, number];
}

interface TranscriptProps {
  segments: TranscriptSegment[];
}

// Helper to format timestamp (e.g., 00:05.200)
const formatTimestamp = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds - Math.floor(seconds)) * 1000);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
};

export default function Transcript({ segments }: TranscriptProps) {
  return (
    <div className="transcript-container">
      <h2>Live Transcript</h2>
      <div className="transcript-content">
        {segments.length === 0 && <p>Waiting for audio...</p>}
        {segments.map((segment, index) => (
          <div key={index} className="transcript-segment">
            <span className="timestamp">
              [{formatTimestamp(segment.timestamp[0])} - {formatTimestamp(segment.timestamp[1])}]
            </span>
            <p>{segment.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

