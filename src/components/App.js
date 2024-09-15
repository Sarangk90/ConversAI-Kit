// App.js

import React, {useEffect, useState} from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import '../styles/App.css';

function App() {
    // State variables
    const [messages, setMessages] = useState([]);
    const [messagesByConversation, setMessagesByConversation] = useState({});
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [currentConversationName, setCurrentConversationName] = useState('');

    useEffect(() => {
        fetchConversationsFromBackend();
    }, []);

    // useEffect to load messages when currentConversationId changes
    useEffect(() => {
        if (currentConversationId) {
            if (!messagesByConversation[currentConversationId]) {
                fetchMessagesForConversation(currentConversationId);
            } else {
                setMessages(messagesByConversation[currentConversationId]);
                const conversation = conversations.find(
                    (conv) => conv.conversation_id === currentConversationId
                );
                if (conversation) {
                    setCurrentConversationName(conversation.conversation_name || 'New Conversation');
                } else {
                    setCurrentConversationName('New Conversation');
                }
            }
        }
    }, [currentConversationId, messagesByConversation, conversations]);

    // Fetch all conversations (IDs and names) from the backend
    const fetchConversationsFromBackend = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/conversations');
            const conversationsData = await response.json();

            // Extract conversation IDs and names
            const conversationsList = conversationsData.map((conv) => ({
                conversation_id: conv.conversation_id,
                conversation_name: conv.conversation_name || 'New Conversation',
            }));

            setConversations(conversationsList);
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
                if (data.conversation_name) {
                    setCurrentConversationName(data.conversation_name);
                }
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
                    // Update existing conversation's name
                    const updatedConversations = [...prevConversations];
                    updatedConversations[index] = {
                        ...updatedConversations[index],
                        conversation_name: conversation.conversation_name,
                    };
                    return updatedConversations;
                } else {
                    // Add new conversation
                    return [
                        ...prevConversations,
                        {
                            conversation_id: conversation.conversation_id,
                            conversation_name: conversation.conversation_name,
                        },
                    ];
                }
            });
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
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

    // Handle sending a message
    // const handleSend = async (messageText) => {
    //     const userMessage = { role: 'user', content: messageText };
    //     let conversationId = currentConversationId;
    //
    //     // If there's no current conversation ID, create a new one
    //     if (!conversationId) {
    //         conversationId = generateUniqueId();
    //         setCurrentConversationId(conversationId);
    //     }
    //
    //     let conversationName = currentConversationName;
    //
    //     // If this is the first message, generate a conversation name
    //     if (!conversationName || conversationName === 'New Conversation') {
    //         try {
    //             conversationName = await generateConversationName(messageText);
    //             setCurrentConversationName(conversationName);
    //         } catch (error) {
    //             console.error('Error generating conversation name:', error);
    //             conversationName = 'New Conversation';
    //             setCurrentConversationName(conversationName);
    //         }
    //     }
    //
    //     // Prepare the updated messages
    //     const prevMessages = messagesByConversation[conversationId] || [];
    //     let updatedMessages = [...prevMessages, userMessage];
    //
    //     // Update messages for this conversation
    //     setMessagesByConversation((prev) => ({
    //         ...prev,
    //         [conversationId]: updatedMessages,
    //     }));
    //
    //     // Update messages if this is the current conversation
    //     if (conversationId === currentConversationId) {
    //         setMessages(updatedMessages);
    //     }
    //
    //     // Save conversation to backend (with user's message)
    //     saveConversationToBackend({
    //         conversation_id: conversationId,
    //         conversation_name: conversationName,
    //         messages: updatedMessages,
    //     });
    //
    //     const streamingConversationId = conversationId; // Capture the conversation ID at this moment
    //
    //     try {
    //         // Start the streaming request
    //         const response = await fetch('http://localhost:5000/api/stream_chat', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({
    //                 conversation_id: streamingConversationId,
    //                 messages: updatedMessages,
    //             }),
    //         });
    //
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //         }
    //
    //         let assistantMessage = { role: 'assistant', content: '' };
    //
    //         // Append assistant's message placeholder to updatedMessages
    //         updatedMessages = [...updatedMessages, assistantMessage];
    //
    //         // Update messages for this conversation
    //         setMessagesByConversation((prev) => ({
    //             ...prev,
    //             [streamingConversationId]: updatedMessages,
    //         }));
    //
    //         // Update messages if this is the current conversation
    //         if (streamingConversationId === currentConversationId) {
    //             setMessages(updatedMessages);
    //         }
    //
    //         const reader = response.body.getReader();
    //         const decoder = new TextDecoder('utf-8');
    //
    //         let done = false;
    //         let buffer = '';
    //
    //         while (!done) {
    //             const { value, done: doneReading } = await reader.read();
    //             done = doneReading;
    //
    //             if (value) {
    //                 const chunkValue = decoder.decode(value);
    //                 buffer += chunkValue;
    //
    //                 let lines = buffer.split('\n');
    //
    //                 for (let i = 0; i < lines.length - 1; i++) {
    //                     const line = lines[i].trim();
    //                     if (line.startsWith('data: ')) {
    //                         const jsonStr = line.substring(6).trim();
    //                         if (jsonStr) {
    //                             try {
    //                                 const data = JSON.parse(jsonStr);
    //                                 if (data.content) {
    //                                     assistantMessage.content += data.content;
    //
    //                                     // Update the assistant message in updatedMessages
    //                                     updatedMessages[updatedMessages.length - 1] = { ...assistantMessage };
    //
    //                                     // Update messages for this conversation
    //                                     setMessagesByConversation((prev) => ({
    //                                         ...prev,
    //                                         [streamingConversationId]: [...updatedMessages],
    //                                     }));
    //
    //                                     // Update messages if this is the current conversation
    //                                     if (streamingConversationId === currentConversationId) {
    //                                         setMessages([...updatedMessages]);
    //                                     }
    //                                 } else if (data.finish) {
    //                                     // Optionally handle finish_reason
    //                                 } else if (data.error) {
    //                                     console.error('Error from server:', data.error);
    //                                     alert('Error from server: ' + data.error);
    //                                     done = true;
    //                                     break;
    //                                 }
    //                             } catch (e) {
    //                                 console.error('Error parsing JSON:', e);
    //                             }
    //                         }
    //                     }
    //                 }
    //
    //                 // Keep the incomplete part of the buffer
    //                 buffer = lines[lines.length - 1];
    //             }
    //         }
    //
    //         // Save conversation to backend (with assistant's message)
    //         saveConversationToBackend({
    //             conversation_id: streamingConversationId,
    //             conversation_name: conversationName,
    //             messages: updatedMessages,
    //         });
    //     } catch (error) {
    //         console.error('Error:', error);
    //         alert('An error occurred. Please try again.');
    //     }
    // };

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

// New function to handle streaming bot responses
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

// Refactored streamBotResponse function
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

    const streamBotResponse = async (conversationId, updatedMessages) => {
        try {
            const response = await fetch('http://localhost:5000/api/stream_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    messages: updatedMessages,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            let assistantMessage = { role: 'assistant', content: '' };
            updatedMessages.push(assistantMessage);

            // Throttled update for assistant message
            const throttledUpdate = throttleUpdate((newMessages) => {
                updateMessagesInUI(conversationId, newMessages);
            }, 250);  // Update state every 250ms for smooth streaming

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

                    // Perform throttled UI updates
                    throttledUpdate(updatedMessages);
                }
            }

            // Final state update after streaming completes
            updateMessagesInUI(conversationId, updatedMessages);

            return updatedMessages;

        } catch (error) {
            handleError(error, 'Error during streaming');
            return updatedMessages;
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
        const userMessage = { role: 'user', content: messageText };
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

    // Handle selecting a conversation
    const selectConversation = (conversationId) => {
        setCurrentConversationId(conversationId);
        // Messages will be loaded in useEffect
    };

    // Handle creating a new conversation
    const createNewConversation = () => {
        const newConversationId = generateUniqueId();

        // Set the current conversation to the newly created one
        setCurrentConversationId(newConversationId);
        setCurrentConversationName('New Conversation');
        setMessages([]);

        // Immediately add "New Conversation" to the sidebar
        setConversations((prevConversations) => [
            ...prevConversations,
            {
                conversation_id: newConversationId,
                conversation_name: 'New Conversation',
            },
        ]);
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
                        <MessageInput onSend={handleSend}/>
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
