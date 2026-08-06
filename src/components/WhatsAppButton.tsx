import './WhatsAppButton.css'

export default function WhatsAppButton() {
  // Format for WhatsApp URL (international format for Ghana: +233)
  const formattedNumber = '233203355542'
  const message = 'Hello! I would like to inquire about a product.'
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Chat on WhatsApp"
    >
      <div className="whatsapp-pulse"></div>
      <div className="whatsapp-button-inner">
        <svg viewBox="0 0 24 24" className="whatsapp-icon">
          <path fill="#ffffff" d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.267.405 2.436 1.096 3.389l-.72 2.632 2.693-.706a5.725 5.725 0 002.698.677c3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.767-5.767-5.767zm3.387 8.263c-.147.411-.85.76-1.162.808-.28.044-.645.077-1.047-.051-.244-.077-.556-.182-.954-.345-1.69-.693-2.8-2.413-2.884-2.525-.084-.112-.684-.911-.684-1.738 0-.827.433-1.233.587-1.402.154-.169.336-.211.448-.211.112 0 .224 0 .322.005.102.003.239-.038.373.295.136.334.468 1.141.508 1.223.04.082.066.177.012.285-.054.108-.081.177-.162.271-.081.094-.171.21-.244.283-.081.081-.165.17-.071.33.094.159.418.691.898 1.118.618.55 1.138.72 1.299.801.161.081.255.067.35-.042.094-.108.404-.472.512-.634.108-.162.216-.135.364-.081.148.054.937.442 1.099.523.162.081.269.121.308.188.04.067.04.391-.107.802z"/>
        </svg>
      </div>
    </a>
  )
}
