// src/components/MessageInput.js
import React, { useState, useRef, useEffect } from 'react';
import '../styles/MessageInput.css';

const MessageInput = ({ onSend, inputRef }) => {
    const [input, setInput] = useState('');
    const localTextareaRef = useRef(null);  // Always create a local ref
    const textareaRef = inputRef || localTextareaRef;  // Conditionally use the passed ref or the local one

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
    }, [input, textareaRef]);

    return (
        <div className="message-input">
            <textarea
                ref={textareaRef}  // Always reference the textareaRef
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
