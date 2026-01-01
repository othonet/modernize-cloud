/**
 * Capacitor Bridge - Detecta e usa funcionalidades nativas apenas quando disponíveis
 * Não interfere com a versão desktop/web - funciona perfeitamente em ambos!
 */

class CapacitorBridge {
  constructor() {
    this.isNative = false;
    this.capacitor = null;
    this.plugins = {};
    this.init();
  }

  async init() {
    // Verificar se Capacitor está disponível (apenas em app nativo)
    // Em web/desktop, window.Capacitor não existe, então isNative fica false
    if (typeof window !== 'undefined' && window.Capacitor) {
      this.capacitor = window.Capacitor;
      this.isNative = true;
      
      // Em app nativo, os plugins são injetados pelo Capacitor
      // Não precisamos importar, eles já estão disponíveis
      if (window.Capacitor.Plugins) {
        this.plugins = window.Capacitor.Plugins;
        console.log('✅ Capacitor plugins disponíveis (modo nativo)');
      }
    } else {
      // Modo web/desktop - tudo funciona normalmente sem Capacitor
      console.log('🌐 Modo web/desktop - usando funcionalidades web padrão');
    }
  }

  // Verificar se está rodando em app nativo
  get isNativeApp() {
    return this.isNative;
  }

  // Verificar se está rodando em web/desktop
  get isWeb() {
    return !this.isNative;
  }

  // Câmera - apenas no mobile, fallback para web
  async takePicture() {
    if (!this.isNative || !this.plugins.Camera) {
      // Fallback para web/desktop: usar input file (funciona perfeitamente!)
      return this.webFilePicker();
    }
    
    try {
      const image = await this.plugins.Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'base64'
      });
      return image;
    } catch (error) {
      // Se falhar no mobile, usa fallback web
      return this.webFilePicker();
    }
  }

  // Selecionar da galeria - apenas no mobile, fallback para web
  async pickFromGallery() {
    if (!this.isNative || !this.plugins.Camera) {
      // Fallback para web/desktop: usar input file (funciona perfeitamente!)
      return this.webFilePicker();
    }
    
    try {
      const image = await this.plugins.Camera.getPhoto({
        quality: 90,
        source: 'PHOTOLIBRARY',
        allowEditing: false,
        resultType: 'base64'
      });
      return image;
    } catch (error) {
      // Se falhar no mobile, usa fallback web
      return this.webFilePicker();
    }
  }

  // Fallback para web/desktop
  webFilePicker() {
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

  // Compartilhar - funciona em mobile e web!
  async share(content) {
    // Primeiro tenta Web Share API (funciona em muitos navegadores modernos)
    if (navigator.share) {
      try {
        await navigator.share(content);
        return { completed: true };
      } catch (error) {
        // Usuário cancelou ou erro - continua para próximo método
      }
    }
    
    // Se for app nativo, usa plugin do Capacitor
    if (this.isNative && this.plugins.Share) {
      try {
        const result = await this.plugins.Share.share(content);
        return result;
      } catch (error) {
        // Continua para fallback
      }
    }
    
    // Fallback: copiar para clipboard (funciona em web e mobile)
    if (content.url) {
      try {
        await navigator.clipboard.writeText(content.url);
        if (window.showAlert) {
          window.showAlert('Link copiado para a área de transferência!');
        } else {
          alert('Link copiado para a área de transferência!');
        }
        return { completed: true };
      } catch (error) {
        console.error('Erro ao copiar:', error);
      }
    }
    
    return { completed: false };
  }

  // Feedback háptico - apenas no mobile (silenciosamente ignorado em web)
  async hapticFeedback(type = 'light') {
    // Em web/desktop, simplesmente não faz nada (não quebra nada!)
    if (!this.isNative || !this.plugins.Haptics) {
      return; // Silenciosamente ignora em web - não afeta nada
    }

    try {
      switch (type) {
        case 'light':
          await this.plugins.Haptics.impact({ style: 'LIGHT' });
          break;
        case 'medium':
          await this.plugins.Haptics.impact({ style: 'MEDIUM' });
          break;
        case 'heavy':
          await this.plugins.Haptics.impact({ style: 'HEAVY' });
          break;
        case 'success':
          await this.plugins.Haptics.notification({ type: 'SUCCESS' });
          break;
        case 'error':
          await this.plugins.Haptics.notification({ type: 'ERROR' });
          break;
      }
    } catch (error) {
      // Ignora erros silenciosamente - não quebra nada
    }
  }

  // Status da rede - funciona em ambos
  async getNetworkStatus() {
    if (this.isNative && this.plugins.Network) {
      const status = await this.plugins.Network.getStatus();
      return status;
    }
    
    // Fallback para web
    return {
      connected: navigator.onLine,
      connectionType: 'unknown'
    };
  }

  // Listener de mudanças de rede
  addNetworkListener(callback) {
    if (this.isNative && this.plugins.Network) {
      return this.plugins.Network.addListener('networkStatusChange', callback);
    }
    
    // Fallback para web
    window.addEventListener('online', () => callback({ connected: true }));
    window.addEventListener('offline', () => callback({ connected: false }));
    
    return {
      remove: () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      }
    };
  }

  // Listener de voltar (Android) - apenas mobile
  addBackButtonListener(callback) {
    if (this.isNative && this.plugins.App) {
      return this.plugins.App.addListener('backButton', callback);
    }
    return { remove: () => {} };
  }

  // Configurar status bar - apenas mobile
  async setStatusBarStyle(style = 'dark') {
    if (!this.isNative || !this.plugins.StatusBar) {
      return;
    }

    try {
      await this.plugins.StatusBar.setStyle({ style: style === 'dark' ? 'DARK' : 'LIGHT' });
      await this.plugins.StatusBar.setBackgroundColor({ color: '#111827' });
    } catch (error) {
      // Ignora erros
    }
  }
}

// Criar instância global
const capacitorBridge = new CapacitorBridge();

// Exportar para uso global
window.CapacitorBridge = capacitorBridge;

// Aguardar inicialização (não bloqueia nada se Capacitor não estiver disponível)
setTimeout(() => {
  capacitorBridge.init().then(() => {
    const mode = capacitorBridge.isNative ? '📱 Nativo' : '🌐 Web/Desktop';
    console.log(`✅ Capacitor Bridge: ${mode} - Tudo funcionando normalmente!`);
  }).catch(() => {
    // Se falhar, não importa - modo web funciona normalmente
    console.log('🌐 Modo web/desktop - funcionando normalmente');
  });
}, 100);

