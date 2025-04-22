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
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
                title: 'Mona Lisa',
                artist: 'Leonardo da Vinci',
                period: 'High Renaissance, 1503–1519'
            },{
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
                title: 'The Starry Night',
                artist: 'Vincent van Gogh',
                period: 'Post-Impressionism, 1889'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Tsunami_by_hokusai_19th_century.jpg',
                title: 'The Great Wave off Kanagawa',
                artist: 'Hokusai',
                period: 'Ukiyo-e, 1829–1833'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Las_Meninas_01.jpg',
                title: 'Las Meninas',
                artist: 'Diego Velázquez',
                period: 'Baroque, 1656'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/66/The_School_of_Athens_by_Raffaello_Sanzio_da_Urbino.jpg',
                title: 'The School of Athens',
                artist: 'Raphael',
                period: 'High Renaissance, 1509–1511'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/The_Scream.jpg',
                title: 'The Scream',
                artist: 'Edvard Munch',
                period: 'Expressionism, 1893'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg',
                title: 'The Birth of Venus',
                artist: 'Sandro Botticelli',
                period: 'Early Renaissance, 1484–1486'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Nightwatch_by_Rembrandt.jpg',
                title: 'The Night Watch',
                artist: 'Rembrandt van Rijn',
                period: 'Baroque, 1642'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Girl_with_a_Pearl_Earring.jpg',
                title: 'Girl with a Pearl Earring',
                artist: 'Johannes Vermeer',
                period: 'Dutch Golden Age, 1665'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Guernica.jpg',
                title: 'Guernica',
                artist: 'Pablo Picasso',
                period: 'Cubism, 1937'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/49/The_Persistence_of_Memory.jpg',
                title: 'The Persistence of Memory',
                artist: 'Salvador Dalí',
                period: 'Surrealism, 1931'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Liberty_Leading_the_People%2C_by_Eug%C3%A8ne_Delacroix.jpg',
                title: 'Liberty Leading the People',
                artist: 'Eugène Delacroix',
                period: 'Romanticism, 1830'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Arnolfini_Portrait.jpg',
                title: 'The Arnolfini Portrait',
                artist: 'Jan van Eyck',
                period: 'Northern Renaissance, 1434'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Whistlers_Mother_high_res.jpg',
                title: 'Whistler’s Mother',
                artist: 'James McNeill Whistler',
                period: 'Realism, 1871'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Hokusai_-_Thirty-Six_Views_of_Mount_Fuji%2C_The_Great_Wave_off_Kanagawa.jpg',
                title: 'Thirty-Six Views of Mount Fuji',
                artist: 'Hokusai',
                period: 'Ukiyo-e, 1830–1833'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Shiva_as_the_Lord_of_Dance_LACMA_edit.jpg/800px-Shiva_as_the_Lord_of_Dance_LACMA_edit.jpg',
                title: 'Shiva as Nataraja',
                artist: 'Chola Dynasty',
                period: 'Chola Period, 10th century, India'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Raja_Ravi_Varma%2C_Lady_in_the_Moon_Light_%281889%29.jpg',
                title: 'Lady in Moonlight',
                artist: 'Raja Ravi Varma',
                period: 'Modern Indian Art, late 19th century'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Rabindranath_Tagore_Artwork.jpg',
                title: 'Untitled',
                artist: 'Rabindranath Tagore',
                period: 'Bengal School, early 20th century'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Abanindranath_Tagore_Bharat_Mata.jpg',
                title: 'Bharat Mata',
                artist: 'Abanindranath Tagore',
                period: 'Bengal School of Art, 1905'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Maqbool_Fida_Husain_painting.jpg',
                title: 'Untitled (Horses)',
                artist: 'M.F. Husain',
                period: 'Modern Indian Art, 20th century'
            },
        
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Bindu_by_S.H._Raza.jpg',
                title: 'Bindu',
                artist: 'S.H. Raza',
                period: 'Contemporary Indian Art, 1980s'
            },{
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Raja_Ravi_Varma_-_Mahabharata_-_Shakuntala.jpg/800px-Raja_Ravi_Varma_-_Mahabharata_-_Shakuntala.jpg',
            title: 'Shakuntala',
            artist: 'Raja Ravi Varma',
            period: 'Modern Indian Art, 1870'
        }, {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Jahangir_preferring_a_Sufi_shaikh_to_kings.jpg',
                title: 'Jahangir Preferring a Sufi Shaikh to Kings',
                artist: 'Bichitr',
                period: 'Mughal miniature, 1615–1620'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Pieta_vatican.jpg',
                title: 'Pietà',
                artist: 'Michelangelo',
                period: 'High Renaissance, 1498–1499'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Claude_Monet_-_Impression%2C_soleil_levant.jpg',
                title: 'Impression, Sunrise',
                artist: 'Claude Monet',
                period: 'Impressionism, 1872'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Frederic_Edwin_Church_-_The_Heart_of_the_Andes_-_Google_Art_Project.jpg',
                title: 'The Heart of the Andes',
                artist: 'Frederic Edwin Church',
                period: 'Hudson River School, 1859'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg',
                title: 'The Kiss',
                artist: 'Gustav Klimt',
                period: 'Symbolism, 1907–1908'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Andy_Warhol_1967.jpg',
                title: 'Marilyn Diptych',
                artist: 'Andy Warhol',
                period: 'Pop Art, 1962'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Farmers_by_Amrita_Sher-Gil.jpg',
                title: 'Village Scene',
                artist: 'Amrita Sher-Gil',
                period: 'Modern Indian Art, 1938'
            },
            {
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Frida_Kahlo_%281934%29_-_Lo_que_el_agua_me_dio.jpg',
                title: 'What the Water Gave Me',
                artist: 'Frida Kahlo',
                period: 'Surrealism, 1938'
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
