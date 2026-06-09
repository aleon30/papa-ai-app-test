// Elementos del DOM
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const statusIndicator = document.getElementById('statusIndicator');

// Configuración
const API_URL = '/api';
let isLoading = false;

// Event Listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isLoading) {
        sendMessage();
    }
});

// Función para enviar mensaje
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || isLoading) return;
    
    // Agregar mensaje del usuario
    addMessage(message, 'user');
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
        
        // Agregar respuesta del bot
        addMessage(botResponse, 'bot');
        updateStatus(true);
        
    } catch (error) {
        console.error('Error:', error);
        addMessage(
            error.message || 'Lo siento, ocurrió un error al conectar con el servidor. Verifica que la API de Azure Static Web Apps esté disponible.',
            'bot',
            true
        );
        updateStatus(false);
    } finally {
        isLoading = false;
        loadingIndicator.classList.remove('active');
        messageInput.focus();
    }
}

// Función para agregar mensaje al chat
function addMessage(text, sender, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // Crear elemento de contenido
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    // Crear elemento de tiempo
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getFormattedTime();
    
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
function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString('es-ES', {
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

// Función para actualizar estado de conexión
function updateStatus(isConnected) {
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = statusIndicator.querySelector('.status-text');
    
    if (isConnected) {
        statusDot.style.background = '#4ade80';
        statusText.textContent = 'Conectado';
    } else {
        statusDot.style.background = '#ef4444';
        statusText.textContent = 'Error de conexión';
    }
}

// Verificar conexión al cargar
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            updateStatus(true);
        } else {
            updateStatus(false);
        }
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        updateStatus(false);
    }
    
    // Enfocar el input
    messageInput.focus();
});

// Permitir que el input crezca dinámicamente (opcional)
messageInput.addEventListener('input', () => {
    // Aquí puedes agregar lógica para hacer crecer el input si lo deseas
});
