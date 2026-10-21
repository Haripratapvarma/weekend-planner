// A friendly error box. role="alert" makes screen readers read it right away.
function ErrorMessage({ message }) {
  return (
    <div className="error-message" role="alert">
      <span aria-hidden="true">⚠️</span>
      <p>{message}</p>
    </div>
  )
}

export default ErrorMessage
