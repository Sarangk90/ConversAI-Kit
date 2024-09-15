import React, {useEffect, useRef, useState} from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import '../styles/App.css';
import {useLocation, useNavigate} from "react-router-dom";

function App() {
    // State variables
    const [messages, setMessages] = useState([]);
    const [messagesByConversation, setMessagesByConversation] = useState({});
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [currentConversationName, setCurrentConversationName] = useState('');
    const [abortController, setAbortController] = useState(null); // New state for aborting stream

    const messageInputRef = useRef(null);  // <-- Create the ref

    const location = useLocation(); // Access the URL parameters
    const navigate = useNavigate();   // To update the URL

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const conversationId = params.get('conversation_id');

        if (conversationId) {
            selectConversation(conversationId); // Load the conversation based on URL parameter
        }
    }, [location]);


    useEffect(() => {
        fetchConversationsFromBackend();
    }, []);

    // useEffect to load messages when currentConversationId changes
    useEffect(() => {
        if (currentConversationId) {
            const conversation = conversations.find(conv => conv.conversation_id === currentConversationId);

            // Only fetch messages if the conversation is NOT new
            if (conversation && !conversation.isNew) {
                if (!messagesByConversation[currentConversationId]) {
                    fetchMessagesForConversation(currentConversationId);
                } else {
                    // Update messagesByConversation
                    setMessages(messagesByConversation[currentConversationId]);
                    setCurrentConversationName(conversation.conversation_name || 'New Conversation');
                }
            } else {
                // Handle the new conversation (set up empty state)
                setMessages(messagesByConversation[currentConversationId]);
                setCurrentConversationName('New Conversation');
            }
        }
    }, [currentConversationId, messagesByConversation, conversations]);

    // Fetch all conversations (IDs and names) from the backend
    const fetchConversationsFromBackend = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/conversations');
            const conversationsData = await response.json();

            // Sort conversations by lastUpdated in descending order
            const sortedConversations = sortConversationsByLastUpdated(conversationsData);

            setConversations(sortedConversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    // Fetch messages for a specific conversation from the backend
    const fetchMessagesForConversation = async (conversationId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}`);
            const data = await response.json();

            // Update messagesByConversation
            setMessagesByConversation((prev) => ({
                ...prev,
                [conversationId]: data.messages || [],
            }));

            // Update messages and conversation name if still viewing this conversation
            if (conversationId === currentConversationId) {
                setMessages(data.messages || []);
                setCurrentConversationName(data.conversation_name || 'New Conversation');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setMessages([]);
            setCurrentConversationName('New Conversation');
        }
    };

    const saveConversationToBackend = async (conversation) => {
        try {
            const response = await fetch('http://localhost:5000/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(conversation),
            });
            const data = await response.json();
            console.log('Saved to backend:', data);

            // Update conversations list, whether it's a new conversation or an existing one
            setConversations((prevConversations) => {
                const index = prevConversations.findIndex(
                    (conv) => conv.conversation_id === conversation.conversation_id
                );
                if (index !== -1) {
                    // Update existing conversation's name and lastUpdated
                    const updatedConversations = [...prevConversations];
                    updatedConversations[index] = {
                        ...updatedConversations[index],
                        conversation_name: conversation.conversation_name,
                        last_updated: data.last_updated // Use lastUpdated from backend
                    };
                    return sortConversationsByLastUpdated(updatedConversations);
                } else {
                    // Add new conversation
                    return sortConversationsByLastUpdated([
                        ...prevConversations,
                        {
                            conversation_id: conversation.conversation_id,
                            conversation_name: conversation.conversation_name,
                            last_updated: data.last_updated  // Use lastUpdated from backend
                        },
                    ]);
                }
            });
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    // Function to sort conversations by lastUpdated
    const sortConversationsByLastUpdated = (conversations) => {
        return conversations.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
    };

    // Generate a conversation name based on the first message
    const generateConversationName = async (message) => {
        try {
            const response = await fetch('http://localhost:5000/api/generate_name', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message}),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data.name || 'New Conversation';
        } catch (error) {
            console.error('Error fetching conversation name:', error);
            return 'New Conversation';
        }
    };

    // New function to handle updating UI state when user sends a message
    const updateUIWithUserMessage = (conversationId, userMessage, updatedMessages) => {
        // Update messages in the UI
        setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: updatedMessages,
        }));

        if (conversationId === currentConversationId) {
            setMessages(updatedMessages);
        }
    };

    // Function to handle processing each chunk of the bot's response
    const processStreamChunk = (chunkValue, assistantMessage, updatedMessages, conversationId) => {
        let buffer = chunkValue;
        let lines = buffer.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6).trim();
                if (jsonStr) {
                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.content) {
                            assistantMessage.content += data.content;

                            // Update the assistant's message in the state
                            updatedMessages[updatedMessages.length - 1] = {...assistantMessage};
                            updateMessagesInUI(conversationId, updatedMessages);
                        } else if (data.error) {
                            console.error('Error from server:', data.error);
                            alert('Error from server: ' + data.error);
                            throw new Error(data.error);
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                    }
                }
            }
        }

        // Return the remaining part of the buffer (incomplete lines)
        return lines[lines.length - 1];
    };

    // Helper function to update messages in the UI
    const updateMessagesInUI = (conversationId, updatedMessages) => {
        setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: [...updatedMessages],
        }));

        if (conversationId === currentConversationId) {
            setMessages([...updatedMessages]);
        }
    };

    // Throttled update function for smooth message display
    const throttleUpdate = (callback, limit = 200) => {
        let lastExecutionTime = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastExecutionTime >= limit) {
                callback(...args);
                lastExecutionTime = now;
            }
        };
    };

    // Function to stream bot responses and update the conversation
    const streamBotResponse = async (conversationId, updatedMessages) => {
        const controller = new AbortController();
        setAbortController(controller); // Store the controller for later use

        try {
            const response = await fetch('http://localhost:5000/api/stream_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    messages: updatedMessages,
                }),
                signal: controller.signal, // Pass the signal to the fetch request
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            let assistantMessage = { role: 'assistant', content: '' };
            updatedMessages.push(assistantMessage);

            const throttledUpdate = throttleUpdate((newMessages) => {
                updateMessagesInUI(conversationId, newMessages);
            }, 250);

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            let buffer = '';

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;

                if (value) {
                    const chunkValue = decoder.decode(value);
                    buffer = processStreamChunk(chunkValue, assistantMessage, updatedMessages, conversationId);

                    throttledUpdate(updatedMessages);
                }
            }

            updateMessagesInUI(conversationId, updatedMessages);
            return updatedMessages;

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Stream aborted');
            } else {
                handleError(error, 'Error during streaming');
            }
            return updatedMessages;
        } finally {
            setAbortController(null); // Reset the controller after streaming completes
        }
    };

    // New stopStreaming function
    const stopStreaming = () => {
        if (abortController) {
            abortController.abort(); // Stop the streaming by aborting the request
        }
    };
    // New function to handle saving conversation to the backend
    const saveConversation = async (conversationId, conversationName, messages) => {
        try {
            await saveConversationToBackend({
                conversation_id: conversationId,
                conversation_name: conversationName,
                messages: messages,
            });
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    // Refactored handleSend method
    const handleSend = async (messageText) => {
        const userMessage = {role: 'user', content: messageText};
        let conversationId = currentConversationId || generateUniqueId();
        let conversationName = currentConversationName;

        const prevMessages = messagesByConversation[conversationId] || [];
        let updatedMessages = [...prevMessages, userMessage];

        // Update the UI with the new message immediately
        updateUIWithUserMessage(conversationId, userMessage, updatedMessages);

        // Generate conversation name if it's a new conversation
        const conversationNamePromise = (conversationName === 'New Conversation')
            ? generateConversationName(messageText)
                .then((name) => {
                    setCurrentConversationName(name);
                    conversationName = name;
                    return name;
                })
                .catch((error) => {
                    handleError(error, 'Error generating conversation name');
                    return conversationName;  // Return the placeholder name
                })
            : Promise.resolve(conversationName);

        // Start streaming bot response asynchronously
        const botResponsePromise = streamBotResponse(conversationId, updatedMessages);

        // Wait for both the conversation name and bot response before saving
        Promise.all([conversationNamePromise, botResponsePromise])
            .then(([finalConversationName, finalMessages]) => {
                // Save the conversation to the backend after both are resolved
                saveConversation(conversationId, finalConversationName, finalMessages);
            })
            .catch((error) => {
                handleError(error, 'Error resolving promises');
            });
    };

    // Centralized error handler
    const handleError = (error, customMessage) => {
        console.error(customMessage, error);
        alert(`${customMessage}: ${error.message || error}`);
    };

    useEffect(() => {
        if (currentConversationId) {
            navigate(`/?conversation_id=${currentConversationId}`);
        }
    }, [currentConversationId, navigate]);

    // Handle selecting a conversation
    const selectConversation = (conversationId) => {
        setCurrentConversationId(conversationId);
    };

    // Handle creating a new conversation
    const createNewConversation = () => {
        const newConversationId = generateUniqueId();

        setCurrentConversationId(newConversationId);
        setCurrentConversationName('New Conversation');
        setMessages([]);

        // Immediately add "New Conversation" to the sidebar
        setConversations((prevConversations) => [
            {
                conversation_id: newConversationId,
                conversation_name: 'New Conversation',
                last_updated: new Date().toISOString(),
            },
            ...prevConversations,
        ]);
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }
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
                <div className="chat-container">
                    <div className="chat-wrapper">
                        <ChatWindow
                            messages={messages}
                        />
                        <MessageInput onSend={handleSend}
                                      onStop={stopStreaming}
                                      inputRef={messageInputRef}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;

// Function to generate a unique ID for new conversations
function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}
