/**
 * Cliente HTTP para Modernize Cloud Mobile
 * 
 * Configure o IP do servidor em src/utils/config.js
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServerUrl } from '../utils/config';

// Criar instância do axios
const api = axios.create({
  baseURL: getServerUrl(),
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('sessionToken');
    if (token) {
      config.headers.Cookie = `sessionToken=${token}`;
      // Alternativa: usar header Authorization se preferir
      // config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, fazer logout
      await AsyncStorage.removeItem('sessionToken');
      await AsyncStorage.removeItem('user');
      // Redirecionar para login (será implementado no navigator)
    }
    return Promise.reject(error);
  }
);

export default api;

