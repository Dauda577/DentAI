export default function Card({ children, className = '', as: As = 'div', ...rest }) {
  return (
    <As
      className={`rounded-card border border-border bg-card shadow-[0_1px_3px_rgba(45,55,72,0.08)] ${className}`}
      {...rest}
    >
      {children}
    </As>
  )
}

Card.Header = function CardHeader({ children, className = '' }) {
  return <div className={`border-b border-border px-5 py-4 ${className}`}>{children}</div>
}

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}

Card.Footer = function CardFooter({ children, className = '' }) {
  return <div className={`border-t border-border px-5 py-4 ${className}`}>{children}</div>
}
