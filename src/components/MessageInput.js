import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import '../styles/MessageInput.css';

const MessageInput = forwardRef(({ onSend, onStop }, ref) => {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const textareaRef = useRef(null);

    // Expose a reset function to App.js to reset the button to "Send"
    useImperativeHandle(ref, () => ({
        resetButton() {
            setIsProcessing(false); // Reset button to "Send"
            setInput(''); // Clear input field if necessary
        },
        focus() {
            if (textareaRef.current) {
                textareaRef.current.focus(); // Focus the textarea
            }
        }
    }));

    useEffect(() => {
        return () => {
            console.log("MessageInput component unmounted");
        };
    }, []);

    const handleSend = () => {
        if (input.trim()) {
            onSend(input);
            setIsProcessing(true); // Set processing state to true (display Stop button)
            setInput(''); // Clear the input field after sending
        }
    };

    const handleStop = () => {
        onStop(); // Call stop function passed from App.js
        setIsProcessing(false); // Reset back to "Send" button after stopping
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
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set height to scrollHeight
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
            <button
                onClick={isProcessing ? handleStop : handleSend}
                disabled={!input.trim() && !isProcessing} // Disable button when input is empty
            >
                {isProcessing ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="35" height="35" className="stop-icon">
                        <circle cx="50" cy="50" r="45" className="circle" />
                        <rect x="35" y="35" width="30" height="30" className="square" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="35" height="35" className="arrow-icon">
                        <circle cx="50" cy="50" r="45" className="circle" />
                        <path d="M50 25 L50 75 M30 50 L50 25 L70 50" className="arrow" strokeWidth="10" strokeLinecap="round" fill="none" />
                    </svg>
                )}
            </button>
        </div>
    );
});

export default MessageInput;
