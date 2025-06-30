interface SummaryProps {
  summary: string
}

export default function Summary({ summary }: SummaryProps) {
  return (
    <div className="summary-container">
      <h2>Summary</h2>
      <div className="summary-content">
        <p>{summary}</p>
      </div>
    </div>
  )
}

