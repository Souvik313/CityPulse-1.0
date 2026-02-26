import { useState, useEffect, useRef } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export default function useChat({ baseUrl = `${API_URL}/api/v1/chat`, cityId } = {}) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const pollingRef = useRef(null);

  // No sid argument needed — backend generates the sessionId
  const startSession = async () => {
    const res = await fetch(`${baseUrl}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' , Authorization: `Bearer ${localStorage.getItem('token')}`},
      body: JSON.stringify({ cityId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to start session');

    const returned = data.data || {};
    setSessionId(returned.sessionId);
    return returned;
  };

  const fetchMessages = async () => {
    if (!sessionId) return;
    const res = await fetch(`${baseUrl}/messages?sessionId=${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    if (res.ok) setMessages(data.data || []);
  };

  const sendMessage = async ({ message, sender = 'user' }) => {
    if (!sessionId) throw new Error('No active session');
    const res = await fetch(`${baseUrl}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message, sender })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Send failed');
    await fetchMessages();
    return data;
  };
  
  const endSession = async () => {
    if (!sessionId) return;
    await fetch(`${baseUrl}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    setSessionId(null);
    setMessages([]);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  useEffect(() => {
    if (!sessionId) return;
    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 2000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [sessionId]);

  const pushMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  return { sessionId, messages, startSession, sendMessage, fetchMessages, endSession, pushMessage };
}
