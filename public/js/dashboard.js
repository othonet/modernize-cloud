let currentFolderId = null;
let files = [];
let folders = [];
let renameTargetType = null; // 'file' or 'folder'
let renameTargetId = null;
let changeColorTargetId = null;
let currentTab = 'myFiles'; // 'myFiles' or 'sharedFiles'
let shareUserFileId = null;

// Seleção múltipla
let selectedFiles = new Set();
let selectedFolders = new Set();
let selectionMode = false;

// Setup drag and drop listeners
function setupDragAndDrop() {
    const container = document.getElementById('filesContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;
    
    // Remove existing listeners if any (to avoid duplicates)
    container.removeEventListener('drop', handleDrop);
    container.removeEventListener('dragover', handleDragOver);
    container.removeEventListener('dragenter', handleDragEnter);
    container.removeEventListener('dragleave', handleDragLeave);
    
    // Add drag and drop listeners to container
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragenter', handleDragEnter);
    container.addEventListener('dragleave', handleDragLeave);
    
    // Also add to empty state if it exists
    if (emptyState) {
        emptyState.removeEventListener('drop', handleDrop);
        emptyState.removeEventListener('dragover', handleDragOver);
        emptyState.removeEventListener('dragenter', handleDragEnter);
        emptyState.removeEventListener('dragleave', handleDragLeave);
        
        emptyState.addEventListener('drop', handleDrop);
        emptyState.addEventListener('dragover', handleDragOver);
        emptyState.addEventListener('dragenter', handleDragEnter);
        emptyState.addEventListener('dragleave', handleDragLeave);
    }
}

// Load files on page load
document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
    setupSocketListeners();
    setupModalListeners();
    setupDragAndDrop();
});

// Load files
async function loadFiles(folderId = null) {
    if (currentTab === 'sharedFiles') {
        await loadSharedFiles();
        return;
    }
    
    currentFolderId = folderId;
    const search = document.getElementById('searchInput')?.value || '';
    
    try {
        const params = new URLSearchParams();
        if (folderId) params.append('folderId', folderId);
        if (search) params.append('search', search);
        
        const response = await fetch(`/api/files?${params}`, {
            credentials: 'include'
        });
        files = await response.json();
        
        const foldersResponse = await fetch(`/api/folders?${folderId ? `parentId=${folderId}` : ''}`, {
            credentials: 'include'
        });
        folders = await foldersResponse.json();
        
        renderFiles();
        updateBreadcrumb();
    } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
    }
}

// Load shared files
async function loadSharedFiles() {
    try {
        const response = await fetch('/api/user-shares/shared-with-me', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar arquivos compartilhados');
        }
        
        files = await response.json();
        folders = []; // Não há pastas em compartilhados
        
        renderFiles();
        updateBreadcrumb();
    } catch (error) {
        console.error('Erro ao carregar arquivos compartilhados:', error);
        showError('Erro ao carregar arquivos compartilhados');
    }
}

// Switch tab
window.switchTab = function(tab) {
    currentTab = tab;
    
    const myFilesTab = document.getElementById('myFilesTab');
    const sharedFilesTab = document.getElementById('sharedFilesTab');
    
    if (tab === 'myFiles') {
        myFilesTab.classList.add('text-blue-400', 'border-blue-400');
        myFilesTab.classList.remove('text-gray-400', 'border-transparent');
        sharedFilesTab.classList.remove('text-blue-400', 'border-blue-400');
        sharedFilesTab.classList.add('text-gray-400', 'border-transparent');
        currentFolderId = null;
        loadFiles();
    } else {
        sharedFilesTab.classList.add('text-blue-400', 'border-blue-400');
        sharedFilesTab.classList.remove('text-gray-400', 'border-transparent');
        myFilesTab.classList.remove('text-blue-400', 'border-blue-400');
        myFilesTab.classList.add('text-gray-400', 'border-transparent');
        loadSharedFiles();
    }
};

// Render files
function renderFiles() {
    const container = document.getElementById('filesContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (files.length === 0 && folders.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        // Ensure drag and drop works on empty state
        setupDragAndDrop();
        updateSelectionBar();
        return;
    }
    
    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    container.innerHTML = '';
    
    // Render folders
    folders.forEach(folder => {
        const folderCard = createFolderCard(folder);
        container.appendChild(folderCard);
    });
    
    // Render files
    files.forEach(file => {
        const fileCard = createFileCard(file);
        container.appendChild(fileCard);
    });
    
    // Re-setup drag and drop after rendering (in case container was recreated)
    setupDragAndDrop();
    updateSelectionBar();
    updateCheckboxes();
    updateCardStyles();
}

// Helper function to escape HTML and quotes
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Create folder card
function createFolderCard(folder) {
    const div = document.createElement('div');
    div.className = 'card cursor-pointer hover:bg-gray-700 transition-all hover:scale-105 hover:shadow-xl relative group';
    div.setAttribute('data-folder-id', folder.id);
    
    const folderColor = folder.color || 'yellow-400';
    const safeFolderName = escapeHtml(folder.name);
    const safeFolderId = escapeHtml(folder.id);
    const isSelected = selectedFolders.has(folder.id);
    
    // Get counts from folder data
    const filesCount = folder._count?.files || folder._aggr_count_files || 0;
    const foldersCount = folder._count?.children || folder._aggr_count_children || 0;
    
    // Format count text
    let countText = '';
    if (filesCount > 0 && foldersCount > 0) {
        countText = `${filesCount} arquivo${filesCount !== 1 ? 's' : ''}, ${foldersCount} pasta${foldersCount !== 1 ? 's' : ''}`;
    } else if (filesCount > 0) {
        countText = `${filesCount} arquivo${filesCount !== 1 ? 's' : ''}`;
    } else if (foldersCount > 0) {
        countText = `${foldersCount} pasta${foldersCount !== 1 ? 's' : ''}`;
    } else {
        countText = 'Vazia';
    }
    
    div.innerHTML = `
        <div class="absolute top-2 left-2 z-10 ${isSelected ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity">
            <input type="checkbox" 
                   class="folder-checkbox w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer" 
                   data-folder-id="${safeFolderId}"
                   ${isSelected ? 'checked' : ''}
                   onclick="event.stopPropagation(); toggleFolderSelection('${safeFolderId}')">
        </div>
        <div class="text-center" onclick="if(!event.target.closest('.folder-checkbox') && !event.target.closest('button')) { if(selectionMode) { toggleFolderSelection('${safeFolderId}'); } else { navigateToFolder('${safeFolderId}'); } }">
            <div class="flex justify-center mb-3">${getFolderIcon('w-16 h-16', folderColor)}</div>
            <h3 class="font-semibold text-white truncate" title="${safeFolderName}">${safeFolderName}</h3>
            <p class="text-xs text-gray-400 mt-1">${countText}</p>
        </div>
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            <button onclick="event.stopPropagation(); showMoveCopyModal('folder', '${safeFolderId}', '${safeFolderName}')" 
                    class="p-1.5 bg-gray-800 hover:bg-purple-600 rounded-lg transition-colors" 
                    title="Mover/Copiar">
                <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                </svg>
            </button>
            <button onclick="event.stopPropagation(); openChangeColorModal('${safeFolderId}', '${folderColor}')" 
                    class="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors" 
                    title="Alterar Cor">
                <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                </svg>
            </button>
            <button onclick="event.stopPropagation(); deleteFolder('${safeFolderId}')" 
                    class="p-1.5 bg-gray-800 hover:bg-red-600 rounded-lg transition-colors" 
                    title="Deletar">
                <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
    `;
    
    if (isSelected) {
        div.classList.add('ring-2', 'ring-blue-500', 'bg-gray-700');
    }
    
    return div;
}

// Check if file is a text file (defined before isMediaFile to avoid reference error)
function isTextFile(mimeType, fileName) {
    if (!mimeType && !fileName) return false;
    const textMimeTypes = [
        'text/plain', 'text/html', 'text/css', 'text/javascript', 'text/xml',
        'application/json', 'application/xml', 'text/markdown', 'text/csv'
    ];
    
    const textExtensions = ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.sh', '.bat', '.yaml', '.yml', '.log', '.csv', '.sql', '.vue', '.svelte'];
    
    if (mimeType && textMimeTypes.includes(mimeType)) return true;
    
    if (fileName) {
        const lowerFileName = fileName.toLowerCase();
        return textExtensions.some(ext => lowerFileName.endsWith(ext));
    }
    
    return false;
}

// Check if file is a media file (image, video, audio, PDF, text)
function isMediaFile(mimeType, fileName) {
    if (!mimeType && !fileName) return false;
    
    // Check by mimeType first
    if (mimeType) {
        if (mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return true;
        if (mimeType === 'application/pdf') return true;
        if (isTextFile(mimeType, fileName)) return true;
    }
    
    // Check by file extension as fallback
    if (fileName) {
        const lowerFileName = fileName.toLowerCase();
        if (lowerFileName.endsWith('.pdf')) return true;
        if (isTextFile(mimeType, fileName)) return true;
    }
    
    return false;
}


// Create file card
function createFileCard(file) {
    const div = document.createElement('div');
    div.className = 'card file-card hover:bg-gray-700 transition-all hover:scale-105 sm:hover:scale-105 hover:shadow-xl relative group';
    div.draggable = true;
    div.setAttribute('data-file-id', file.id);
    div.setAttribute('data-file-name', file.originalName);
    
        const safeFileName = escapeHtml(file.originalName);
        const safeFileId = escapeHtml(file.id);
        const isMedia = isMediaFile(file.mimeType, file.originalName);
        const isSelected = selectedFiles.has(file.id);
        const shareId = file.shareId ? escapeHtml(file.shareId) : null;
        
        // Se for arquivo compartilhado, passar shareId para o viewer
        const mediaViewerParams = shareId 
            ? `'${safeFileId}', '${escapeHtml(file.originalName)}', '${escapeHtml(file.mimeType)}', '${shareId}'`
            : `'${safeFileId}', '${escapeHtml(file.originalName)}', '${escapeHtml(file.mimeType)}'`;
        
        const clickAction = isMedia 
            ? `openMediaViewer(${mediaViewerParams})` 
            : `downloadFile('${safeFileId}'${shareId ? `, '${shareId}'` : ''})`;
        
        // Show shared by info if it's a shared file
        const sharedByInfo = file.sharedBy ? `<p class="text-[10px] sm:text-xs text-blue-400 mt-1">Compartilhado por @${escapeHtml(file.sharedBy.username)}</p>` : '';
    
    div.innerHTML = `
        <div class="absolute top-2 left-2 z-10 ${isSelected ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity">
            <input type="checkbox" 
                   class="file-checkbox w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer" 
                   data-file-id="${safeFileId}"
                   ${isSelected ? 'checked' : ''}
                   onclick="event.stopPropagation(); toggleFileSelection('${safeFileId}')">
        </div>
        <div class="text-center mb-2 sm:mb-3 cursor-pointer" onclick="if(!event.target.closest('.file-checkbox') && !event.target.closest('button')) { if(selectionMode) { toggleFileSelection('${safeFileId}'); } else { ${clickAction}; } }">
            <div class="flex justify-center">${getFileIcon(file.mimeType, 'w-12 h-12 sm:w-16 sm:h-16')}</div>
        </div>
        <h3 class="font-semibold text-white truncate mb-1 text-xs sm:text-sm" title="${safeFileName}">${safeFileName}</h3>
        <p class="text-[10px] sm:text-xs text-gray-400">${formatBytes(Number(file.size))}</p>
        ${sharedByInfo}
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col sm:flex-row gap-1">
            ${shareId ? '' : `
            <button onclick="event.stopPropagation(); showMoveCopyModal('file', '${safeFileId}', '${escapeHtml(file.originalName)}')" 
                    class="p-1.5 bg-gray-800 hover:bg-purple-600 rounded-lg transition-colors" 
                    title="Mover/Copiar">
                <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                </svg>
            </button>
            <button onclick="event.stopPropagation(); showShareUserModal('${safeFileId}', '${escapeHtml(file.originalName)}')" 
                    class="p-1.5 bg-gray-800 hover:bg-blue-600 rounded-lg transition-colors" 
                    title="Compartilhar com usuário">
                <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
            </button>
            `}
            <button onclick="event.stopPropagation(); deleteFile('${safeFileId}'${shareId ? `, '${shareId}'` : ''})" 
                    class="p-1.5 bg-gray-800 hover:bg-red-600 rounded-lg transition-colors" 
                    title="${shareId ? 'Remover compartilhamento' : 'Deletar'}">
                <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
        <!-- Menu de ações mobile (long press) -->
        <div id="fileMenu-${safeFileId}" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center" onclick="if(event.target === this) closeFileMenu('${safeFileId}')">
            <div class="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:w-auto sm:min-w-[300px] border-t sm:border border-gray-700 p-4">
                <h3 class="text-white font-semibold mb-4 text-center sm:text-left">${safeFileName}</h3>
                <div class="space-y-2">
                    <button onclick="closeFileMenu('${safeFileId}'); ${clickAction}" class="w-full btn-primary flex items-center justify-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        ${isMedia ? 'Visualizar' : 'Baixar'}
                    </button>
                    ${shareId ? '' : `
                    <button onclick="closeFileMenu('${safeFileId}'); shareFile('${safeFileId}', '${escapeHtml(file.originalName)}')" class="w-full btn-secondary flex items-center justify-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                        </svg>
                        Compartilhar
                    </button>
                    <button onclick="closeFileMenu('${safeFileId}'); showMoveCopyModal('file', '${safeFileId}', '${escapeHtml(file.originalName)}')" class="w-full btn-secondary flex items-center justify-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                        </svg>
                        Mover/Copiar
                    </button>
                    <button onclick="closeFileMenu('${safeFileId}'); showRenameModal('file', '${safeFileId}', '${escapeHtml(file.originalName)}')" class="w-full btn-secondary flex items-center justify-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Renomear
                    </button>
                    `}
                    <button onclick="closeFileMenu('${safeFileId}'); deleteFile('${safeFileId}'${shareId ? `, '${shareId}'` : ''})" class="w-full btn-danger flex items-center justify-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Deletar
                    </button>
                    <button onclick="closeFileMenu('${safeFileId}')" class="w-full btn-secondary flex items-center justify-center mt-2">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    if (isSelected) {
        div.classList.add('ring-2', 'ring-blue-500', 'bg-gray-700');
    }
    
    // Add drag event listeners
    div.addEventListener('dragstart', handleFileDragStart);
    div.addEventListener('dragend', handleFileDragEnd);
    
    // Long press para menu mobile
    let longPressTimer;
    div.addEventListener('touchstart', function(e) {
        longPressTimer = setTimeout(() => {
            e.preventDefault();
            openFileMenu(safeFileId);
            if (window.CapacitorBridge) {
                window.CapacitorBridge.hapticFeedback('medium');
            }
        }, 500);
    }, { passive: true });
    
    div.addEventListener('touchend', function() {
        clearTimeout(longPressTimer);
    }, { passive: true });
    
    div.addEventListener('touchmove', function() {
        clearTimeout(longPressTimer);
    }, { passive: true });
    
    return div;
}

// Menu de ações mobile
function openFileMenu(fileId) {
    const menu = document.getElementById(`fileMenu-${fileId}`);
    if (menu) {
        menu.classList.remove('hidden');
    }
}

function closeFileMenu(fileId) {
    const menu = document.getElementById(`fileMenu-${fileId}`);
    if (menu) {
        menu.classList.add('hidden');
    }
}

// Upload progress tracking
const uploadProgress = new Map();

// Create upload progress item
function createUploadProgressItem(fileId, fileName, fileSize) {
    const container = document.getElementById('uploadProgressContainer');
    if (!container) return null;
    
    // Show container
    container.style.display = 'block';
    
    const item = document.createElement('div');
    item.id = `upload-${fileId}`;
    item.className = 'bg-gray-800 rounded-lg p-4 border border-gray-700';
    
    const safeFileName = escapeHtml(fileName);
    const safeFileId = escapeHtml(fileId);
    
    item.innerHTML = `
        <div class="flex items-center justify-between mb-2">
            <div class="flex-1 min-w-0">
                <p class="text-white font-semibold truncate" title="${safeFileName}">${safeFileName}</p>
                <p class="text-gray-400 text-sm">${formatBytes(fileSize)}</p>
            </div>
            <button onclick="cancelUpload('${safeFileId}')" class="ml-2 text-gray-400 hover:text-red-400 transition-colors" title="Cancelar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div id="progress-bar-${safeFileId}" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-400">
            <span id="progress-text-${safeFileId}">0%</span>
            <span id="progress-time-${safeFileId}">Iniciando...</span>
        </div>
    `;
    
    container.appendChild(item);
    return item;
}

// Update upload progress
function updateUploadProgress(fileId, loaded, total, startTime) {
    const progress = (loaded / total) * 100;
    const progressBar = document.getElementById(`progress-bar-${fileId}`);
    const progressText = document.getElementById(`progress-text-${fileId}`);
    const progressTime = document.getElementById(`progress-time-${fileId}`);
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${Math.round(progress)}%`;
    }
    
    if (progressTime && startTime) {
        const elapsed = (Date.now() - startTime) / 1000; // seconds
        const speed = loaded / elapsed; // bytes per second
        const remaining = (total - loaded) / speed; // seconds
        
        const elapsedStr = formatTime(elapsed);
        const remainingStr = remaining > 0 && remaining < 3600 ? formatTime(remaining) : '';
        
        if (remainingStr) {
            progressTime.textContent = `${elapsedStr} • ${remainingStr} restante`;
        } else {
            progressTime.textContent = elapsedStr;
        }
    }
}

// Format time in seconds to readable string
function formatTime(seconds) {
    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    }
}

// Remove upload progress item
function removeUploadProgressItem(fileId) {
    const item = document.getElementById(`upload-${fileId}`);
    if (item) {
        item.remove();
    }
    uploadProgress.delete(fileId);
    
    // Hide container if no uploads
    const container = document.getElementById('uploadProgressContainer');
    if (container && container.children.length === 0) {
        container.style.display = 'none';
    }
}

// Cancel upload
window.cancelUpload = function(fileId) {
    const xhr = uploadProgress.get(fileId);
    if (xhr) {
        xhr.abort();
        removeUploadProgressItem(fileId);
    }
};

// Upload file with progress
function uploadFileWithProgress(file, folderId = null) {
    return new Promise((resolve, reject) => {
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        
        // Create progress item
        createUploadProgressItem(fileId, file.name, file.size);
        
        const formData = new FormData();
        formData.append('file', file);
        if (folderId) {
            formData.append('folderId', folderId);
        }
        
        const xhr = new XMLHttpRequest();
        uploadProgress.set(fileId, xhr);
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                updateUploadProgress(fileId, e.loaded, e.total, startTime);
            }
        });
        
        // Handle completion
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                // Update to 100%
                updateUploadProgress(fileId, file.size, file.size, startTime);
                
                // Show success briefly before removing
                setTimeout(() => {
                    removeUploadProgressItem(fileId);
                    resolve(JSON.parse(xhr.responseText));
                }, 500);
            } else {
                removeUploadProgressItem(fileId);
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.error || 'Erro ao fazer upload'));
                } catch {
                    reject(new Error('Erro ao fazer upload'));
                }
            }
        });
        
        // Handle errors
        xhr.addEventListener('error', () => {
            removeUploadProgressItem(fileId);
            reject(new Error('Erro de conexão ao fazer upload'));
        });
        
        xhr.addEventListener('abort', () => {
            removeUploadProgressItem(fileId);
            reject(new Error('Upload cancelado'));
        });
        
        // Start upload
        xhr.open('POST', '/api/files/upload');
        xhr.send(formData);
    });
}

// Handle file upload
async function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    
    // Upload all files in parallel
    const uploadPromises = files.map(file => 
        uploadFileWithProgress(file, currentFolderId)
            .then(() => {
                showSuccess(`Arquivo "${file.name}" enviado com sucesso!`);
            })
            .catch((error) => {
                showError(`Erro ao fazer upload de "${file.name}": ${error.message}`);
            })
    );
    
    // Wait for all uploads to complete
    await Promise.allSettled(uploadPromises);
    
    // Reload files
    await loadFiles(currentFolderId);
    
    event.target.value = '';
}

// Mobile Upload Functions - Funciona em mobile (Capacitor) e desktop (fallback)
window.handleCameraUpload = async function() {
    try {
        // Feedback háptico (apenas mobile)
        if (window.CapacitorBridge) {
            await window.CapacitorBridge.hapticFeedback('light');
        }
        
        // Tentar usar câmera nativa (mobile) ou fallback (desktop)
        let imageData = null;
        if (window.CapacitorBridge && window.CapacitorBridge.isNativeApp) {
            imageData = await window.CapacitorBridge.takePicture();
        } else {
            // Fallback para desktop: usar input file
            imageData = await window.CapacitorBridge?.webFilePicker() || await webFilePickerFallback();
        }
        
        if (!imageData) return; // Usuário cancelou
        
        // Converter para File object para upload
        const file = await base64ToFile(imageData.base64String || imageData, 'camera-photo.jpg', 'image/jpeg');
        await uploadSingleFile(file);
        
        // Feedback de sucesso
        if (window.CapacitorBridge) {
            await window.CapacitorBridge.hapticFeedback('success');
        }
    } catch (error) {
        console.error('Erro ao fazer upload da câmera:', error);
        showError('Erro ao fazer upload da foto');
    }
};

window.handleGalleryUpload = async function() {
    try {
        // Feedback háptico (apenas mobile)
        if (window.CapacitorBridge) {
            await window.CapacitorBridge.hapticFeedback('light');
        }
        
        // Tentar usar galeria nativa (mobile) ou fallback (desktop)
        let imageData = null;
        if (window.CapacitorBridge && window.CapacitorBridge.isNativeApp) {
            imageData = await window.CapacitorBridge.pickFromGallery();
        } else {
            // Fallback para desktop: usar input file
            imageData = await window.CapacitorBridge?.webFilePicker() || await webFilePickerFallback();
        }
        
        if (!imageData) return; // Usuário cancelou
        
        // Converter para File object para upload
        const file = await base64ToFile(imageData.base64String || imageData, 'gallery-image.jpg', imageData.format || 'image/jpeg');
        await uploadSingleFile(file);
        
        // Feedback de sucesso
        if (window.CapacitorBridge) {
            await window.CapacitorBridge.hapticFeedback('success');
        }
    } catch (error) {
        console.error('Erro ao fazer upload da galeria:', error);
        showError('Erro ao fazer upload da imagem');
    }
};

// Helper: Converter base64 para File
async function base64ToFile(base64, filename, mimeType) {
    // Se já for um File, retornar
    if (base64 instanceof File) return base64;
    
    // Converter base64 para blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    // Converter blob para File
    return new File([blob], filename, { type: mimeType });
}

// Helper: Fallback para seleção de arquivo (web)
function webFilePickerFallback() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    resolve({
                        base64String: event.target.result.split(',')[1],
                        format: file.type,
                        webPath: event.target.result
                    });
                };
                reader.readAsDataURL(file);
            } else {
                resolve(null);
            }
        };
        input.click();
    });
}

// Helper: Upload de arquivo único
async function uploadSingleFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (currentFolderId) {
        formData.append('folderId', currentFolderId);
    }
    
    const fileId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const progressItem = createUploadProgressItem(fileId, file.name, file.size);
    const startTime = Date.now();
    
    uploadProgress.set(fileId, { xhr: null, cancelled: false });
    
    try {
        const xhr = new XMLHttpRequest();
        uploadProgress.get(fileId).xhr = xhr;
        
        // Progress tracking
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && !uploadProgress.get(fileId).cancelled) {
                updateUploadProgress(fileId, e.loaded, e.total, startTime);
            }
        });
        
        // Complete
        xhr.addEventListener('load', async () => {
            if (xhr.status === 200) {
                const result = JSON.parse(xhr.responseText);
                removeUploadProgressItem(fileId);
                uploadProgress.delete(fileId);
                
                // O Socket.IO deve atualizar automaticamente, mas fazemos um fallback
                // Aguardar um pouco para o evento Socket.IO chegar primeiro
                setTimeout(async () => {
                await loadFiles(currentFolderId);
                }, 100);
                
                showSuccess('Arquivo enviado com sucesso!');
            } else {
                throw new Error('Erro no upload');
            }
        });
        
        // Error
        xhr.addEventListener('error', () => {
            removeUploadProgressItem(fileId);
            uploadProgress.delete(fileId);
            showError('Erro ao enviar arquivo');
        });
        
        xhr.open('POST', '/api/files/upload');
        xhr.send(formData);
    } catch (error) {
        removeUploadProgressItem(fileId);
        uploadProgress.delete(fileId);
        throw error;
    }
}

// Download file - Make it globally available
window.downloadFile = async function(fileId, shareId = null) {
    window.open(`/api/files/${fileId}/download`, '_blank');
};

// Media Viewer Functions
let currentMediaFileId = null;
let currentMediaFileName = null;

window.openMediaViewer = function(fileId, fileName, mimeType, shareId = null) {
    currentMediaFileId = fileId;
    currentMediaFileName = fileName;
    
    const modal = document.getElementById('mediaViewerModal');
    const container = document.getElementById('mediaContainer');
    const fileNameElement = document.getElementById('mediaFileName');
    
    if (!modal || !container || !fileNameElement) return;
    
    fileNameElement.textContent = fileName;
    container.innerHTML = '<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>';
    
    // Carregar mídia normalmente
    loadMediaContent(fileId, fileName, mimeType, container, fileNameElement);
    
    modal.classList.remove('hidden');
    
    // Close on Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeMediaViewer();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
};

// Load media content
function loadMediaContent(fileId, fileName, mimeType, container, fileNameElement) {
    if (!container) {
        console.error('Container não encontrado');
        return;
    }
    
    const downloadUrl = `/api/files/${fileId}/download`;
    
    loadMediaByType(mimeType, fileName, downloadUrl, container);
}

// Load media by type
function loadMediaByType(mimeType, fileName, downloadUrl, container) {
    
    if (mimeType.startsWith('image/')) {
        // Image viewer
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        img.src = downloadUrl;
        img.alt = fileName;
        img.className = 'max-w-full max-h-[85vh] object-contain mx-auto';
        img.onerror = function() {
            // Tentar novamente sem credentials se falhar
            console.error('Erro ao carregar imagem, tentando método alternativo...');
            const img2 = document.createElement('img');
            img2.src = downloadUrl + '&_=' + Date.now();
            img2.alt = fileName;
            img2.className = 'max-w-full max-h-[85vh] object-contain mx-auto';
            img2.onerror = function() {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <p class="text-white text-xl mb-4">Erro ao carregar imagem</p>
                        <a href="${downloadUrl}" target="_blank" class="btn-primary inline-flex items-center">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                            Baixar arquivo
                        </a>
                    </div>
                `;
            };
            container.innerHTML = '';
            container.appendChild(img2);
        };
        container.innerHTML = '';
        container.appendChild(img);
    } else if (mimeType.startsWith('video/')) {
        // Video player
        const video = document.createElement('video');
        video.src = downloadUrl;
        video.controls = true;
        video.className = 'max-w-full max-h-[85vh] mx-auto';
        video.onerror = function() {
            container.innerHTML = '<p class="text-white text-xl text-center">Erro ao carregar vídeo</p>';
        };
        container.innerHTML = '';
        container.appendChild(video);
    } else if (mimeType.startsWith('audio/')) {
        // Audio player
        const audioContainer = document.createElement('div');
        audioContainer.className = 'w-full max-w-2xl bg-gray-800 rounded-lg p-8 mx-auto';
        
        const audio = document.createElement('audio');
        audio.src = downloadUrl;
        audio.controls = true;
        audio.className = 'w-full';
        audio.onerror = function() {
            audioContainer.innerHTML = '<p class="text-white text-xl text-center">Erro ao carregar áudio</p>';
        };
        
        const audioInfo = document.createElement('div');
        audioInfo.className = 'text-center mt-4';
        const fileNamePara = document.createElement('p');
        fileNamePara.className = 'text-white text-lg font-semibold';
        fileNamePara.textContent = fileName;
        const playerLabel = document.createElement('p');
        playerLabel.className = 'text-gray-400 text-sm mt-2';
        playerLabel.textContent = 'Player de áudio';
        audioInfo.appendChild(fileNamePara);
        audioInfo.appendChild(playerLabel);
        
        audioContainer.appendChild(audio);
        audioContainer.appendChild(audioInfo);
        container.innerHTML = '';
        container.appendChild(audioContainer);
    } else if (mimeType === 'application/pdf' || (fileName && fileName.toLowerCase().endsWith('.pdf'))) {
        // PDF viewer
        const pdfContainer = document.createElement('div');
        pdfContainer.className = 'w-full h-[85vh] bg-gray-900 rounded-lg overflow-hidden';
        
        const iframe = document.createElement('iframe');
        iframe.src = downloadUrl + '#toolbar=0';
        iframe.className = 'w-full h-full border-0';
        iframe.onerror = function() {
            pdfContainer.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-white text-xl">Erro ao carregar PDF. <a href="' + downloadUrl + '" target="_blank" class="text-blue-400 underline">Baixar arquivo</a></p></div>';
        };
        
        pdfContainer.appendChild(iframe);
        container.innerHTML = '';
        container.appendChild(pdfContainer);
    } else if (isTextFile(mimeType, fileName)) {
        // Text file viewer
        loadTextFilePreview(downloadUrl, fileName, container);
    } else {
        container.innerHTML = `
            <div class="text-center py-12">
                <svg class="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-white text-xl mb-4">Preview não disponível para este tipo de arquivo</p>
                <a href="${downloadUrl}" target="_blank" class="btn-primary inline-flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Baixar arquivo
                </a>
            </div>
        `;
    }
}


// Load text file preview
async function loadTextFilePreview(url, fileName, container) {
    try {
        const response = await fetch(url, { credentials: 'include' });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar arquivo');
        }
        
        const text = await response.text();
        
        const textContainer = document.createElement('div');
        textContainer.className = 'w-full h-[85vh] bg-gray-900 rounded-lg overflow-hidden flex flex-col';
        
        // Header
        const header = document.createElement('div');
        header.className = 'bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'flex items-center';
        const icon = document.createElement('svg');
        icon.className = 'w-5 h-5 text-gray-400 mr-2';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>';
        fileInfo.appendChild(icon);
        const fileNameSpan = document.createElement('span');
        fileNameSpan.className = 'text-white text-sm font-semibold';
        fileNameSpan.textContent = fileName;
        fileInfo.appendChild(fileNameSpan);
        
        const downloadBtn = document.createElement('a');
        downloadBtn.href = url;
        downloadBtn.target = '_blank';
        downloadBtn.className = 'text-blue-400 hover:text-blue-300 text-sm flex items-center';
        downloadBtn.innerHTML = `
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Baixar
        `;
        
        header.appendChild(fileInfo);
        header.appendChild(downloadBtn);
        
        // Text area
        const textArea = document.createElement('pre');
        textArea.className = 'flex-1 overflow-auto p-4 text-sm text-gray-300 font-mono';
        textArea.style.whiteSpace = 'pre-wrap';
        textArea.style.wordBreak = 'break-word';
        textArea.textContent = text;
        
        // Line numbers (opcional, pode ser adicionado depois)
        
        textContainer.appendChild(header);
        textContainer.appendChild(textArea);
        
        container.innerHTML = '';
        container.appendChild(textContainer);
    } catch (error) {
        console.error('Erro ao carregar preview de texto:', error);
        container.innerHTML = `
            <div class="text-center py-12">
                <p class="text-white text-xl mb-4">Erro ao carregar preview</p>
                <a href="${url}" target="_blank" class="btn-primary inline-flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Baixar arquivo
                </a>
            </div>
        `;
    }
}

window.closeMediaViewer = function() {
    const modal = document.getElementById('mediaViewerModal');
    if (modal) {
        modal.classList.add('hidden');
        const container = document.getElementById('mediaContainer');
        if (container) {
            container.innerHTML = '';
        }
    }
    currentMediaFileId = null;
    currentMediaFileName = null;
};

window.downloadCurrentMedia = function() {
    if (currentMediaFileId) {
        downloadFile(currentMediaFileId);
    }
};

// Delete file - Make it globally available
window.deleteFile = async function(fileId, shareId = null) {
    console.log('🗑️ Tentando deletar arquivo:', fileId, shareId ? '(compartilhado)' : '');
    
    if (!fileId) {
        console.error('❌ ID do arquivo não fornecido');
        showError('Erro: ID do arquivo não fornecido');
        return;
    }
    
    // Se for arquivo compartilhado, encontrar o shareId se não foi fornecido
    if (currentTab === 'sharedFiles' && !shareId) {
        const file = files.find(f => f.id === fileId);
        if (file && file.shareId) {
            shareId = file.shareId;
        }
    }
    
    const isSharedFile = currentTab === 'sharedFiles' && shareId;
    const confirmMessage = isSharedFile 
        ? 'Tem certeza que deseja remover este arquivo compartilhado?'
        : 'Tem certeza que deseja deletar este arquivo?';
    
    showConfirm(
        confirmMessage,
        async () => {
            console.log('✅ Confirmação recebida, deletando arquivo:', fileId);
            try {
                let response;
                
                if (isSharedFile) {
                    // Deletar compartilhamento para arquivos compartilhados
                    response = await fetch(`/api/user-shares/files/${fileId}/share-with-user/${shareId}`, {
                        method: 'DELETE',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                } else {
                    // Deletar arquivo normalmente
                    response = await fetch(`/api/files/${fileId}`, {
                        method: 'DELETE',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }
                
                console.log('📡 Resposta do servidor:', response.status, response.statusText);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ ' + (isSharedFile ? 'Compartilhamento removido' : 'Arquivo deletado') + ' com sucesso:', result);
                    showSuccess(isSharedFile ? 'Arquivo compartilhado removido com sucesso!' : 'Arquivo deletado com sucesso!');
                    // O Socket.IO atualizará automaticamente via evento file:deleted
                    // Para arquivos compartilhados, atualizar imediatamente já que não há evento Socket.IO
                    if (isSharedFile && currentTab === 'sharedFiles') {
                        await loadSharedFiles();
                    }
                } else {
                    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                    console.error('❌ Erro ao deletar arquivo:', error);
                    showError(error.error || 'Erro ao deletar arquivo');
                }
            } catch (error) {
                console.error('❌ Erro ao deletar arquivo:', error);
                showError('Erro ao deletar arquivo: ' + error.message);
            }
        },
        () => {
            console.log('❌ Deleção cancelada pelo usuário');
        }
    );
};

// Navigate to folder - Make it globally available
window.navigateToFolder = function(folderId) {
    currentFolderId = folderId;
    deselectAll(); // Limpar seleção ao navegar
    loadFiles(folderId);
};

// Search files
function searchFiles() {
    const search = document.getElementById('searchInput').value;
    loadFiles(currentFolderId);
}

// Create folder
function showCreateFolderModal() {
    document.getElementById('folderModal').classList.remove('hidden');
    // Initialize color selection
    selectFolderColor('yellow-400');
}

function closeFolderModal() {
    document.getElementById('folderModal').classList.add('hidden');
    document.getElementById('folderName').value = '';
    document.getElementById('folderColor').value = 'yellow-400';
    // Reset color selection
    document.querySelectorAll('.folder-color-btn').forEach(btn => {
        btn.classList.remove('border-blue-500', 'ring-2', 'ring-blue-500');
        btn.classList.add('border-transparent');
    });
    // Select default color
    const defaultBtn = document.querySelector('[data-color="yellow-400"]');
    if (defaultBtn) {
        defaultBtn.classList.remove('border-transparent');
        defaultBtn.classList.add('border-blue-500', 'ring-2', 'ring-blue-500');
    }
}

function selectFolderColor(color) {
    document.getElementById('folderColor').value = color;
    
    // Update visual selection
    document.querySelectorAll('.folder-color-btn').forEach(btn => {
        btn.classList.remove('border-blue-500', 'ring-2', 'ring-blue-500');
        btn.classList.add('border-transparent');
    });
    
    const selectedBtn = document.querySelector(`[data-color="${color}"]`);
    if (selectedBtn) {
        selectedBtn.classList.remove('border-transparent');
        selectedBtn.classList.add('border-blue-500', 'ring-2', 'ring-blue-500');
    }
}

async function createFolder() {
    const name = document.getElementById('folderName').value.trim();
    const color = document.getElementById('folderColor').value || 'yellow-400';
    
    if (!name) {
        showError('Digite um nome para a pasta');
        return;
    }
    
    try {
        const response = await fetch('/api/folders', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                parentId: currentFolderId,
                color
            })
        });
        
        if (response.ok) {
            closeFolderModal();
            showSuccess('Pasta criada com sucesso!');
            // O Socket.IO atualizará automaticamente via evento folder:created
        } else {
            const error = await response.json();
            showError(error.error || 'Erro ao criar pasta');
        }
    } catch (error) {
        console.error('Erro ao criar pasta:', error);
        showError('Erro ao criar pasta');
    }
}

// Update breadcrumb
async function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    
        if (!currentFolderId) {
        breadcrumb.innerHTML = `
            <button onclick="navigateToFolder(null)" class="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                <span>Início</span>
            </button>
        `;
        return;
    }
    
    try {
        const response = await fetch(`/api/folders/breadcrumb/${currentFolderId}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.breadcrumbPath && data.breadcrumbPath.length > 0) {
            let breadcrumbHTML = '';
            
            // Home button
            breadcrumbHTML += `
                <button onclick="navigateToFolder(null)" class="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors font-medium">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    <span>Início</span>
                </button>
            `;
            
            // Breadcrumb path
            data.breadcrumbPath.forEach((folder, index) => {
                const isLast = index === data.breadcrumbPath.length - 1;
                const folderColor = folder.color || 'yellow-400';
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
                const colorClass = colorMap[folderColor] || 'text-yellow-400';
                const textClass = isLast ? 'text-white font-semibold' : `${colorClass} hover:text-white`;
                
                breadcrumbHTML += `
                    <span class="text-gray-500 mx-1">/</span>
                    <button onclick="navigateToFolder('${folder.id}')" 
                            class="flex items-center space-x-1 ${textClass} transition-colors">
                        ${getFolderIcon('w-4 h-4', folderColor)}
                        <span>${escapeHtml(folder.name)}</span>
                    </button>
                `;
            });
            
            breadcrumb.innerHTML = breadcrumbHTML;
        } else {
            // Fallback if no breadcrumb path
            breadcrumb.innerHTML = `
                <button onclick="navigateToFolder(null)" class="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors font-medium">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    <span>Início</span>
                </button>
            `;
        }
    } catch (error) {
        console.error('Erro ao atualizar breadcrumb:', error);
        // Fallback
        breadcrumb.innerHTML = `
            <button onclick="navigateToFolder(null)" class="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                <span>Início</span>
            </button>
        `;
    }
}

// Modal setup
function setupModalListeners() {
    // Close modals on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeRenameModal();
            closeChangeColorModal();
        }
    });
}

// Open rename modal - Make it globally available
window.openRenameModal = function(type, id, currentName) {
    renameTargetType = type;
    renameTargetId = id;
    
    const title = type === 'folder' ? 'Renomear Pasta' : 'Renomear Arquivo';
    const renameTitle = document.getElementById('renameTitle');
    const renameInput = document.getElementById('renameInput');
    const renameModal = document.getElementById('renameModal');
    
    if (!renameTitle || !renameInput || !renameModal) {
        console.error('Rename modal elements not found');
        showError('Erro ao abrir modal de renomear');
        return;
    }
    
    renameTitle.textContent = title;
    renameInput.value = currentName || '';
    renameModal.classList.remove('hidden');
    renameInput.focus();
    renameInput.select();
};

// Open change color modal - Make it globally available
window.openChangeColorModal = function(folderId, currentColor) {
    changeColorTargetId = folderId;
    
    const editFolderColor = document.getElementById('editFolderColor');
    const changeColorModal = document.getElementById('changeColorModal');
    
    if (!editFolderColor || !changeColorModal) {
        console.error('Change color modal elements not found');
        showError('Erro ao abrir modal de alterar cor');
        return;
    }
    
    editFolderColor.value = currentColor || 'yellow-400';
    selectFolderColorForEdit(currentColor || 'yellow-400');
    changeColorModal.classList.remove('hidden');
};

// Rename functions - Make globally available
window.closeRenameModal = function() {
    document.getElementById('renameModal').classList.add('hidden');
    document.getElementById('renameInput').value = '';
    renameTargetType = null;
    renameTargetId = null;
}

// Make confirmRename globally available
window.confirmRename = async function() {
    const newName = document.getElementById('renameInput').value.trim();
    
    if (!newName) {
        showError('Digite um nome válido');
        return;
    }
    
    if (!renameTargetId || !renameTargetType) {
        showError('Erro: item não identificado');
        return;
    }
    
    try {
        if (renameTargetType === 'folder') {
            const response = await fetch(`/api/folders/${renameTargetId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newName })
            });
            
            if (response.ok) {
                closeRenameModal();
                showSuccess('Pasta renomeada com sucesso!');
                // O Socket.IO deve atualizar automaticamente, mas fazemos um fallback
                setTimeout(async () => {
                    await loadFiles(currentFolderId);
                }, 100);
            } else {
                const error = await response.json();
                showError(error.error || 'Erro ao renomear pasta');
            }
        } else {
            const response = await fetch(`/api/files/${renameTargetId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ originalName: newName })
            });
            
            if (response.ok) {
                closeRenameModal();
                showSuccess('Arquivo renomeado com sucesso!');
                // O Socket.IO deve atualizar automaticamente, mas fazemos um fallback
                setTimeout(async () => {
                    await loadFiles(currentFolderId);
                }, 100);
            } else {
                const error = await response.json();
                showError(error.error || 'Erro ao renomear arquivo');
            }
        }
    } catch (error) {
        console.error('Erro ao renomear:', error);
        showError('Erro ao renomear');
    }
};

// Change color functions - Make globally available
window.selectFolderColorForEdit = function(color) {
    document.getElementById('editFolderColor').value = color;
    
    // Update visual selection
    document.querySelectorAll('.folder-color-edit-btn').forEach(btn => {
        btn.classList.remove('border-blue-500', 'ring-2', 'ring-blue-500');
        btn.classList.add('border-transparent');
    });
    
    const selectedBtn = document.querySelector(`.folder-color-edit-btn[data-color="${color}"]`);
    if (selectedBtn) {
        selectedBtn.classList.remove('border-transparent');
        selectedBtn.classList.add('border-blue-500', 'ring-2', 'ring-blue-500');
    }
};

// Make closeChangeColorModal globally available
window.closeChangeColorModal = function() {
    document.getElementById('changeColorModal').classList.add('hidden');
    changeColorTargetId = null;
}

// Make confirmChangeColor globally available
window.confirmChangeColor = async function() {
    const newColor = document.getElementById('editFolderColor').value;
    
    if (!newColor) {
        showError('Selecione uma cor');
        return;
    }
    
    if (!changeColorTargetId) {
        showError('Erro: pasta não identificada');
        return;
    }
    
    try {
        const response = await fetch(`/api/folders/${changeColorTargetId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ color: newColor })
        });
        
        if (response.ok) {
            closeChangeColorModal();
            showSuccess('Cor da pasta alterada com sucesso!');
            // O Socket.IO atualizará automaticamente via evento folder:updated
        } else {
            const error = await response.json();
            showError(error.error || 'Erro ao alterar cor');
        }
    } catch (error) {
        console.error('Erro ao alterar cor:', error);
        showError('Erro ao alterar cor');
    }
};

// Delete folder function - Make it globally available
window.deleteFolder = async function(folderId) {
    console.log('🗑️ Tentando deletar pasta:', folderId);
    
    if (!folderId) {
        console.error('❌ ID da pasta não fornecido');
        showError('Erro: ID da pasta não fornecido');
        return;
    }
    
    // Primeiro, tentar deletar normalmente
            try {
                const response = await fetch(`/api/folders/${folderId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Resposta do servidor:', response.status, response.statusText);
                
                if (response.ok) {
            const result = await response.json();
            console.log('✅ Pasta deletada com sucesso:', result);
                    showSuccess('Pasta deletada com sucesso!');
            // O Socket.IO atualizará automaticamente via evento folder:deleted
            return;
        }
        
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        
        // Se a pasta não está vazia, perguntar se quer deletar recursivamente
        if (error.requiresForce) {
            const filesCount = error.filesCount || 0;
            const childrenCount = error.childrenCount || 0;
            const message = `Esta pasta contém ${filesCount} arquivo(s) e ${childrenCount} subpasta(s). Deseja deletar tudo? Esta ação não pode ser desfeita.`;
            
            showConfirm(
                message,
                async () => {
                    console.log('✅ Confirmação recebida, deletando pasta recursivamente:', folderId);
                    try {
                        const forceResponse = await fetch(`/api/folders/${folderId}?force=true`, {
                            method: 'DELETE',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (forceResponse.ok) {
                            const result = await forceResponse.json();
                            console.log('✅ Pasta deletada recursivamente:', result);
                            showSuccess(`Pasta deletada com sucesso! (${result.deletedFiles || 0} arquivos e ${result.deletedFolders || 0} subpastas removidos)`);
                            // O Socket.IO atualizará automaticamente via evento folder:deleted
                } else {
                            const forceError = await forceResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
                            console.error('❌ Erro ao deletar pasta recursivamente:', forceError);
                            showError(forceError.error || 'Erro ao deletar pasta');
                }
            } catch (error) {
                        console.error('❌ Erro ao deletar pasta recursivamente:', error);
                        showError('Erro ao deletar pasta: ' + error.message);
                    }
                },
                () => {
                    console.log('❌ Deleção recursiva cancelada pelo usuário');
                }
            );
        } else {
            console.error('❌ Erro ao deletar pasta:', error);
            showError(error.error || 'Erro ao deletar pasta');
        }
    } catch (error) {
        console.error('❌ Erro ao deletar pasta:', error);
        showError('Erro ao deletar pasta: ' + error.message);
    }
};

// Drag and Drop - Upload (from machine to cloud)
let dragCounter = 0;

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    
    // Only show overlay if dragging files (not from our own cards)
    if (e.dataTransfer.types.includes('Files')) {
        const overlay = document.getElementById('dropZoneOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }
    
    return false;
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    
    if (dragCounter === 0) {
        const overlay = document.getElementById('dropZoneOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
    
    return false;
}

async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter = 0;
    const overlay = document.getElementById('dropZoneOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) {
        return false;
    }
    
    // Upload all files in parallel with progress
    const uploadPromises = files.map(file => 
        uploadFileWithProgress(file, currentFolderId)
            .then(() => {
                showSuccess(`Arquivo "${file.name}" enviado com sucesso!`);
            })
            .catch((error) => {
                showError(`Erro ao fazer upload de "${file.name}": ${error.message}`);
            })
    );
    
    // Wait for all uploads to complete
    await Promise.allSettled(uploadPromises);
    
    // Reload files
    await loadFiles(currentFolderId);
    
    return false;
}

// Make functions globally available for inline handlers (backup)
window.handleDragOver = handleDragOver;
window.handleDragEnter = handleDragEnter;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;

// Drag and Drop - Download (from cloud to machine)
let draggedFileId = null;
let draggedFileName = null;
let draggedFileBlob = null;

async function handleFileDragStart(e) {
    const fileCard = e.currentTarget;
    draggedFileId = fileCard.getAttribute('data-file-id');
    draggedFileName = fileCard.getAttribute('data-file-name');
    
    // Add visual feedback
    fileCard.style.opacity = '0.5';
    
    // Pre-fetch the file as blob for drag and drop
    try {
        const response = await fetch(`/api/files/${draggedFileId}/download`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            draggedFileBlob = await response.blob();
            
            // Create a File object from the blob
            const file = new File([draggedFileBlob], draggedFileName, {
                type: draggedFileBlob.type || 'application/octet-stream'
            });
            
            // Use DataTransferItemList API for modern browsers
            if (e.dataTransfer.items && e.dataTransfer.items.length === 0) {
                const dataTransferItemList = e.dataTransfer.items;
                dataTransferItemList.add(file);
            } else {
                // Fallback: set data and let browser handle it
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', draggedFileName);
                e.dataTransfer.setData('application/x-file-id', draggedFileId);
            }
        }
    } catch (error) {
        console.error('Erro ao preparar arquivo para drag:', error);
        // Fallback: just set the name
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', draggedFileName);
    }
}

function handleFileDragEnd(e) {
    const fileCard = e.currentTarget;
    fileCard.style.opacity = '1';
    
    // Clean up after a delay to allow drop to complete
    setTimeout(() => {
        draggedFileId = null;
        draggedFileName = null;
        draggedFileBlob = null;
    }, 100);
}

// Handle drop outside browser (on desktop)
// Note: This is limited by browser security, but we try to make it work
document.addEventListener('dragend', async function(e) {
    // If drag ended and we have a file, trigger download as fallback
    if (draggedFileId && draggedFileBlob) {
        // Small delay to check if drop was successful
        setTimeout(() => {
            if (draggedFileId) {
                // If still set, the drop might have failed, trigger download
                const url = window.URL.createObjectURL(draggedFileBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = draggedFileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                draggedFileId = null;
                draggedFileName = null;
                draggedFileBlob = null;
            }
        }, 100);
    }
});

// Socket listeners
function setupSocketListeners() {
    // Os listeners são definidos no layout (main.hbs) e chamam estas funções
    // Definir as funções globalmente para serem chamadas pelos eventos Socket.IO
    
    window.onFileUploaded = (file) => {
        console.log('📤 Arquivo enviado via socket:', file);
        // Sempre atualizar, mas verificar se está na pasta correta
        const fileFolderId = file.folderId || null;
        if (fileFolderId === currentFolderId) {
            // Adicionar arquivo à lista local
            files.unshift(file);
            renderFiles();
        }
    };
    
    window.onFileDeleted = (data) => {
        console.log('🗑️ Arquivo deletado via socket:', data);
        // Remover o arquivo da lista local imediatamente
        if (data.id) {
            files = files.filter(f => f.id !== data.id);
            selectedFiles.delete(data.id);
            renderFiles();
        } else {
            // Fallback: recarregar tudo se não tiver ID
            loadFiles(currentFolderId);
        }
    };
    
    window.onFolderDeleted = (data) => {
        console.log('🗑️ Pasta deletada via socket:', data);
        // Remover a pasta da lista local imediatamente
        if (data.id) {
            folders = folders.filter(f => f.id !== data.id);
            selectedFolders.delete(data.id);
            renderFiles();
        } else {
            // Fallback: recarregar tudo se não tiver ID
            loadFiles(currentFolderId);
        }
    };
    
    window.onFolderCreated = (folder) => {
        console.log('📁 Pasta criada via socket:', folder);
        // Adicionar a pasta à lista local imediatamente se estiver na pasta correta
        const folderParentId = folder.parentId || null;
        if (folderParentId === currentFolderId || (!folderParentId && !currentFolderId)) {
            // Adicionar à lista local
            folders.push(folder);
            // Ordenar pastas
            folders.sort((a, b) => a.name.localeCompare(b.name));
            renderFiles();
        }
    };
    
    window.onFileUpdated = (file) => {
        console.log('✏️ Arquivo atualizado via socket:', file);
        // Atualizar arquivo na lista local
        const index = files.findIndex(f => f.id === file.id);
        if (index !== -1) {
            files[index] = file;
            renderFiles();
        } else {
            loadFiles(currentFolderId);
        }
    };
    
    window.onFolderUpdated = (folder) => {
        console.log('✏️ Pasta atualizada via socket:', folder);
        // Atualizar pasta na lista local imediatamente
        const index = folders.findIndex(f => f.id === folder.id);
        if (index !== -1) {
            folders[index] = folder;
            renderFiles();
        } else {
            loadFiles(currentFolderId);
        }
    };
    
    window.onSyncEvent = (event) => {
        console.log('🔄 Evento de sincronização:', event);
        loadFiles(currentFolderId);
    };
}

// ==================== SELEÇÃO MÚLTIPLA ====================

// Toggle selection mode
window.toggleSelectionMode = function() {
    selectionMode = !selectionMode;
    const btn = document.getElementById('selectionModeBtn');
    const spans = btn.querySelectorAll('span');
    if (selectionMode) {
        btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        btn.classList.remove('btn-secondary');
        spans.forEach(span => {
            span.textContent = span.classList.contains('sm:hidden') ? 'Cancelar' : 'Cancelar Seleção';
        });
    } else {
        btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        btn.classList.add('btn-secondary');
        spans.forEach(span => {
            span.textContent = 'Selecionar';
        });
        deselectAll();
    }
};

// Toggle file selection
window.toggleFileSelection = function(fileId) {
    if (selectedFiles.has(fileId)) {
        selectedFiles.delete(fileId);
    } else {
        selectedFiles.add(fileId);
        selectionMode = true;
    }
    updateSelectionBar();
    updateCheckboxes();
    updateCardStyles();
};

// Toggle folder selection
window.toggleFolderSelection = function(folderId) {
    if (selectedFolders.has(folderId)) {
        selectedFolders.delete(folderId);
    } else {
        selectedFolders.add(folderId);
        selectionMode = true;
    }
    updateSelectionBar();
    updateCheckboxes();
    updateCardStyles();
};

// Select all
window.selectAll = function() {
    files.forEach(file => selectedFiles.add(file.id));
    folders.forEach(folder => selectedFolders.add(folder.id));
    selectionMode = true;
    updateSelectionBar();
    updateCheckboxes();
    updateCardStyles();
};

// Deselect all
window.deselectAll = function() {
    selectedFiles.clear();
    selectedFolders.clear();
    selectionMode = false;
    updateSelectionBar();
    updateCheckboxes();
    updateCardStyles();
};

// Update selection bar
function updateSelectionBar() {
    const bar = document.getElementById('selectionBar');
    const countEl = document.getElementById('selectionCount');
    const total = selectedFiles.size + selectedFolders.size;
    
    if (total > 0) {
        bar.classList.remove('hidden');
        const filesText = selectedFiles.size > 0 ? `${selectedFiles.size} arquivo${selectedFiles.size !== 1 ? 's' : ''}` : '';
        const foldersText = selectedFolders.size > 0 ? `${selectedFolders.size} pasta${selectedFolders.size !== 1 ? 's' : ''}` : '';
        const text = [filesText, foldersText].filter(t => t).join(' e ');
        countEl.textContent = `${total} item${total !== 1 ? 's' : ''} selecionado${total !== 1 ? 's' : ''} (${text})`;
    } else {
        bar.classList.add('hidden');
        selectionMode = false;
    }
}

// Update checkboxes
function updateCheckboxes() {
    // Update file checkboxes
    document.querySelectorAll('.file-checkbox').forEach(checkbox => {
        const fileId = checkbox.getAttribute('data-file-id');
        checkbox.checked = selectedFiles.has(fileId);
    });
    
    // Update folder checkboxes
    document.querySelectorAll('.folder-checkbox').forEach(checkbox => {
        const folderId = checkbox.getAttribute('data-folder-id');
        checkbox.checked = selectedFolders.has(folderId);
    });
}

// Update card styles
function updateCardStyles() {
    // Update file cards
    files.forEach(file => {
        const card = document.querySelector(`[data-file-id="${file.id}"]`);
        if (card) {
            if (selectedFiles.has(file.id)) {
                card.classList.add('ring-2', 'ring-blue-500', 'bg-gray-700');
            } else {
                card.classList.remove('ring-2', 'ring-blue-500', 'bg-gray-700');
            }
        }
    });
    
    // Update folder cards
    folders.forEach(folder => {
        const card = document.querySelector(`[data-folder-id="${folder.id}"]`);
        if (card) {
            if (selectedFolders.has(folder.id)) {
                card.classList.add('ring-2', 'ring-blue-500', 'bg-gray-700');
            } else {
                card.classList.remove('ring-2', 'ring-blue-500', 'bg-gray-700');
            }
        }
    });
}

// Delete selected items
window.deleteSelected = async function() {
    const total = selectedFiles.size + selectedFolders.size;
    if (total === 0) {
        showError('Nenhum item selecionado');
        return;
    }
    
    const isSharedTab = currentTab === 'sharedFiles';
    const actionText = isSharedTab ? 'remover' : 'deletar';
    const filesText = selectedFiles.size > 0 ? `${selectedFiles.size} arquivo${selectedFiles.size !== 1 ? 's' : ''}` : '';
    const foldersText = selectedFolders.size > 0 ? `${selectedFolders.size} pasta${selectedFolders.size !== 1 ? 's' : ''}` : '';
    const text = [filesText, foldersText].filter(t => t).join(' e ');
    
    showConfirm(
        `Tem certeza que deseja ${actionText} ${text}? Esta ação não pode ser desfeita.`,
        async () => {
            try {
                // Delete files
                const filePromises = Array.from(selectedFiles).map(async (fileId) => {
                    try {
                        let response;
                        
                        if (isSharedTab) {
                            // Para arquivos compartilhados, encontrar o shareId
                            const file = files.find(f => f.id === fileId);
                            if (file && file.shareId) {
                                response = await fetch(`/api/user-shares/files/${fileId}/share-with-user/${file.shareId}`, {
                                    method: 'DELETE',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            } else {
                                console.error(`ShareId não encontrado para arquivo ${fileId}`);
                                return false;
                            }
                        } else {
                            // Deletar arquivo normalmente
                            response = await fetch(`/api/files/${fileId}`, {
                                method: 'DELETE',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                        
                        return response.ok;
                    } catch (error) {
                        console.error(`Erro ao deletar arquivo ${fileId}:`, error);
                        return false;
                    }
                });
                
                // Delete folders (with force for non-empty folders)
                const folderPromises = Array.from(selectedFolders).map(async (folderId) => {
                    try {
                        // Try normal delete first
                        let response = await fetch(`/api/folders/${folderId}`, {
                            method: 'DELETE',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        
                        // If folder is not empty, try force delete
                        if (!response.ok) {
                            const error = await response.json().catch(() => ({}));
                            if (error.requiresForce) {
                                response = await fetch(`/api/folders/${folderId}?force=true`, {
                                    method: 'DELETE',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            }
                        }
                        return response.ok;
                    } catch (error) {
                        console.error(`Erro ao deletar pasta ${folderId}:`, error);
                        return false;
                    }
                });
                
                const results = await Promise.all([...filePromises, ...folderPromises]);
                const successCount = results.filter(r => r).length;
                
                const actionText = isSharedTab ? 'removido' : 'deletado';
                if (successCount === total) {
                    showSuccess(`${total} item${total !== 1 ? 's' : ''} ${actionText}${total !== 1 ? 's' : ''} com sucesso!`);
                } else {
                    showError(`${successCount} de ${total} item${total !== 1 ? 's' : ''} ${actionText}${total !== 1 ? 's' : ''}. Alguns itens não puderam ser ${actionText}${total !== 1 ? 's' : ''}.`);
                }
                
                // Clear selection
                deselectAll();
                
                // O Socket.IO atualizará automaticamente via eventos file:deleted e folder:deleted
                // Para arquivos compartilhados, atualizar imediatamente
                if (isSharedTab) {
                    await loadSharedFiles();
                }
            } catch (error) {
                console.error('Erro ao deletar itens selecionados:', error);
                showError('Erro ao deletar itens selecionados: ' + error.message);
            }
        },
        () => {
            console.log('Deleção cancelada');
        }
    );
};

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+A or Cmd+A to select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            selectAll();
        }
    }
    
    // Delete key to delete selected
    if (e.key === 'Delete' && (selectedFiles.size > 0 || selectedFolders.size > 0)) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            deleteSelected();
        }
    }
    
    // Escape to deselect all
    if (e.key === 'Escape' && (selectedFiles.size > 0 || selectedFolders.size > 0)) {
        deselectAll();
    }
});

// ==================== MOVER/COPIAR ARQUIVOS E PASTAS ====================

let moveCopyType = null; // 'file' ou 'folder'
let moveCopyId = null;
let moveCopyName = null;
let moveCopyAction = 'move'; // 'move' ou 'copy'
let selectedTargetFolderId = null;

// Show move/copy modal
window.showMoveCopyModal = function(type, id, name, action = 'move') {
    moveCopyType = type;
    moveCopyId = id;
    moveCopyName = name;
    moveCopyAction = action;
    selectedTargetFolderId = null;
    
    const modal = document.getElementById('moveCopyModal');
    const title = document.getElementById('moveCopyTitle');
    const itemName = document.getElementById('moveCopyItemName');
    const confirmBtn = document.getElementById('moveCopyConfirmBtn');
    
    title.textContent = `Mover/Copiar ${type === 'file' ? 'arquivo' : 'pasta'}`;
    itemName.textContent = name;
    confirmBtn.textContent = action === 'move' ? 'Mover' : 'Copiar';
    confirmBtn.onclick = confirmMoveCopy;
    
    // Atualizar botões toggle
    setMoveCopyAction(action);
    
    modal.classList.remove('hidden');
    loadFolderTreeForMoveCopy();
};

// Set move/copy action
window.setMoveCopyAction = function(action) {
    moveCopyAction = action;
    const moveBtn = document.getElementById('moveBtn');
    const copyBtn = document.getElementById('copyBtn');
    const confirmBtn = document.getElementById('moveCopyConfirmBtn');
    
    if (action === 'move') {
        moveBtn.classList.remove('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
        moveBtn.classList.add('bg-blue-600', 'text-white');
        copyBtn.classList.remove('bg-blue-600', 'text-white');
        copyBtn.classList.add('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
        confirmBtn.textContent = 'Mover';
    } else {
        copyBtn.classList.remove('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
        copyBtn.classList.add('bg-blue-600', 'text-white');
        moveBtn.classList.remove('bg-blue-600', 'text-white');
        moveBtn.classList.add('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
        confirmBtn.textContent = 'Copiar';
    }
};

// Close move/copy modal
window.closeMoveCopyModal = function() {
    const modal = document.getElementById('moveCopyModal');
    modal.classList.add('hidden');
    moveCopyType = null;
    moveCopyId = null;
    moveCopyName = null;
    selectedTargetFolderId = null;
};

// Load folder tree for move/copy
async function loadFolderTreeForMoveCopy() {
    try {
        const response = await fetch('/api/folders?all=true', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar pastas');
        }
        
        const allFolders = await response.json();
        const treeContainer = document.getElementById('moveCopyFolderTree');
        
        // Construir árvore de pastas
        const folderMap = new Map();
        const rootFolders = [];
        
        allFolders.forEach(folder => {
            folderMap.set(folder.id, { ...folder, children: [] });
        });
        
        allFolders.forEach(folder => {
            if (folder.parentId) {
                const parent = folderMap.get(folder.parentId);
                if (parent) {
                    parent.children.push(folderMap.get(folder.id));
                }
            } else {
                rootFolders.push(folderMap.get(folder.id));
            }
        });
        
        // Renderizar árvore
        let html = `
            <button onclick="selectMoveCopyTarget(null)" 
                    class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors ${selectedTargetFolderId === null ? 'bg-gray-700 border border-blue-500' : ''}">
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    <span class="text-white">Raiz (pasta principal)</span>
                </div>
            </button>
        `;
        
        rootFolders.forEach(folder => {
            html += renderFolderTreeItem(folder, 0);
        });
        
        treeContainer.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar árvore de pastas:', error);
        showError('Erro ao carregar pastas');
    }
}

// Render folder tree item recursively
function renderFolderTreeItem(folder, depth) {
    if (!folder) return '';
    
    // Não mostrar a pasta atual se estiver movendo uma pasta
    if (moveCopyType === 'folder' && folder.id === moveCopyId) {
        return '';
    }
    
    const indent = depth * 20;
    const isSelected = selectedTargetFolderId === folder.id;
    const folderColor = folder.color || 'yellow-400';
    
    let html = `
        <button onclick="selectMoveCopyTarget('${folder.id}')" 
                class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors ${isSelected ? 'bg-gray-700 border border-blue-500' : ''}"
                style="padding-left: ${indent + 16}px;">
            <div class="flex items-center">
                ${getFolderIcon('w-5 h-5', folderColor)}
                <span class="text-white ml-2">${escapeHtml(folder.name)}</span>
            </div>
        </button>
    `;
    
    // Renderizar filhos
    if (folder.children && folder.children.length > 0) {
        folder.children.forEach(child => {
            html += renderFolderTreeItem(child, depth + 1);
        });
    }
    
    return html;
}

// Select move/copy target folder
window.selectMoveCopyTarget = function(folderId) {
    selectedTargetFolderId = folderId;
    loadFolderTreeForMoveCopy(); // Recarregar para atualizar seleção visual
};

// Confirm move/copy
window.confirmMoveCopy = async function() {
    if (!moveCopyId || !moveCopyType) {
        showError('Erro: dados inválidos');
        return;
    }
    
    try {
        const endpoint = moveCopyType === 'file' 
            ? `/api/files/${moveCopyId}/${moveCopyAction}`
            : `/api/folders/${moveCopyId}/${moveCopyAction}`;
        
        const body = moveCopyType === 'file'
            ? { folderId: selectedTargetFolderId }
            : { parentId: selectedTargetFolderId };
        
        const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess(`${moveCopyAction === 'move' ? 'Movido' : 'Copiado'} com sucesso!`);
            closeMoveCopyModal();
            setTimeout(async () => {
                await loadFiles(currentFolderId);
            }, 100);
        } else {
            showError(result.error || `Erro ao ${moveCopyAction === 'move' ? 'mover' : 'copiar'}`);
        }
    } catch (error) {
        console.error(`Erro ao ${moveCopyAction}:`, error);
        showError(`Erro ao ${moveCopyAction === 'move' ? 'mover' : 'copiar'}: ` + error.message);
    }
};

// ==================== COMPARTILHAR COM USUÁRIOS ====================

// Show share with user modal
window.showShareUserModal = async function(fileId, fileName) {
    shareUserFileId = fileId;
    
    const modal = document.getElementById('shareUserModal');
    const fileNameElement = document.getElementById('shareUserFileName');
    const userSelect = document.getElementById('shareUserSelect');
    const errorDiv = document.getElementById('shareUserError');
    
    if (!modal || !fileNameElement || !userSelect) {
        console.error('Elementos do modal não encontrados');
        return;
    }
    
    fileNameElement.textContent = fileName;
    if (errorDiv) errorDiv.classList.add('hidden');
    userSelect.innerHTML = '<option value="">Carregando usuários...</option>';
    
    modal.classList.remove('hidden');
    
    // Load users - usar setTimeout para garantir que o DOM está pronto
    try {
        const response = await fetch('/api/user-shares/users', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar usuários');
        }
        
        const users = await response.json();
        
        // Verificar novamente se o elemento existe antes de manipular
        const currentUserSelect = document.getElementById('shareUserSelect');
        if (!currentUserSelect) {
            console.error('Elemento shareUserSelect não encontrado após carregar usuários');
            return;
        }
        
        // Construir HTML das opções
        let optionsHtml = '<option value="">Selecione um usuário</option>';
        users.forEach(user => {
            optionsHtml += `<option value="${escapeHtml(user.id)}">@${escapeHtml(user.username)}${user.name ? ` (${escapeHtml(user.name)})` : ''}</option>`;
        });
        
        currentUserSelect.innerHTML = optionsHtml;
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        const currentUserSelect = document.getElementById('shareUserSelect');
        if (currentUserSelect) {
            currentUserSelect.innerHTML = '<option value="">Erro ao carregar usuários</option>';
        }
    }
};

// Close share user modal
window.closeShareUserModal = function() {
    const modal = document.getElementById('shareUserModal');
    if (modal) {
        modal.classList.add('hidden');
        shareUserFileId = null;
        const userSelect = document.getElementById('shareUserSelect');
        const errorDiv = document.getElementById('shareUserError');
        if (userSelect) userSelect.value = '';
        if (errorDiv) errorDiv.classList.add('hidden');
    }
};

// Confirm share with user
window.confirmShareWithUser = async function() {
    if (!shareUserFileId) {
        showError('Erro: arquivo não selecionado');
        return;
    }
    
    const userSelect = document.getElementById('shareUserSelect');
    const errorDiv = document.getElementById('shareUserError');
    
    if (!userSelect || !errorDiv) return;
    
    const userId = userSelect.value;
    
    if (!userId) {
        errorDiv.querySelector('p').textContent = 'Selecione um usuário';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    try {
        const response = await fetch(`/api/user-shares/files/${shareUserFileId}/share-with-user`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Arquivo compartilhado com sucesso!');
            closeShareUserModal();
        } else {
            errorDiv.querySelector('p').textContent = result.error || 'Erro ao compartilhar';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Erro ao compartilhar:', error);
        const errorP = errorDiv.querySelector('p');
        if (errorP) {
            errorP.textContent = 'Erro ao compartilhar: ' + error.message;
        }
        errorDiv.classList.remove('hidden');
    }
};


