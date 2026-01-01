# 🔧 Correção do Loop de Redirecionamento

## Problema
O arquivo `public/index.html` criado pelo Capacitor estava causando um loop de redirecionamento infinito, mostrando "Redirecionando..." constantemente.

## Causa
O Express estava servindo o arquivo `index.html` estático antes de processar as rotas, causando um conflito.

## Solução Implementada

### 1. **Ordem dos Middlewares**
As rotas agora são processadas **ANTES** dos arquivos estáticos:
```javascript
// Rotas primeiro
app.use('/auth', authRoutes);
app.get('/', requireAuth, (req, res) => { ... });

// Arquivos estáticos depois
app.use(express.static(path.join(__dirname, '../public'), { index: false }));
```

### 2. **Gerenciamento do index.html**
- O `index.html` não fica mais na pasta `public` permanentemente
- Um script (`scripts/capacitor-index.js`) cria o arquivo apenas quando necessário para o Capacitor
- O arquivo é removido automaticamente após o `cap sync`

### 3. **Scripts NPM Atualizados**
```bash
npm run cap:sync  # Cria index.html → sync → remove index.html
```

## Como Funciona Agora

1. **Navegador/Desktop**: 
   - Não há `index.html` na pasta `public`
   - O Express serve as rotas corretamente (`/` → dashboard ou login)

2. **Capacitor Build**:
   - O script cria temporariamente o `index.html`
   - O Capacitor faz o sync
   - O script remove o `index.html`
   - O app nativo funciona normalmente

## Teste

```bash
# Verificar que não há index.html
ls public/index.html  # Não deve existir

# Testar no navegador
curl http://localhost:3000/  # Deve redirecionar para /auth/login ou mostrar dashboard

# Fazer sync do Capacitor
npm run cap:sync  # Cria e remove index.html automaticamente
```

## Status
✅ **Corrigido!** O loop de redirecionamento foi resolvido.

