# Modernize Cloud

Modernize Cloud - Uma cloud privada moderna com sincronização ponto a ponto, construída com Node.js, MySQL, Prisma, Handlebars e TailwindCSS.

## 🚀 Funcionalidades

- ✅ Upload e download de arquivos
- ✅ Gerenciamento de pastas
- ✅ Sincronização ponto a ponto em tempo real (WebSocket)
- ✅ Interface moderna com tema dark
- ✅ Autenticação de usuários
- ✅ Busca de arquivos
- ✅ Interface responsiva

## 📋 Pré-requisitos

- Node.js 18+ 
- MySQL 8+
- npm ou yarn

## 🔧 Instalação

1. **Clone ou navegue até o diretório:**
```bash
cd private-cloud
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Crie o banco de dados:**
   ```bash
   # Execute o script de criação
   ./create-database.sh
   
   # Ou manualmente:
   mysql -u root -p < create-database.sql
   ```

4. **Configure o arquivo .env:**
   ```bash
   cp env.example .env
   # Edite o .env com suas credenciais:
   # DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/private_cloud_db"
   ```

5. **Configure o Prisma:**
```bash
npm run prisma:generate
npm run prisma:migrate
```

6. **Inicie a aplicação (automatizado):**
```bash
# Opção 1: Usar o script de inicialização
./start.sh

# Opção 2: Usar npm diretamente (recomendado)
npm run dev:all
```

Isso iniciará automaticamente:
- ✅ Compilador CSS em modo watch (recompila automaticamente ao alterar arquivos)
- ✅ Servidor Node.js em modo watch (reinicia automaticamente ao alterar código)

7. **Acesse:**
   - Abra http://localhost:3000
   - Registre uma nova conta
   - Comece a usar!

**Nota:** O modo `dev:all` roda ambos os processos em paralelo e monitora alterações automaticamente. Para parar, pressione `Ctrl+C`.

## 🏗️ Estrutura do Projeto

```
private-cloud/
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── public/
│   ├── css/                   # CSS compilado
│   ├── js/                    # JavaScript do cliente
│   └── uploads/               # Arquivos enviados
├── src/
│   ├── config/
│   │   └── database.js        # Configuração Prisma
│   ├── middleware/
│   │   └── auth.js            # Middleware de autenticação
│   ├── routes/
│   │   ├── auth.js            # Rotas de autenticação
│   │   ├── files.js           # Rotas de arquivos
│   │   ├── folders.js         # Rotas de pastas
│   │   └── sync.js            # Rotas de sincronização
│   ├── services/
│   │   └── socketService.js   # Serviço WebSocket
│   ├── views/
│   │   ├── layouts/
│   │   │   └── main.hbs       # Layout principal
│   │   └── pages/
│   │       ├── dashboard.hbs  # Dashboard principal
│   │       ├── login.hbs      # Página de login
│   │       └── register.hbs  # Página de registro
│   ├── styles/
│   │   └── input.css          # CSS do Tailwind
│   └── server.js              # Servidor principal
├── package.json
└── tailwind.config.js         # Configuração Tailwind
```

## 🔐 Segurança

- Senhas são hasheadas com bcrypt
- Sessões seguras com cookies httpOnly
- Validação de autenticação em todas as rotas protegidas
- Sanitização de inputs

## 📡 Sincronização Ponto a Ponto

A sincronização funciona através de WebSocket (Socket.IO):
- Eventos em tempo real quando arquivos são enviados/deletados
- Sincronização automática entre múltiplos clientes
- Histórico de eventos de sincronização

## 🎨 Personalização

O tema dark pode ser personalizado editando:
- `src/styles/input.css` - Estilos customizados
- `tailwind.config.js` - Configuração do Tailwind
- `src/views/layouts/main.hbs` - Layout principal

## 📝 Scripts Disponíveis

- `npm run dev:all` - **Inicia tudo automaticamente** (CSS + Servidor em modo watch)
- `npm run dev` - Inicia apenas o servidor em modo desenvolvimento
- `npm start` - Inicia o servidor em produção
- `npm run build:css` - Compila o CSS do Tailwind (modo watch)
- `npm run prisma:generate` - Gera o cliente Prisma
- `npm run prisma:migrate` - Executa migrações
- `npm run prisma:studio` - Abre o Prisma Studio

## 🐛 Troubleshooting

**Erro de conexão com MySQL:**
- Verifique se o MySQL está rodando
- Confirme as credenciais no `.env`

**CSS não está funcionando:**
- Execute `npm run build:css` em um terminal separado
- Verifique se o arquivo `public/css/style.css` existe

**Upload de arquivos falha:**
- Verifique as permissões da pasta `public/uploads`
- Confirme o limite de tamanho no `.env` (MAX_FILE_SIZE)

## 📄 Licença

MIT
