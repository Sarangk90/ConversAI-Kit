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

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };

    return (
        <div className={`message-bubble-container ${isUser ? 'user' : 'bot'}`}>
            {!isUser && (
                <img src={botAvatar} alt="bot avatar" className="avatar" />
            )}
            <div className={`message-bubble ${isUser ? 'user' : 'bot'}`}>
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
                                            >
                                                {copiedIndex === node.position?.start.line ? 'Copied!' : 'Copy code'}
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
            </div>
        </div>
    );
});

export default MessageBubble;
