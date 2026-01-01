// Global app utilities

// Format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleString('pt-BR');
}

// Get file icon SVG based on mime type - Modern icons with colors
function getFileIcon(mimeType, className = 'w-16 h-16') {
    if (mimeType.startsWith('image/')) {
        return `<svg class="${className} text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>`;
    } else if (mimeType.startsWith('video/')) {
        return `<svg class="${className} text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>`;
    } else if (mimeType.startsWith('audio/')) {
        return `<svg class="${className} text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
        </svg>`;
    } else if (mimeType.includes('pdf')) {
        return `<svg class="${className} text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>`;
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) {
        return `<svg class="${className} text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
        </svg>`;
    } else if (mimeType.includes('text') || mimeType.includes('document')) {
        return `<svg class="${className} text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>`;
    } else {
        return `<svg class="${className} text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>`;
    }
}

// Get folder icon SVG with custom color
function getFolderIcon(className = 'w-16 h-16', color = 'yellow-400') {
    // Map colors to Tailwind classes
    const colorMap = {
        'yellow-400': 'text-yellow-400',
        'blue-400': 'text-blue-400',
        'green-400': 'text-green-400',
        'purple-400': 'text-purple-400',
        'pink-400': 'text-pink-400',
        'red-400': 'text-red-400',
        'indigo-400': 'text-indigo-400',
        'cyan-400': 'text-cyan-400'
    };
    
    const colorClass = colorMap[color] || 'text-yellow-400';
    const iconClass = `${className} ${colorClass}`;
    
    return `<svg class="${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
    </svg>`;
}

// Sistema de detecção de inatividade (10 minutos)
(function() {
    'use strict';
    
    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos em milissegundos
    let inactivityTimer;
    let lastActivityTime = Date.now();
    
    // Eventos que indicam atividade do usuário
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Função para resetar o timer de inatividade
    function resetInactivityTimer() {
        lastActivityTime = Date.now();
        clearTimeout(inactivityTimer);
        
        inactivityTimer = setTimeout(() => {
            // Verificar se ainda está logado antes de fazer logout
            const sessionToken = getCookie('sessionToken');
            if (sessionToken) {
                // Fazer logout automático
                fetch('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                }).then(() => {
                    // Redirecionar para login
                    window.location.href = '/auth/login';
                }).catch(() => {
                    // Mesmo se falhar, redirecionar
                    window.location.href = '/auth/login';
                });
            }
        }, INACTIVITY_TIMEOUT);
    }
    
    // Função auxiliar para obter cookie
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    // Adicionar listeners para eventos de atividade
    activityEvents.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, { passive: true });
    });
    
    // Também verificar atividade em requisições fetch (para manter sessão ativa durante uso)
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        resetInactivityTimer();
        return originalFetch.apply(this, args);
    };
    
    // Inicializar o timer quando a página carregar
    if (getCookie('sessionToken')) {
        resetInactivityTimer();
    }
    
    // Resetar timer quando a página ganha foco
    window.addEventListener('focus', resetInactivityTimer);
    
    // Pausar timer quando a página perde foco (opcional - pode remover se quiser que continue contando)
    // window.addEventListener('blur', () => {
    //     clearTimeout(inactivityTimer);
    // });
})();

