// src/components/MessageInput.js
import React, { useState, useRef, useEffect } from 'react';
import '../styles/MessageInput.css';

const MessageInput = ({ onSend }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef(null);

    const handleSend = () => {
        if (input.trim()) {
            onSend(input);
            setInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    return (
        <div className="message-input">
      <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          onKeyDown={handleKeyDown}
          rows={1}
      />
            <button onClick={handleSend}>Send</button>
        </div>
    );
};

export default MessageInput;
