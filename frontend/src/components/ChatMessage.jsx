export default function ChatMessage({ role, text, sources }) {
  return (
    <div className={`message ${role}`}>
      <div>{text}</div>
      {sources && sources.length > 0 && (
        <div className="sources">
          Sources:
          <ul>
            {sources.map((s, i) => (
              <li key={i}>
                {s.sourceDoc} (chunk {s.chunkIndex}, score {s.score?.toFixed(3)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
