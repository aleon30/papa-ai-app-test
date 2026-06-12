// Elementos del DOM
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const chatDrawer = document.getElementById('chatDrawer');
const closeChatButton = document.getElementById('closeChatButton');

// Configuración
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:7071/api' : '/api';
const HISTORY_PREFIX = 'papita-ai-history';
let isLoading = false;
let currentUser = null;
let currentHistory = [];

// Event Listeners
sendButton.addEventListener('click', sendMessage);
closeChatButton.addEventListener('click', closeChatDrawer);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isLoading) {
        sendMessage();
    }
});

function openChatDrawer() {
    chatDrawer.classList.add('open');
    chatDrawer.setAttribute('aria-hidden', 'false');
}

function closeChatDrawer() {
    chatDrawer.classList.remove('open');
    chatDrawer.setAttribute('aria-hidden', 'true');
}

// Función para enviar mensaje
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || isLoading) return;
    
    const userMessage = {
        text: message,
        sender: 'user',
        isError: false,
        time: new Date().toISOString()
    };

    currentHistory.push(userMessage);
    saveHistory(currentHistory);

    openChatDrawer();
    addMessage(userMessage.text, userMessage.sender, userMessage.isError, new Date(userMessage.time));
    messageInput.value = '';
    isLoading = true;
    
    // Mostrar indicador de carga
    loadingIndicator.classList.add('active');
    
    try {
        // Enviar al servidor
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        const text = await response.text();
        let data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            data = {};
        }

        if (!response.ok) {
            throw new Error((data.error || text || 'Error en la respuesta del servidor') + ` (HTTP ${response.status})`);
        }

        const botResponse = data.response;
        const botMessage = {
            text: botResponse,
            sender: 'bot',
            isError: false,
            time: new Date().toISOString()
        };

        currentHistory.push(botMessage);
        saveHistory(currentHistory);

        addMessage(botMessage.text, botMessage.sender, botMessage.isError, new Date(botMessage.time));

    } catch (error) {
        console.error('Error:', error);
        addMessage(
            error.message || 'Lo siento, ocurrió un error al conectar con el servidor. Verifica que la API de Azure Static Web Apps esté disponible.',
            'bot',
            true
        );
    } finally {
        isLoading = false;
        loadingIndicator.classList.remove('active');
        messageInput.focus();
    }
}

// Función para agregar mensaje al chat
function addMessage(text, sender, isError = false, time = new Date()) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // Crear elemento de contenido
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    // Crear elemento de tiempo
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getFormattedTime(time);
    
    if (isError) {
        contentDiv.style.backgroundColor = '#fee';
        contentDiv.style.color = '#c00';
    }
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll al final
    scrollToBottom();
}

// Función para obtener la hora formateada
function getFormattedTime(date = new Date()) {
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para hacer scroll al final
function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 0);
}


function getHistoryKey() {
    const userId = currentUser?.userId || currentUser?.user_id || currentUser?.userDetails || 'guest';
    return `${HISTORY_PREFIX}:${userId}`;
}

function saveHistory(history) {
    localStorage.setItem(getHistoryKey(), JSON.stringify(history));
}

function loadHistory() {
    const savedHistory = JSON.parse(localStorage.getItem(getHistoryKey()) || '[]');
    currentHistory = Array.isArray(savedHistory) ? savedHistory : [];

    messagesContainer.innerHTML = '';

    if (currentHistory.length > 0) {
        currentHistory.forEach((message) => {
            addMessage(message.text, message.sender, message.isError, new Date(message.time));
        });
    } else {
        addMessage('¡Hola! Soy Papita, tu asistente de inteligencia artificial. Estoy aquí para ayudarte a detectar señales tempranas de burnout y apoyarte en tu bienestar. ¿Cómo te sientes hoy? 🥒', 'bot');
    }

    if (currentHistory.length > 0) {
        openChatDrawer();
    }
}

window.addEventListener('load', () => {
    messageInput.focus();
});

// Permitir que el input crezca dinámicamente (opcional)
messageInput.addEventListener('input', () => {
    // Aquí puedes agregar lógica para hacer crecer el input si lo deseas
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch((error) => {
            console.error('Service Worker registration failed:', error);
        });
    });
}
