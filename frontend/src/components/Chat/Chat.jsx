import React, { useState, useEffect, useRef } from 'react';
import useChat from '../../hooks/useChat';
import { io as createSocket } from 'socket.io-client';

export default function Chat({ cityId }) {
  const { sessionId, messages, startSession, sendMessage, endSession, pushMessage } = useChat({ cityId });
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false); // new
  const messagesRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]);

  const initSocket = (resolvedSessionId) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      if (!socketRef.current) {
        socketRef.current = createSocket(backendUrl);
        socketRef.current.on('connect', () => {
          socketRef.current.emit('join', resolvedSessionId);
        });
        socketRef.current.on('message', (msg) => {
          pushMessage(msg);
        });
      } else {
        socketRef.current.emit('join', resolvedSessionId);
      }
    } catch (err) {
      console.warn('Socket.io client not connected:', err.message || err);
    }
  };

  const handleStart = async () => {
    try {
      const session = await startSession();
      initSocket(session.sessionId);
    } catch (err) {
      console.error(err);
      alert('Failed to start chat session');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      if (!sessionId) {
        await handleStart();
        await new Promise((r) => setTimeout(r, 150));
      }
      setIsBotTyping(true); // show typing indicator
      await sendMessage({ message: input.trim(), sender: 'user' });
      setInput('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    } finally {
      setIsBotTyping(false); // hide typing indicator
    }
  };

  return (
    <div className="chat-widget" style={{ border: '1px solid #ccc', padding: 8, width: 320 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={handleStart}>{sessionId ? 'Resume' : 'Start Chat'}</button>
        {sessionId && <button onClick={endSession}>End</button>}
      </div>

      <div
        ref={messagesRef}
        className="chat-messages"
        style={{ height: 240, overflow: 'auto', border: '1px solid #eee', padding: 8, marginBottom: 8 }}
      >
        {messages.length === 0 && !isBotTyping && (
          <div style={{ color: '#666' }}>No messages yet. Start the conversation.</div>
        )}

        {messages.map((m) => (
          <div
            key={m._id}
            style={{ marginBottom: 6, textAlign: m.sender === 'bot' ? 'left' : 'right' }}
          >
            <div
              style={{
                display: 'inline-block',
                padding: '6px 10px',
                borderRadius: 6,
                background: m.sender === 'bot' ? '#f1f1f1' : '#007bff',
                color: m.sender === 'bot' ? '#000' : '#fff'
              }}
            >
              {m.content}
            </div>
            <div style={{ fontSize: 11, color: '#888' }}>
              {new Date(m.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {/* Bot typing indicator */}
        {isBotTyping && (
          <div style={{ marginBottom: 6, textAlign: 'left' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '6px 10px',
                borderRadius: 6,
                background: '#f1f1f1',
                color: '#888',
                fontStyle: 'italic'
              }}
            >
              Bot is typing...
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ flex: 1 }}
          disabled={isBotTyping} // prevent sending while bot is replying
          placeholder={isBotTyping ? 'Waiting for reply...' : 'Type a message...'}
        />
        <button onClick={handleSend} disabled={isBotTyping}>Send</button>
      </div>
    </div>
  );
}
