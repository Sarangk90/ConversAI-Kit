import React, { useEffect, useRef, useState, useCallback } from 'react';
import MessageBubble, { Message } from './MessageBubble';
import '../styles/ChatWindow.css';
import botAvatar from '../assets/bot-avatar.png';

interface ChatWindowProps {
    messages?: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages = [] }) => {
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef<number>(0);
    const [showScrollButton, setShowScrollButton] = useState<boolean>(false);

    // Optimized scroll position check
    const isUserNearBottom = useCallback((): boolean => {
        if (!chatWindowRef.current) return true;
        const { scrollTop, scrollHeight, clientHeight } = chatWindowRef.current;
        return scrollHeight - (scrollTop + clientHeight) <= 1;
    }, []);

    // Debounced scroll handler
    const handleScroll = useCallback((): void => {
        if (!chatWindowRef.current) return;
        const shouldShowButton = !isUserNearBottom();
        if (shouldShowButton !== showScrollButton) {
            setShowScrollButton(shouldShowButton);
        }
    }, [isUserNearBottom, showScrollButton]);

    // Optimized scroll to bottom
    const scrollToBottom = useCallback((): void => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTo({
                top: chatWindowRef.current.scrollHeight,
                behavior: 'smooth'
            });
            setShowScrollButton(false);
        }
    }, []);

    // Scroll event listener with cleanup
    useEffect(() => {
        const chatWindow = chatWindowRef.current;
        if (!chatWindow) return;

        let scrollTimeout: NodeJS.Timeout;
        const debouncedScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScroll, 100);
        };

        chatWindow.addEventListener('scroll', debouncedScroll);
        return () => {
            clearTimeout(scrollTimeout);
            chatWindow.removeEventListener('scroll', debouncedScroll);
        };
    }, [handleScroll]);

    // Message updates handler
    useEffect(() => {
        if (!Array.isArray(messages)) return;
        
        const isNewMessage = messages.length > prevMessagesLengthRef.current;
        
        if (isNewMessage) {
            if (isUserNearBottom()) {
                scrollToBottom();
            } else {
                setShowScrollButton(true);
            }
        }

        prevMessagesLengthRef.current = messages.length;
        handleScroll();
    }, [messages, isUserNearBottom, scrollToBottom, handleScroll]);

    if (!Array.isArray(messages) || messages.length === 0) {
        return (
            <div className="chat-window-empty">
                <div className="empty-state-content">
                    <img src={botAvatar} alt="Bot Avatar" className="bot-avatar-empty"/>
                    <p>Select a conversation or start a new one to begin chatting!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-window-container">
            <div 
                className="chat-window" 
                ref={chatWindowRef}
            >
                <div className="chat-content">
                    {messages.map((message, index) => (
                        <div
                            key={`${message.role}-${index}`}
                            ref={index === messages.length - 1 ? lastMessageRef : null}
                            className="message-wrapper"
                        >
                            <MessageBubble 
                                message={message} 
                                role={message.role} 
                            />
                        </div>
                    ))}
                </div>
            </div>
            {showScrollButton && (
                <button 
                    className="scroll-bottom-button"
                    onClick={scrollToBottom}
                    aria-label="Scroll to bottom"
                >
                    <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            )}
        </div>
    );
};

export default React.memo(ChatWindow); 