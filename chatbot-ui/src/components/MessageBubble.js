import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../styles/MessageBubble.css';
import botAvatar from '../assets/bot-avatar.png';

const MessageBubble = React.memo(({ message, role }) => {
    const isUser = role === 'user';
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [copiedMessage, setCopiedMessage] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Add keyboard event listener for Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && selectedImage) {
                setSelectedImage(null);
            }
        };

        if (selectedImage) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [selectedImage]);

    // Extract text and images from content
    const getMessageContent = () => {
        if (!message.content) return { text: '', images: [] };
        
        if (Array.isArray(message.content)) {
            const text = message.content.find(item => item.type === 'text')?.text || '';
            const images = message.content
                .filter(item => item.type === 'image_url')
                .map(item => item.image_url.url);
            return { text, images };
        }
        
        return { text: message.content, images: [] };
    };

    const { text, images } = getMessageContent();

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    const copyMessage = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedMessage(true);
            setTimeout(() => setCopiedMessage(false), 2000);
        });
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    return (
        <div className={`message-bubble-container ${isUser ? 'user' : 'bot'}`}>
            {!isUser && (
                <img src={botAvatar} alt="bot avatar" className="avatar" />
            )}
            <div className={`message-bubble ${isUser ? 'user' : 'bot'}`}>
                {images.length > 0 && (
                    <div className="message-images">
                        {images.map((image, index) => (
                            <div 
                                key={index} 
                                className="message-image"
                                onClick={() => handleImageClick(image)}
                            >
                                <img src={image} alt={`User uploaded ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                )}
                {text && (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeString = String(children).replace(/\n$/, '');

                                if (!inline && match) {
                                    return (
                                        <div className="code-block-wrapper">
                                            <div className="code-block-header">
                                                <span className="code-block-language">
                                                    {match[1]}
                                                </span>
                                                <button
                                                    className="copy-button"
                                                    onClick={() => copyToClipboard(codeString, node.position?.start.line)}
                                                    title={copiedIndex === node.position?.start.line ? 'Copied!' : 'Copy code'}
                                                >
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        {copiedIndex === node.position?.start.line ? (
                                                            <path d="M20 6L9 17l-5-5" />
                                                        ) : (
                                                            <>
                                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                            </>
                                                        )}
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="syntax-highlighter-wrapper">
                                                <SyntaxHighlighter
                                                    style={oneDark}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    {...props}
                                                    customStyle={{
                                                        margin: 0,
                                                        background: '#282c34',
                                                        padding: '16px',
                                                    }}
                                                >
                                                    {codeString}
                                                </SyntaxHighlighter>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            },
                        }}
                    >
                        {text}
                    </ReactMarkdown>
                )}
                {!isUser && (
                    <div className="message-actions">
                        <button
                            className="message-copy-button"
                            onClick={copyMessage}
                            title={copiedMessage ? 'Copied!' : 'Copy response'}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                {copiedMessage ? (
                                    <path d="M20 6L9 17l-5-5" />
                                ) : (
                                    <>
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            {selectedImage && (
                <div className="image-modal-overlay" onClick={closeModal}>
                    <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                        <img src={selectedImage} alt="Full size" />
                        <button className="image-modal-close" onClick={closeModal}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default MessageBubble;
