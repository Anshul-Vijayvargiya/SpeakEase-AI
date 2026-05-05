// client/src/components/ConversationMode.jsx
const [messages, setMessages] = useState([]);
const [isRecording, setIsRecording] = useState(false);

const onSpeechEnd = async (transcript) => {
  // 1. Append user message locally for instant UI update
  setMessages(prev => [...prev, { role: 'user', content: transcript }]);
  
  // 2. Send to backend
  const { data } = await axios.post('/api/chat/turn', { sessionId, transcript });
  
  // 3. Update state with AI reply
  setMessages(prev => [...prev, { role: 'assistant', content: data.aiReply }]);
  
  // 4. Trigger Text-to-Speech (TTS)
  const utterance = new SpeechSynthesisUtterance(data.aiReply);
  window.speechSynthesis.speak(utterance);
};