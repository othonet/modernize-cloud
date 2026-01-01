# PWA - Progressive Web App

O Modernize Cloud foi otimizado para funcionar como uma Progressive Web App (PWA), permitindo instalação em dispositivos móveis e desktop.

## Recursos Implementados

### ✅ Manifest.json
- Configuração completa do PWA
- Ícones em múltiplos tamanhos (72x72 até 512x512)
- Tema escuro configurado
- Modo standalone para experiência nativa

### ✅ Service Worker
- Cache de recursos estáticos
- Funcionamento offline básico
- Estratégia Network First para páginas
- Estratégia Cache First para recursos estáticos
- Atualização automática de cache

### ✅ Meta Tags
- Suporte para iOS (Apple Touch Icons)
- Suporte para Android
- Theme color configurado
- Viewport otimizado para mobile

### ✅ Página Offline
- Página personalizada quando o usuário está offline
- Detecção automática de conexão
- Botão para tentar novamente

## Como Instalar

### No Android:
1. Abra o site no Chrome
2. Toque no menu (3 pontos)
3. Selecione "Adicionar à tela inicial"
4. Confirme a instalação

### No iOS:
1. Abra o site no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"
4. Confirme a instalação

### No Desktop (Chrome/Edge):
1. Abra o site
2. Clique no ícone de instalação na barra de endereços
3. Ou vá em Menu > Instalar aplicativo

## Gerar Novos Ícones

Se precisar regenerar os ícones:

```bash
# Usando Node.js (recomendado)
npm run generate:icons

# Ou usando ImageMagick
./create-icons-simple.sh
```

## Verificação

Para verificar se o PWA está funcionando:

1. Abra o DevTools (F12)
2. Vá na aba "Application"
3. Verifique:
   - Manifest está carregado
   - Service Worker está registrado e ativo
   - Cache está funcionando

## Funcionalidades Offline

- Páginas visitadas anteriormente funcionam offline
- Recursos estáticos (CSS, JS, imagens) são servidos do cache
- Página offline personalizada quando não há conexão

## Notas

- O Service Worker não faz cache de:
  - Requisições de API (`/api/*`)
  - Uploads (`/uploads/*`)
  - Rotas de autenticação (`/auth/*`)
  - Área administrativa (`/admin/*`)

Isso garante que dados sensíveis não sejam armazenados no cache.

