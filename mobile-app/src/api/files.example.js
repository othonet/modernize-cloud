/**
 * API de Arquivos
 */

import api from './client';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

export const filesAPI = {
  /**
   * Listar arquivos
   * @param {string} folderId - ID da pasta (opcional)
   * @param {string} search - Termo de busca (opcional)
   */
  async list(folderId = null, search = null) {
    const params = {};
    if (folderId) params.folderId = folderId;
    if (search) params.search = search;

    const response = await api.get('/api/files', { params });
    return response.data;
  },

  /**
   * Upload de arquivo
   * @param {string} fileUri - URI do arquivo local
   * @param {string} folderId - ID da pasta (opcional)
   */
  async upload(fileUri, folderId = null) {
    try {
      // Ler informações do arquivo
      const fileInfo = await RNFS.stat(fileUri);
      const fileName = fileInfo.name || 'arquivo';
      
      // Criar FormData
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'application/octet-stream', // Pode ser melhorado detectando MIME type
        name: fileName,
      });
      
      if (folderId) {
        formData.append('folderId', folderId);
      }

      const response = await api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.error || error.message || 'Erro ao fazer upload';
    }
  },

  /**
   * Download de arquivo
   * @param {string} fileId - ID do arquivo
   * @param {string} fileName - Nome do arquivo
   */
  async download(fileId, fileName) {
    try {
      const response = await api.get(`/api/files/${fileId}/download`, {
        responseType: 'blob',
      });

      // Salvar arquivo localmente
      const downloadPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      await RNFS.writeFile(downloadPath, response.data, 'base64');
      
      return downloadPath;
    } catch (error) {
      throw error.response?.data?.error || error.message || 'Erro ao baixar arquivo';
    }
  },

  /**
   * Deletar arquivo
   * @param {string} fileId - ID do arquivo
   */
  async delete(fileId) {
    const response = await api.delete(`/api/files/${fileId}`);
    return response.data;
  },

  /**
   * Renomear arquivo
   * @param {string} fileId - ID do arquivo
   * @param {string} newName - Novo nome
   */
  async rename(fileId, newName) {
    const response = await api.put(`/api/files/${fileId}`, {
      name: newName,
    });
    return response.data;
  },

  /**
   * Selecionar arquivo do dispositivo
   */
  async pickFile() {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      return result;
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        return null; // Usuário cancelou
      }
      throw err;
    }
  },
};

