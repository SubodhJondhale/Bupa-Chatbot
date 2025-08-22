import React, { useState, useEffect, useCallback, useRef } from 'react';
import socket from './socket';
import userLogo from './assets/user-logo.jpg';
import botLogo from './assets/bot-logo.jpg';
import StructuredContent from './StructuredContent';

// --- Global Styles and Animations ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeInUp {
            animation: fadeInUp 0.5s ease-out forwards;
        }
        
        /* Simple styling for code blocks */
        .code-block {
            background-color: #1E293B; /* slate-800 */
            color: #E2E8F0; /* slate-200 */
            padding: 1rem;
            border-radius: 0.75rem;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9rem;
            overflow-x: auto;
            white-space: pre-wrap;
        }

        ol {
            list-style-type: decimal;
            padding-left: 2rem;
        }
    `}</style>
);


// --- Helper Components ---

const SendIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
);


// --- Structured Message Renderer Components ---

const TextRenderer = ({ content }) => (
    <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
        <StructuredContent content={content} />
    </div>
);

const ListRenderer = ({ content }) => (
    <div>
        {content.title && <h3 className="text-lg font-semibold mb-2">{content.title}</h3>}
        <ul className="list-disc list-inside space-y-1">
            {content.items.map((item, index) => (
                <li key={index} className="text-base leading-relaxed">{item}</li>
            ))}
        </ul>
    </div>
);

const CodeRenderer = ({ content }) => (
    <div className="code-block">
        <code>{content.code}</code>
    </div>
);

// This component decides which renderer to use based on message type
const MessageRenderer = ({ message }) => {
    switch (message.type) {
        case 'list':
            return <ListRenderer content={message.content} />;
        case 'code':
            return <CodeRenderer content={message.content} />;
        case 'text':
        default:
            return <TextRenderer content={message.content} />;
    }
};


// --- Main Chat Component ---

const App = () => {
    const [messageHistory, setMessageHistory] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [userId, setUserId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setUserId(urlParams.get('userId'));
        setAccessToken(urlParams.get('accessToken'));
        // Socket.io event listeners
        socket.on('connect', () => {
            console.log("Socket.io connected!");
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log("Socket.io disconnected!");
            setIsConnected(false);
        });

        socket.on('welcome_message', (data) => {
            const welcomeMessage = {
                type: 'text',
                content: data
            };
            setMessageHistory([{ data: welcomeMessage, author: 'bot' }]);
        });

        socket.on('ai_chat_response', (data) => {
            const botMessage = {
                type: 'text',
                content: data.data
            };
            setMessageHistory((prev) => [...prev, { data: botMessage, author: 'bot' }]);
        });

        // Cleanup on component unmount
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('welcome_message');
            socket.off('ai_chat_response');
        };
    }, []);

    // Scroll to the bottom of the message list when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messageHistory]);
    
    const sendMessage = useCallback((payload) => {
        if (socket.connected) {
            console.log('Sending message:', payload);
            socket.emit('ai_chat_success', payload);
        }
    }, []);

    const handleSendClick = useCallback(() => {
        if (inputValue.trim()) {
            const userMessage = {
                type: 'text',
                content: inputValue
            };
            setMessageHistory((prev) => [...prev, { data: userMessage, author: 'user' }]);
            
            const payload = {
                message: inputValue,
                userId: userId,
                accessToken: accessToken
            };

            sendMessage(payload);
            setInputValue('');
        }
    }, [inputValue, sendMessage, userId, accessToken]);

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };
    
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSendClick();
        }
    };

    const connectionStatus = isConnected ? 'Connected' : 'Disconnected';

    return (
        <>
            <GlobalStyles />
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-100 to-blue-200 font-['Poppins',_sans-serif]">
                <div className="flex flex-col h-full w-full md:h-[90vh] md:max-w-4xl md:rounded-2xl md:shadow-2xl md:overflow-hidden bg-gray-50">
                    <header className="bg-white/70 backdrop-blur-lg shadow-sm p-4 text-gray-800 flex items-center border-b border-gray-200/80 flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-md">
                            <img src={botLogo} alt="Bot Logo" className="w-10 h-10 rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Bupa Assistant</h1>
                            <p className={`text-base transition-colors duration-300 ${isConnected ? 'text-green-500' : 'text-yellow-500'}`}>
                               ● {connectionStatus}
                            </p>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-100">
                        {messageHistory.map((message, idx) => (
                            <div key={idx} className={`flex items-end gap-4 animate-fadeInUp ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {message.author === 'bot' && (
                                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <img src={botLogo} alt="Bot Logo" className="w-8 h-8 rounded-full" />
                                    </div>
                                )}
                                <div className={`max-w-xs md:max-w-md lg:max-w-3xl px-6 py-4 rounded-2xl shadow-md ${
                                    message.author === 'user' 
                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200/80'
                                }`}>
                                    <MessageRenderer message={message.data} />
                                </div>
                                 {message.author === 'user' && (
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <img src={userLogo} alt="User Logo" className="w-8 h-8 rounded-full" />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </main>

                    <footer className="bg-white/70 backdrop-blur-lg border-t border-gray-200/80 p-4 flex-shrink-0">
                        <div className="max-w-4xl mx-auto flex items-center gap-4">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything..."
                                className="w-full px-6 py-4 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-sm"
                                disabled={!isConnected}
                            />
                            <button
                                onClick={handleSendClick}
                                disabled={!isConnected || !inputValue.trim()}
                                className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white p-4 rounded-full flex-shrink-0 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default App;
