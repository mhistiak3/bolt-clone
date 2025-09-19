import { useState, useEffect, useRef, useCallback } from 'react'

interface CollaborationUser {
  id: string
  name: string
  color: string
  cursor?: {
    line: number
    column: number
  }
}

interface CollaborationMessage {
  type: 'code_change' | 'cursor_move' | 'user_join' | 'user_leave' | 'sync_request'
  userId: string
  data: any
  timestamp: number
}

interface UseCollaborationProps {
  roomId?: string
  userId?: string
  userName?: string
  onCodeChange?: (code: string) => void
  onUsersChange?: (users: CollaborationUser[]) => void
}

export function useCollaboration({
  roomId = 'default',
  userId,
  userName = 'Anonymous',
  onCodeChange,
  onUsersChange
}: UseCollaborationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState<CollaborationUser[]>([])
  const [currentCode, setCurrentCode] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSentCodeRef = useRef('')
  const userColorRef = useRef(generateUserColor())

  // Generate a random color for the user
  function generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(`ws://localhost:3001/collaborate?room=${roomId}&user=${userId}&name=${userName}`)
      
      ws.onopen = () => {
        console.log('Connected to collaboration server')
        setIsConnected(true)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: CollaborationMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('Error parsing collaboration message:', error)
        }
      }

      ws.onclose = () => {
        console.log('Disconnected from collaboration server')
        setIsConnected(false)
        setUsers([])
        
        // Attempt to reconnect after 3 seconds
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to connect to collaboration server:', error)
    }
  }, [roomId, userId, userName])

  // Handle incoming messages
  const handleMessage = useCallback((message: CollaborationMessage) => {
    switch (message.type) {
      case 'code_change':
        if (message.userId !== userId && message.data.code !== lastSentCodeRef.current) {
          setCurrentCode(message.data.code)
          onCodeChange?.(message.data.code)
        }
        break

      case 'cursor_move':
        setUsers(prev => prev.map(user => 
          user.id === message.userId 
            ? { ...user, cursor: message.data.cursor }
            : user
        ))
        break

      case 'user_join':
        setUsers(prev => {
          const existingUser = prev.find(u => u.id === message.userId)
          if (existingUser) return prev
          
          const newUser: CollaborationUser = {
            id: message.userId,
            name: message.data.name,
            color: message.data.color
          }
          return [...prev, newUser]
        })
        break

      case 'user_leave':
        setUsers(prev => prev.filter(user => user.id !== message.userId))
        setTypingUsers(prev => prev.filter(id => id !== message.userId))
        break

      case 'sync_request':
        // Send current code to requesting user
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          sendMessage({
            type: 'code_change',
            userId: userId!,
            data: { code: currentCode },
            timestamp: Date.now()
          })
        }
        break
    }
  }, [userId, currentCode, onCodeChange])

  // Send message to server
  const sendMessage = useCallback((message: CollaborationMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  // Send code change
  const sendCodeChange = useCallback((code: string) => {
    if (code !== lastSentCodeRef.current) {
      lastSentCodeRef.current = code
      setCurrentCode(code)
      
      sendMessage({
        type: 'code_change',
        userId: userId!,
        data: { code },
        timestamp: Date.now()
      })
    }
  }, [userId, sendMessage])

  // Send cursor position
  const sendCursorMove = useCallback((line: number, column: number) => {
    sendMessage({
      type: 'cursor_move',
      userId: userId!,
      data: { cursor: { line, column } },
      timestamp: Date.now()
    })
  }, [userId, sendMessage])

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    setIsTyping(true)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }, [])

  // Initialize connection
  useEffect(() => {
    if (userId) {
      connect()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [userId, connect])

  // Notify users change
  useEffect(() => {
    onUsersChange?.(users)
  }, [users, onUsersChange])

  return {
    isConnected,
    users,
    currentCode,
    isTyping,
    typingUsers,
    sendCodeChange,
    sendCursorMove,
    handleTyping,
    connect,
    disconnect: () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }
}
