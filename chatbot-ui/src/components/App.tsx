import React, { useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import '../styles/App.css';

// Type Definitions
interface ApiConfig {
    readonly BASE_URL: string;
    readonly ENDPOINTS: {
        readonly CONVERSATIONS: string;
        readonly GENERATE_NAME: string;
        readonly STREAM_CHAT: string;
    };
}

interface Message {
    role: 'user' | 'assistant';
    content: string | MessageContent[];
    model?: string;
    timestamp?: string;
}

interface ImageUrl {
    url: string;
}

type MessageContent = {
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: ImageUrl;
};

interface Conversation {
    conversation_id: string;
    conversation_name: string;
    last_updated: string;
    isNew?: boolean;
    messages?: Message[];
}

interface MessagesByConversation {
    [conversationId: string]: Message[];
}

interface MessageInputRef {
    resetButton: () => void;
    focus: () => void;
}

interface StreamChunkData {
    content?: string;
    error?: string;
}

// API Configuration
const API_CONFIG: ApiConfig = {
    BASE_URL: 'http://localhost:5001',
    ENDPOINTS: {
        CONVERSATIONS: '/api/conversations',
        GENERATE_NAME: '/api/generate_name',
        STREAM_CHAT: '/chat/stream'
    }
};

function App() {
    // State variables with proper types
    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesByConversation, setMessagesByConversation] = useState<MessagesByConversation>({});
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [currentConversationName, setCurrentConversationName] = useState<string>('');
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const messageInputRef = useRef<MessageInputRef>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Define fetchConversationsFromBackend with useCallback
    const fetchConversationsFromBackend = useCallback(async (): Promise<void> => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONVERSATIONS}`);
            const conversationsData = await response.json() as Conversation[];
            const sortedConversations = sortConversationsByLastUpdated(conversationsData);
            setConversations(sortedConversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, []);

    // Define fetchMessagesForConversation with useCallback
    const fetchMessagesForConversation = useCallback(async (conversationId: string): Promise<void> => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONVERSATIONS}/${conversationId}`);
            const data = await response.json() as Conversation;

            setMessagesByConversation((prev) => ({
                ...prev,
                [conversationId]: data.messages || [],
            }));

            if (conversationId === currentConversationId) {
                setMessages(data.messages || []);
                setCurrentConversationName(data.conversation_name || 'New Conversation');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setMessages([]);
            setCurrentConversationName('New Conversation');
        }
    }, [currentConversationId]);

    // URL parameter effect
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const conversationId = params.get('conversation_id');

        if (conversationId) {
            selectConversation(conversationId);
        }
    }, [location]);

    // Initial fetch effect
    useEffect(() => {
        fetchConversationsFromBackend();
    }, [fetchConversationsFromBackend]);

    // Load messages effect
    useEffect(() => {
        if (currentConversationId) {
            const conversation = conversations.find(conv => conv.conversation_id === currentConversationId);

            if (conversation && !conversation.isNew) {
                if (!messagesByConversation[currentConversationId]) {
                    fetchMessagesForConversation(currentConversationId);
                } else {
                    setMessages(messagesByConversation[currentConversationId]);
                    setCurrentConversationName(conversation.conversation_name || 'New Conversation');
                }
            } else {
                setMessages(messagesByConversation[currentConversationId] || []);
                setCurrentConversationName('New Conversation');
            }
        }
    }, [currentConversationId, messagesByConversation, conversations, fetchMessagesForConversation]);

    // Save conversation to backend
    const saveConversationToBackend = async (conversation: Conversation): Promise<void> => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONVERSATIONS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(conversation),
            });
            const data = await response.json() as Conversation & { last_updated: string };

            setConversations((prevConversations) => {
                const index = prevConversations.findIndex(
                    (conv) => conv.conversation_id === conversation.conversation_id
                );
                if (index !== -1) {
                    const updatedConversations = [...prevConversations];
                    updatedConversations[index] = {
                        ...updatedConversations[index],
                        conversation_name: conversation.conversation_name,
                        last_updated: data.last_updated
                    };
                    return sortConversationsByLastUpdated(updatedConversations);
                } else {
                    return sortConversationsByLastUpdated([
                        ...prevConversations,
                        {
                            conversation_id: conversation.conversation_id,
                            conversation_name: conversation.conversation_name,
                            last_updated: data.last_updated
                        },
                    ]);
                }
            });
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    // Sort conversations by lastUpdated
    const sortConversationsByLastUpdated = (conversations: Conversation[]): Conversation[] => {
        return [...conversations].sort((a, b) => 
            new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        );
    };

    // Generate conversation name
    const generateConversationName = async (message: string): Promise<string> => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE_NAME}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message}),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json() as { name: string };
            let name = data.name || 'New Conversation';
            return name.trim().replace(/^"(.*)"$/, '$1');
        } catch (error) {
            console.error('Error fetching conversation name:', error);
            return 'New Conversation';
        }
    };

    // Update UI with user message
    const updateUIWithUserMessage = (conversationId: string, userMessage: Message, updatedMessages: Message[]): void => {
        setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: updatedMessages,
        }));

        if (conversationId === currentConversationId) {
            setMessages(updatedMessages);
        }
    };

    // Update messages in UI
    const updateMessagesInUI = (conversationId: string, updatedMessages: Message[]): void => {
        setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: [...updatedMessages],
        }));

        if (conversationId === currentConversationId) {
            setMessages([...updatedMessages]);
        }
    };

    // Throttle function
    const throttleUpdate = <T extends (...args: any[]) => void>(callback: T, limit = 200): T => {
        let lastExecutionTime = 0;
        return ((...args: Parameters<T>) => {
            const now = Date.now();
            if (now - lastExecutionTime >= limit) {
                callback(...args);
                lastExecutionTime = now;
            }
        }) as T;
    };

    // Process stream chunk
    const processStreamChunk = (
        chunkValue: string,
        assistantMessage: Message,
        updatedMessages: Message[],
        conversationId: string
    ): string => {
        let buffer = chunkValue;
        const lines = buffer.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6).trim();
                if (jsonStr) {
                    try {
                        const data = JSON.parse(jsonStr) as StreamChunkData;
                        if (data.content) {
                            assistantMessage.content = typeof assistantMessage.content === 'string' 
                                ? assistantMessage.content + data.content
                                : data.content;

                            updatedMessages[updatedMessages.length - 1] = {...assistantMessage};
                            updateMessagesInUI(conversationId, updatedMessages);
                        } else if (data.error) {
                            console.error('Error from server:', data.error);
                            throw new Error(data.error);
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                    }
                }
            }
        }

        return lines[lines.length - 1];
    };

    // Stream bot response
    const streamBotResponse = async (
        conversationId: string,
        updatedMessages: Message[],
        model: string
    ): Promise<Message[]> => {
        const controller = new AbortController();
        setAbortController(controller);

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STREAM_CHAT}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    messages: updatedMessages,
                    model: model,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const assistantMessage: Message = { role: 'assistant', content: '' };
            updatedMessages.push(assistantMessage);

            const throttledUpdate = throttleUpdate((messages: Message[]) => {
                updateMessagesInUI(conversationId, messages);
            });

            const reader = response.body!.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                if (value) {
                    const chunkValue = decoder.decode(value);
                    buffer = processStreamChunk(chunkValue, assistantMessage, updatedMessages, conversationId);
                    throttledUpdate(updatedMessages);
                }
            }

            updateMessagesInUI(conversationId, updatedMessages);
            return updatedMessages;

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Stream aborted');
            } else {
                handleError(error as Error, 'Error during streaming');
            }
            return updatedMessages;
        } finally {
            setAbortController(null);
            messageInputRef.current?.resetButton();
        }
    };

    // Stop streaming
    const stopStreaming = (): void => {
        abortController?.abort();
    };

    // Save conversation
    const saveConversation = async (
        conversationId: string,
        conversationName: string,
        messages: Message[]
    ): Promise<void> => {
        try {
            await saveConversationToBackend({
                conversation_id: conversationId,
                conversation_name: conversationName,
                messages: messages,
                last_updated: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    // Handle send message
    const handleSend = async (message: { text: string; images?: string[] }, selectedModel: string): Promise<void> => {
        const userMessage: Message = {
            role: 'user',
            content: message.text || '',
            model: selectedModel
        };

        if (message.images && message.images.length > 0) {
            userMessage.content = [
                { type: 'text' as const, text: message.text || '' },
                ...message.images.map(image => {
                    const base64Data = image.split(',')[1];
                    return {
                        type: 'image_url' as const,
                        image_url: { 
                            url: `data:image/jpeg;base64,${base64Data}`
                        }
                    };
                })
            ];
        }

        let conversationId = currentConversationId;
        let conversationName = currentConversationName;

        if (!conversationId) {
            conversationId = generateUniqueId();
            conversationName = 'New Conversation';

            setCurrentConversationId(conversationId);
            setCurrentConversationName(conversationName);
            setMessages([]);

            setConversations((prevConversations) => [
                {
                    conversation_id: conversationId!,
                    conversation_name: conversationName,
                    last_updated: new Date().toISOString(),
                },
                ...prevConversations,
            ]);

            navigate(`/?conversation_id=${conversationId}`);
        }

        const prevMessages = messagesByConversation[conversationId] || [];
        const updatedMessages = [...prevMessages, userMessage];

        updateUIWithUserMessage(conversationId, userMessage, updatedMessages);

        const conversationNamePromise = (conversationName === 'New Conversation')
            ? generateConversationName(message.text || 'Image message')
                .then((name) => {
                    setCurrentConversationName(name);
                    return name;
                })
                .catch((error) => {
                    handleError(error as Error, 'Error generating conversation name');
                    return conversationName;
                })
            : Promise.resolve(conversationName);

        const botResponsePromise = streamBotResponse(conversationId, updatedMessages, selectedModel);

        Promise.all([conversationNamePromise, botResponsePromise])
            .then(([finalConversationName, finalMessages]) => {
                saveConversation(conversationId, finalConversationName, finalMessages);
            })
            .catch((error) => {
                handleError(error as Error, 'Error resolving promises');
            });
    };

    // Error handler
    const handleError = (error: Error, customMessage: string): void => {
        console.error(customMessage, error);
        alert(`${customMessage}: ${error.message || error}`);
    };

    // URL effect
    useEffect(() => {
        if (currentConversationId) {
            navigate(`/?conversation_id=${currentConversationId}`);
        }
    }, [currentConversationId, navigate]);

    // Select conversation
    const selectConversation = (conversationId: string): void => {
        setCurrentConversationId(conversationId);
    };

    // Create new conversation
    const createNewConversation = (): void => {
        const existingNewConversation = conversations.find(conv => conv.conversation_name === 'New Conversation');

        if (existingNewConversation) {
            setCurrentConversationId(existingNewConversation.conversation_id);
            setCurrentConversationName('New Conversation');
            setMessages(messagesByConversation[existingNewConversation.conversation_id] || []);
            messageInputRef.current?.focus();
            return;
        }

        const newConversationId = generateUniqueId();

        setCurrentConversationId(newConversationId);
        setCurrentConversationName('New Conversation');
        setMessages([]);

        setConversations((prevConversations) => [
            {
                conversation_id: newConversationId!,
                conversation_name: 'New Conversation',
                last_updated: new Date().toISOString(),
            },
            ...prevConversations,
        ]);

        messageInputRef.current?.focus();
    };

    return (
        <div className="App">
            <div className="main-content">
                <Sidebar
                    conversations={conversations}
                    onSelectConversation={selectConversation}
                    onNewConversation={createNewConversation}
                    currentConversationId={currentConversationId}
                />
                <button 
                    className="expand-sidebar-button"
                    onClick={() => document.querySelector('.sidebar')?.classList.remove('collapsed')}
                    title="Show sidebar"
                >
                    <svg
                        width="8"
                        height="24"
                        viewBox="0 0 8 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M6 3L1 12L6 21" />
                    </svg>
                </button>
                <div className="chat-container">
                    <div className="chat-wrapper">
                        <ChatWindow
                            messages={messages}
                        />
                        <MessageInput 
                            onSend={handleSend}
                            onStop={stopStreaming}
                            ref={messageInputRef}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Generate unique ID
function generateUniqueId(): string {
    return '_' + Math.random().toString(36).substr(2, 9);
}

export default App; 