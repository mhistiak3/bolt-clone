import { useState, useEffect } from 'react'
import { Users, Wifi, WifiOff, UserPlus, Settings, Share2, Copy, Check } from 'lucide-react'

interface CollaborationUser {
  id: string
  name: string
  color: string
  cursor?: {
    line: number
    column: number
  }
}

interface CollaborationPanelProps {
  isConnected: boolean
  users: CollaborationUser[]
  isTyping: boolean
  typingUsers: string[]
  onInviteUser?: () => void
  onSettings?: () => void
  onShareRoom?: () => void
}

export default function CollaborationPanel({
  isConnected,
  users,
  isTyping,
  typingUsers,
  onInviteUser,
  onSettings,
  onShareRoom
}: CollaborationPanelProps) {
  const [showPanel, setShowPanel] = useState(false)
  const [roomId, setRoomId] = useState('default')
  const [copied, setCopied] = useState(false)

  // Generate room ID if not provided
  useEffect(() => {
    if (!roomId || roomId === 'default') {
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
      setRoomId(newRoomId)
    }
  }, [])

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy room ID:', error)
    }
  }

  const handleShareRoom = async () => {
    const shareUrl = `${window.location.origin}?room=${roomId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my coding session',
          text: 'Join me in real-time coding collaboration',
          url: shareUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy URL:', error)
      }
    }
    
    onShareRoom?.()
  }

  return (
    <div className="collaboration-panel">
      {/* Toggle Button */}
      <button
        className="collaboration-toggle"
        onClick={() => setShowPanel(!showPanel)}
        title="Collaboration"
      >
        <Users size={16} />
        {users.length > 0 && (
          <span className="user-count">{users.length}</span>
        )}
        {isConnected ? (
          <Wifi size={12} className="connection-indicator connected" />
        ) : (
          <WifiOff size={12} className="connection-indicator disconnected" />
        )}
      </button>

      {/* Panel Content */}
      {showPanel && (
        <div className="collaboration-content">
          {/* Header */}
          <div className="collaboration-header">
            <h3>Collaboration</h3>
            <div className="header-actions">
              <button
                className="action-button"
                onClick={onSettings}
                title="Settings"
              >
                <Settings size={14} />
              </button>
              <button
                className="action-button"
                onClick={() => setShowPanel(false)}
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          {/* Room ID */}
          <div className="room-section">
            <label>Room ID</label>
            <div className="room-id-container">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="room-id-input"
                readOnly
              />
              <button
                className="copy-button"
                onClick={handleCopyRoomId}
                title="Copy Room ID"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Share Room */}
          <div className="share-section">
            <button
              className="share-button"
              onClick={handleShareRoom}
            >
              <Share2 size={14} />
              Share Room
            </button>
          </div>

          {/* Users List */}
          <div className="users-section">
            <h4>Online Users ({users.length})</h4>
            <div className="users-list">
              {users.length === 0 ? (
                <p className="no-users">No other users online</p>
              ) : (
                users.map(user => (
                  <div key={user.id} className="user-item">
                    <div
                      className="user-avatar"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      {typingUsers.includes(user.id) && (
                        <span className="typing-indicator">typing...</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Typing Indicator */}
          {isTyping && typingUsers.length > 0 && (
            <div className="typing-status">
              <span>
                {typingUsers.length === 1 
                  ? `${users.find(u => u.id === typingUsers[0])?.name} is typing...`
                  : `${typingUsers.length} users are typing...`
                }
              </span>
            </div>
          )}

          {/* Invite Button */}
          <div className="invite-section">
            <button
              className="invite-button"
              onClick={onInviteUser}
            >
              <UserPlus size={14} />
              Invite User
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
