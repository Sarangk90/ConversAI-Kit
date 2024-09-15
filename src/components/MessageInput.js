import React, { useState, useRef, useEffect } from 'react';
import '../styles/MessageInput.css';

const MessageInput = ({ onSend, onStop, inputRef }) => {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const localTextareaRef = useRef(null);
    const textareaRef = inputRef || localTextareaRef;

    const handleSend = () => {
        if (input.trim()) {
            onSend(input);
            setInput('');
            setIsProcessing(true); // Set processing state to true (display Stop button)
        }
    };

    const handleStop = () => {
        onStop(); // Call stop function passed from App.js
        setIsProcessing(false); // Reset back to Send button after stopping
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input, textareaRef]);

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
            <button
                onClick={isProcessing ? handleStop : handleSend}
                disabled={!input.trim() && !isProcessing} // Disable when input is empty
            >
                {isProcessing ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="35" height="35" className="stop-icon">
                        <circle cx="50" cy="50" r="45" className="circle" />
                        <rect x="35" y="35" width="30" height="30" className="square" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="35" height="35" className="arrow-icon">
                        <circle cx="50" cy="50" r="45" className="circle" />
                        <path d="M50 25 L50 75 M30 50 L50 25 L70 50" className="arrow" stroke-width="10" stroke-linecap="round" fill="none" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default MessageInput;
