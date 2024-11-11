// src/components/MessageInput.js
import React, {
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
  } from 'react';
  import '../styles/MessageInput.css';
  import ModelSelector from './ModelSelector'; // Import the ModelSelector
  
  const MessageInput = forwardRef(({ onSend, onStop }, ref) => {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo'); // Default model
    const textareaRef = useRef(null);
  
    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      resetButton() {
        setIsProcessing(false);
        setInput('');
      },
      focus() {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      },
    }));
  
    const handleSend = () => {
      if (input.trim()) {
        onSend(input, selectedModel); // Pass selectedModel to onSend
        setIsProcessing(true);
        setInput('');
      }
    };
  
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };
  
    // Auto-adjust the height of the textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [input]);
  
    return (
      <div className="message-input">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          onClick={isProcessing ? onStop : handleSend}
          disabled={!input.trim() && !isProcessing}
        >
          {isProcessing ? (
            // Stop icon SVG
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24"
              width="24"
              viewBox="0 0 24 24"
              fill="#FF3B30"
            >
              <path d="M19 13H5v-2h14v2z" />
            </svg>
          ) : (
            // Send icon SVG
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24"
              width="24"
              viewBox="0 0 24 24"
              fill="#007AFF"
            >
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          )}
        </button>
      </div>
    );
  });
  
  export default MessageInput;