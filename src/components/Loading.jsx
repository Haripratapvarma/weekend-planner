// A spinner with a short message, shown while we wait for data.
// role="status" makes screen readers announce the message.
function Loading({ message = 'Loading…' }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true"></span>
      <span>{message}</span>
    </div>
  )
}

export default Loading
