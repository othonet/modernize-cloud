/**
 * Configuração do App Mobile
 */

// IP do servidor na rede local
// Substitua pelo IP do seu servidor
const SERVER_IP = '192.168.1.6'; // Exemplo
const SERVER_PORT = '3000';

// URL base da API
export const getServerUrl = () => {
  // Tentar pegar do AsyncStorage primeiro (configuração do usuário)
  // Por enquanto, usar constante
  return `http://${SERVER_IP}:${SERVER_PORT}`;
};

// Configurações
export const CONFIG = {
  // Tamanho máximo de upload (10GB)
  MAX_FILE_SIZE: 10 * 1024 * 1024 * 1024,
  
  // Timeout de requisições (30 segundos)
  REQUEST_TIMEOUT: 30000,
  
  // Intervalo de sincronização (5 segundos)
  SYNC_INTERVAL: 5000,
  
  // Tipos de arquivo permitidos para visualização
  VIEWABLE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
  ],
};

