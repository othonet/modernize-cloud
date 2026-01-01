const CACHE_NAME = 'modernize-cloud-v1';
const RUNTIME_CACHE = 'modernize-cloud-runtime-v1';

// Arquivos estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/css/style.css',
  '/js/app.js',
  '/js/alerts.js',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  'https://cdn.socket.io/4.5.4/socket.io.min.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando recursos estáticos');
        // Usar addAll com tratamento de erros
        return Promise.allSettled(
          STATIC_ASSETS.map(url => {
            return fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
                throw new Error(`HTTP ${response.status} para ${url}`);
              })
              .catch(error => {
                console.warn(`[Service Worker] Não foi possível fazer cache de ${url}:`, error);
                // Continuar mesmo se alguns recursos falharem
                return Promise.resolve();
              });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Instalação concluída');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Erro na instalação:', error);
        // Continuar mesmo com erros
        return self.skipWaiting();
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições de API e uploads
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/auth/') ||
      url.pathname.startsWith('/uploads/') ||
      url.pathname.startsWith('/admin/')) {
    return;
  }

  // Para recursos estáticos, usar Cache First
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(cacheFirst(request));
  } else {
    // Para páginas HTML, usar Network First
    event.respondWith(networkFirst(request));
  }
});

// Estratégia Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Erro ao buscar recurso:', error);
    // Retornar uma resposta padrão se disponível
    if (request.destination === 'image') {
      return new Response('', { status: 404 });
    }
    throw error;
  }
}

// Estratégia Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Rede indisponível, usando cache');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não houver cache e for uma página, retornar página offline
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

