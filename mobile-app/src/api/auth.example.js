/**
 * API de Autenticação
 */

import api from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authAPI = {
  /**
   * Fazer login
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{success: boolean, user: object}>}
   */
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        // Salvar token e usuário
        // Nota: O servidor retorna o token via cookie, mas podemos extrair se necessário
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Se o servidor retornar token no body, salvar também
        if (response.data.token) {
          await AsyncStorage.setItem('sessionToken', response.data.token);
        }
        
        return response.data;
      }
      
      throw new Error(response.data.error || 'Erro ao fazer login');
    } catch (error) {
      throw error.response?.data?.error || error.message || 'Erro ao fazer login';
    }
  },

  /**
   * Fazer logout
   */
  async logout() {
    try {
      await api.post('/auth/logout');
      await AsyncStorage.removeItem('sessionToken');
      await AsyncStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      // Mesmo com erro, limpar storage local
      await AsyncStorage.removeItem('sessionToken');
      await AsyncStorage.removeItem('user');
      throw error;
    }
  },

  /**
   * Verificar se usuário está autenticado
   */
  async isAuthenticated() {
    const token = await AsyncStorage.getItem('sessionToken');
    const user = await AsyncStorage.getItem('user');
    return !!(token && user);
  },

  /**
   * Obter usuário atual
   */
  async getCurrentUser() {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

