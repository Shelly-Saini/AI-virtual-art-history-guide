document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatHistory = document.getElementById('chat-history');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const themeToggle = document.getElementById('theme-toggle');
    const moodSelect = document.getElementById('mood-select');
    const languageSelect = document.getElementById('language-select');
    const feedbackPrompt = document.getElementById('feedback-prompt');
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackText = document.getElementById('feedback-text');
    const submitFeedback = document.getElementById('submit-feedback');
    const dailyArtwork = document.getElementById('daily-artwork');
    const dailyTitle = document.getElementById('daily-title');
    const dailyArtist = document.getElementById('daily-artist');
    const dailyPeriod = document.getElementById('daily-period');
    const newChatBtn = document.getElementById('new-chat-btn');

    // State variables
    let conversationId = generateConversationId();
    let currentLanguage = 'en';
    let recognition;
    let lastBotMessageId = null;
    let voiceRecognitionActive = false;

    // Initialize the app
    init();

    function init() {
        // Load saved preferences
        loadPreferences();
        
        // Load daily artwork
        loadDailyArtwork();
        
        // Set up event listeners
        setupEventListeners();
        
        // Send welcome message
        sendWelcomeMessage();
    }

    function loadPreferences() {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark-mode') {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        // Load mood preference
        const savedMood = localStorage.getItem('mood');
        if (savedMood) {
            moodSelect.value = savedMood;
            applyMood(savedMood);
        }
        
        // Load language preference
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) {
            languageSelect.value = savedLanguage;
            currentLanguage = savedLanguage;
        }
        
        // Load conversation history if available
        loadConversationHistory();
    }

    function setupEventListeners() {
        // Send message on button click or Enter key
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Voice input
        voiceBtn.addEventListener('click', toggleVoiceRecognition);
        
        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);
        
        // Mood selection
        moodSelect.addEventListener('change', function() {
            const mood = this.value;
            applyMood(mood);
            localStorage.setItem('mood', mood);
        });
        
        // Language selection
        languageSelect.addEventListener('change', function() {
            currentLanguage = this.value;
            localStorage.setItem('language', currentLanguage);
            updateUIText();
        });
        
        // Feedback buttons
        document.querySelector('.yes-btn').addEventListener('click', function() {
            sendFeedback(true);
        });
        
        document.querySelector('.no-btn').addEventListener('click', function() {
            feedbackPrompt.style.display = 'none';
            feedbackForm.style.display = 'flex';
        });
        
        submitFeedback.addEventListener('click', function() {
            const feedback = feedbackText.value.trim();
            if (feedback) {
                sendFeedback(false, feedback);
                feedbackForm.style.display = 'none';
                feedbackText.value = '';
            }
        });
        
        // New chat button
        newChatBtn.addEventListener('click', startNewChat);
    }

    function updateUIText() {
        // Update input placeholder based on language
        const placeholders = {
            en: "Ask about art history...",
            hi: "कला इतिहास के बारे में पूछें...",
            es: "Pregunte sobre historia del arte...",
            fr: "Demandez sur l'histoire de l'art..."
        };
        userInput.placeholder = placeholders[currentLanguage] || placeholders.en;
        
        // Update typing indicator text
        const typingTexts = {
            en: "Art Historian is typing...",
            hi: "कला इतिहासकार टाइप कर रहा है...",
            es: "El Historiador de Arte está escribiendo...",
            fr: "L'Historien d'Art est en train d'écrire..."
        };
        typingIndicator.querySelector('span').textContent = typingTexts[currentLanguage] || typingTexts.en;
        
        // Update feedback prompt text
        const feedbackPrompts = {
            en: "Was this response helpful?",
            hi: "क्या यह प्रतिक्रिया सहायक थी?",
            es: "¿Fue útil esta respuesta?",
            fr: "Cette réponse était-elle utile?"
        };
        feedbackPrompt.querySelector('span').textContent = feedbackPrompts[currentLanguage] || feedbackPrompts.en;
    }

    function generateConversationId() {
        return 'conv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    function startNewChat() {
        // Save current conversation first
        saveConversation();
        
        // Clear the chat display
        chatHistory.innerHTML = '';
        
        // Generate new conversation ID
        conversationId = generateConversationId();
        
        // Hide any feedback prompts
        feedbackPrompt.style.display = 'none';
        feedbackForm.style.display = 'none';
        
        // Send welcome message for new chat
        sendWelcomeMessage();
    }

    function loadDailyArtwork() {
        const artworks = [
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/1200px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
                title: 'Mona Lisa',
                artist: 'Leonardo da Vinci',
                period: 'High Renaissance, 1503–1519'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/The_Starry_Night.jpg/1280px-The_Starry_Night.jpg',
                title: 'The Starry Night',
                artist: 'Vincent van Gogh',
                period: 'Post-Impressionism, 1889'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg',
                title: 'The Great Wave off Kanagawa',
                artist: 'Hokusai',
                period: 'Ukiyo-e, 1829–1833'
            }
        ];
        
        const today = new Date().getDate();
        const artwork = artworks[today % artworks.length];
        
        dailyArtwork.src = artwork.imageUrl;
        dailyTitle.textContent = artwork.title;
        dailyArtist.textContent = artwork.artist;
        dailyPeriod.textContent = artwork.period;
    }

    function sendWelcomeMessage() {
        const welcomeMessages = {
            en: "Greetings! I am your Art Historian AI. How may I assist you with art history today?",
            hi: "नमस्ते! मैं आपका कला इतिहासकार एआई हूँ। मैं आपकी कला इतिहास के बारे में कैसे मदद कर सकता हूँ?",
            es: "¡Saludos! Soy tu AI de Historia del Arte. ¿Cómo puedo ayudarte hoy?",
            fr: "Bonjour ! Je suis votre IA d'Histoire de l'Art. Comment puis-je vous aider aujourd'hui ?"
        };
        
        addBotMessage(welcomeMessages[currentLanguage] || welcomeMessages.en);
    }

    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        addUserMessage(message);
        userInput.value = '';
        
        showTypingIndicator();
        
        sendToBackend(message);
    }

    async function sendToBackend(message, imageData = null) {
        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId,
                    message,
                    image: imageData,
                    language: currentLanguage
                })
            });
            
            const data = await response.json();
            
            hideTypingIndicator();
            
            if (data.error) {
                addBotMessage("I apologize, but I encountered an error processing your request. Please try again.");
                return;
            }
            
            lastBotMessageId = addBotMessage(data.response);
            
            if (data.artworkDetails) {
                displayArtworkDetails(data.artworkDetails, lastBotMessageId);
            }
            
            showFeedbackPrompt();
            
            saveConversation();
            
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            addBotMessage("I'm sorry, I'm having trouble connecting to the server. Please try again later.");
        }
    }

    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        
        const messageContent = document.createElement('div');
        messageContent.textContent = message;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = getCurrentTime();
        
        messageElement.appendChild(messageContent);
        messageElement.appendChild(messageTime);
        
        chatHistory.appendChild(messageElement);
        scrollToBottom();
    }

    function addBotMessage(message) {
        const messageId = 'msg-' + Date.now();
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.id = messageId;
        
        const messageContent = document.createElement('div');
        messageContent.innerHTML = message;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = getCurrentTime();
        
        messageElement.appendChild(messageContent);
        messageElement.appendChild(messageTime);
        
        chatHistory.appendChild(messageElement);
        scrollToBottom();
        
        return messageId;
    }

    function displayArtworkDetails(details, messageId) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;
        
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'artwork-details';
        
        const title = document.createElement('h4');
        title.textContent = details.title || 'Artwork Details';
        
        const artist = document.createElement('p');
        artist.textContent = `Artist: ${details.artist || 'Unknown'}`;
        
        const period = document.createElement('p');
        period.textContent = `Period: ${details.period || 'Unknown'}`;
        
        const style = document.createElement('p');
        style.textContent = `Style: ${details.style || 'Unknown'}`;
        
        detailsContainer.appendChild(title);
        detailsContainer.appendChild(artist);
        detailsContainer.appendChild(period);
        detailsContainer.appendChild(style);
        
        if (details.imageUrl) {
            const image = document.createElement('img');
            image.src = details.imageUrl;
            image.className = 'artwork-image';
            image.alt = details.title || 'Artwork image';
            detailsContainer.appendChild(image);
        }
        
        messageElement.appendChild(detailsContainer);
    }

    function showTypingIndicator() {
        typingIndicator.style.display = 'flex';
        scrollToBottom();
    }

    function hideTypingIndicator() {
        typingIndicator.style.display = 'none';
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function toggleVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            addBotMessage("Your browser doesn't support speech recognition. Please use Chrome or Edge.");
            return;
        }
        
        if (voiceRecognitionActive) {
            stopVoiceRecognition();
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.style.backgroundColor = '';
        } else {
            startVoiceRecognition();
            voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            voiceBtn.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        }
        
        voiceRecognitionActive = !voiceRecognitionActive;
    }

    function startVoiceRecognition() {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = function() {
            console.log('Voice recognition started');
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            sendMessage();
        };
        
        recognition.onerror = function(event) {
            console.error('Recognition error:', event.error);
            addBotMessage("I couldn't understand your voice input. Please try again.");
            stopVoiceRecognition();
        };
        
        recognition.onend = function() {
            if (voiceRecognitionActive) {
                recognition.start();
            }
        };
        
        recognition.start();
    }

    function stopVoiceRecognition() {
        if (recognition) {
            recognition.stop();
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark-mode');
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light-mode');
        }
    }

    function applyMood(mood) {
        document.body.classList.remove('serene', 'scholarly', 'vibrant', 'classic');
        document.body.classList.add(mood);
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            addBotMessage("Please upload an image file (JPEG, PNG, etc.).");
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message user-message';
            
            const image = document.createElement('img');
            image.src = e.target.result;
            image.className = 'artwork-image';
            image.style.maxWidth = '200px';
            image.style.maxHeight = '200px';
            
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = getCurrentTime();
            
            messageElement.appendChild(image);
            messageElement.appendChild(messageTime);
            
            chatHistory.appendChild(messageElement);
            scrollToBottom();
            
            showTypingIndicator();
            
            sendToBackend("I've uploaded an artwork for identification.", e.target.result.split(',')[1]);
        };
        
        reader.readAsDataURL(file);
        event.target.value = '';
    }

    function showFeedbackPrompt() {
        feedbackPrompt.style.display = 'flex';
        feedbackForm.style.display = 'none';
    }

    async function sendFeedback(wasHelpful, feedbackText = '') {
        try {
            await fetch('http://localhost:5000/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId,
                    messageId: lastBotMessageId,
                    wasHelpful,
                    feedbackText,
                    language: currentLanguage
                })
            });
            
            const thankYouMsg = wasHelpful ? 
                "Thank you for your feedback!" : 
                "Thank you for your feedback. We'll use it to improve.";
            addBotMessage(thankYouMsg);
            
        } catch (error) {
            console.error('Error sending feedback:', error);
        }
    }

    function saveConversation() {
        const messages = [];
        document.querySelectorAll('.message').forEach(msg => {
            messages.push({
                type: msg.classList.contains('user-message') ? 'user' : 'bot',
                content: msg.querySelector('div:first-child').textContent,
                time: msg.querySelector('.message-time').textContent
            });
        });
        
        localStorage.setItem('chatHistory', JSON.stringify(messages));
        localStorage.setItem('lastConversationId', conversationId);
    }

    function loadConversationHistory() {
        const savedHistory = localStorage.getItem('chatHistory');
        const savedConvId = localStorage.getItem('lastConversationId');
        
        if (savedHistory && savedConvId) {
            conversationId = savedConvId;
            const messages = JSON.parse(savedHistory);
            
            messages.forEach(msg => {
                if (msg.type === 'user') {
                    addUserMessage(msg.content);
                } else {
                    addBotMessage(msg.content);
                }
            });
        }
    }

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('progressive-disclosure-btn')) {
            const content = e.target.nextElementSibling;
            const isExpanded = content.style.maxHeight !== '0px';
            
            if (isExpanded) {
                content.style.maxHeight = '0';
                e.target.innerHTML = 'Show more <i class="fas fa-chevron-down"></i>';
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
                e.target.innerHTML = 'Show less <i class="fas fa-chevron-up"></i>';
            }
        }
    });
});