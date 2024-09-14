import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // GitHub-flavored markdown (tables, strikethrough, etc.)
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // For syntax highlighting
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Syntax highlighting theme
import '../styles/MessageBubble.css';
import botAvatar from '../assets/bot-avatar.png';

const MessageBubble = React.memo(({ message, role }) => {
    const isUser = role === 'user';

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
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    style={materialLight}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                    customStyle={{
                                        maxWidth: '100%',
                                        overflowX: 'auto',
                                        wordWrap: 'break-word',
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
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
