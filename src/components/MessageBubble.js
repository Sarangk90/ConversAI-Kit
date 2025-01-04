import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // GitHub-flavored markdown (tables, strikethrough, etc.)
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // For syntax highlighting
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Syntax highlighting theme
import '../styles/MessageBubble.css';
import botAvatar from '../assets/bot-avatar.png';

const MessageBubble = React.memo(({ message, role }) => {
    const isUser = role === 'user';
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [copiedMessage, setCopiedMessage] = useState(false);

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    const copyMessage = () => {
        navigator.clipboard.writeText(message.content).then(() => {
            setCopiedMessage(true);
            setTimeout(() => setCopiedMessage(false), 2000);
        });
    };

    return (
        <div className={`message-bubble-container ${isUser ? 'user' : 'bot'}`}>
            {!isUser && (
                <img src={botAvatar} alt="bot avatar" className="avatar" />
            )}
            <div className={`message-bubble ${isUser ? 'user' : 'bot'}`}>
                {message.image && (
                    <div className="message-image">
                        <img src={message.image} alt="User uploaded" />
                    </div>
                )}
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
                                                        // Checkmark icon
                                                        <path d="M20 6L9 17l-5-5" />
                                                    ) : (
                                                        // Copy icon
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
                    {message.content}
                </ReactMarkdown>
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
                                    // Checkmark icon
                                    <path d="M20 6L9 17l-5-5" />
                                ) : (
                                    // Copy icon
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
        </div>
    );
});

export default MessageBubble;
