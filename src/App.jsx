import React, { useState, useEffect, useCallback, useRef } from 'react';

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
    `}</style>
);


// --- Helper Components ---

const SendIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
);

const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-500">
        <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm5.25 2.25a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM18.75 12a2.625 2.625 0 100 5.25 2.625 2.625 0 000-5.25zM12.75 14.625a2.625 2.625 0 115.25 0 2.625 2.625 0 01-5.25 0zM5.25 12a2.625 2.625 0 100 5.25 2.625 2.625 0 000-5.25z" clipRule="evenodd" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
    </svg>
);

// --- Structured Message Renderer Components ---

const TextRenderer = ({ content }) => (
    <p className="text-xl leading-loose">{content}</p>
);

const ListRenderer = ({ content }) => (
    <div>
        {content.title && <h3 className="text-xl font-semibold mb-3">{content.title}</h3>}
        <ul className="list-disc list-inside space-y-2">
            {content.items.map((item, index) => (
                <li key={index} className="text-xl leading-loose">{item}</li>
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
    // WebSocket connection URL (replace with your actual backend URL)
    const [socketUrl] = useState('https://mean-donkeys-refuse.loca.lt'); // Using a public echo server for demo
    const [messageHistory, setMessageHistory] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [readyState, setReadyState] = useState('CONNECTING');
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Establish WebSocket connection
        ws.current = new WebSocket(socketUrl);
        ws.current.onopen = () => {
            console.log("WebSocket connected!");
            setReadyState('OPEN');
        };
        ws.current.onclose = () => {
            console.log("WebSocket disconnected!");
            setReadyState('CLOSED');
        };
        ws.current.onmessage = (event) => {
            try {
                // The backend should send a JSON string. We parse it here.
                const parsedData = JSON.parse(event.data);
                setMessageHistory((prev) => [...prev, { data: parsedData, author: 'bot' }]);
            } catch (error) {
                // Fallback for plain text messages
                console.error("Could not parse incoming JSON: ", error);
                const fallbackData = { type: 'text', content: event.data };
                setMessageHistory((prev) => [...prev, { data: fallbackData, author: 'bot' }]);
            }
        };
        ws.current.onerror = (error) => {
            console.error("WebSocket error: ", error);
            setReadyState('CLOSED');
        };

        // Cleanup on component unmount
        return () => {
            ws.current.close();
        };
    }, [socketUrl]);

    // Scroll to the bottom of the message list when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messageHistory]);
    
    // Set a welcome message on component mount
    useEffect(() => {
            const welcomeMessage = {
            type: 'text',
            content: "Hello! I'm your AI assistant. How can I help you!"
        };
          
      
        setMessageHistory([{ data: welcomeMessage, author: 'bot' }]);
    }, []);

    const sendMessage = useCallback((message) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            // For this demo, we send the user's plain text.
            // A more advanced implementation might also send JSON from the client.
            ws.current.send(message);
        }
    }, []);

    const handleSendClick = useCallback(() => {
        if (inputValue.trim()) {
            const userMessage = {
                type: 'text',
                content: inputValue
            };
            setMessageHistory((prev) => [...prev, { data: userMessage, author: 'user' }]);
            sendMessage(inputValue);
            setInputValue('');
        }
    }, [inputValue, sendMessage]);

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };
    
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSendClick();
        }
    };

    const connectionStatus = {
        'CONNECTING': 'Connecting',
        'OPEN': 'Connected',
        'CLOSING': 'Closing',
        'CLOSED': 'Disconnected',
    }[readyState];

    return (
        <>
            <GlobalStyles />
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-100 to-blue-200 font-['Poppins',_sans-serif]">
                <div className="flex flex-col h-full w-full md:h-[90vh] md:max-w-4xl md:rounded-2xl md:shadow-2xl md:overflow-hidden bg-gray-50">
                    <header className="bg-white/70 backdrop-blur-lg shadow-sm p-4 text-gray-800 flex items-center border-b border-gray-200/80 flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-md">
                            <BotIcon />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Bupa Assistant</h1>
                            <p className={`text-base transition-colors duration-300 ${readyState === 'OPEN' ? 'text-green-500' : 'text-yellow-500'}`}>
                               ● {connectionStatus}
                            </p>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-100">
                        {messageHistory.map((message, idx) => (
                            <div key={idx} className={`flex items-end gap-4 animate-fadeInUp ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {message.author === 'bot' && (
                                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <BotIcon />
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
                                        <UserIcon />
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
                                disabled={readyState !== 'OPEN'}
                            />
                            <button
                                onClick={handleSendClick}
                                disabled={readyState !== 'OPEN' || !inputValue.trim()}
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
