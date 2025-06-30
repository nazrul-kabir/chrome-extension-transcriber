interface TranscriptProps {
  transcript: string
}

export default function Transcript({ transcript }: TranscriptProps) {
  return (
    <div className="transcript-container">
      <h2>Live Transcript</h2>
      <div className="transcript-content">
        <p>{transcript}</p>
      </div>
    </div>
  )
}

