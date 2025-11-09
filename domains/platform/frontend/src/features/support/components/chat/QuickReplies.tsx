import React from 'react'

interface QuickRepliesProps {
  replies: string[]
  onReplyClick: (_reply: string) => void
  className?: string
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  replies,
  onReplyClick,
  className = ''
}) => {
  if (!replies || replies.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {replies.map((reply, index) => (
        <button
          key={index}
          onClick={() => onReplyClick(reply)}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          {reply}
        </button>
      ))}
    </div>
  )
}