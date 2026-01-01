/**
 * Utilitários de Compartilhamento
 * Funciona em mobile (nativo) e desktop (Web Share API)
 */

window.shareFile = async function(fileId, fileName, fileUrl) {
    try {
        const shareUrl = fileUrl || `${window.location.origin}/api/files/${fileId}/download`;
        
        // Tentar compartilhar
        if (window.CapacitorBridge) {
            const result = await window.CapacitorBridge.share({
                title: fileName,
                text: `Compartilhar: ${fileName}`,
                url: shareUrl,
                dialogTitle: 'Compartilhar arquivo'
            });
            
            if (result.completed) {
                showSuccess('Arquivo compartilhado!');
            }
        } else if (navigator.share) {
            // Web Share API
            await navigator.share({
                title: fileName,
                text: `Compartilhar: ${fileName}`,
                url: shareUrl
            });
            showSuccess('Arquivo compartilhado!');
        } else {
            // Fallback: copiar link
            await navigator.clipboard.writeText(shareUrl);
            showSuccess('Link copiado para a área de transferência!');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Erro ao compartilhar:', error);
            showError('Erro ao compartilhar arquivo');
        }
    }
};

window.shareFolder = async function(folderId, folderName) {
    try {
        const shareUrl = `${window.location.origin}/?folder=${folderId}`;
        
        if (window.CapacitorBridge) {
            const result = await window.CapacitorBridge.share({
                title: folderName,
                text: `Compartilhar pasta: ${folderName}`,
                url: shareUrl,
                dialogTitle: 'Compartilhar pasta'
            });
            
            if (result.completed) {
                showSuccess('Pasta compartilhada!');
            }
        } else if (navigator.share) {
            await navigator.share({
                title: folderName,
                text: `Compartilhar pasta: ${folderName}`,
                url: shareUrl
            });
            showSuccess('Pasta compartilhada!');
        } else {
            await navigator.clipboard.writeText(shareUrl);
            showSuccess('Link copiado para a área de transferência!');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Erro ao compartilhar:', error);
            showError('Erro ao compartilhar pasta');
        }
    }
};

