# Instalar PWA no Brave Browser

## Método 1: Instalação Automática (Recomendado)

1. Acesse o site e faça login
2. Aguarde alguns segundos para o Service Worker carregar
3. O botão "Instalar App" deve aparecer na barra de navegação
4. Clique no botão para instalar

## Método 2: Instalação Manual via Menu

Se o botão não aparecer, use o método manual:

1. **Clique no menu do Brave** (☰) no canto superior direito
2. Selecione **"Mais ferramentas"**
3. Escolha **"Criar atalho..."**
4. **Marque a opção "Abrir como janela"**
5. Clique em **"Criar"**

## Método 3: Via Barra de Endereços

1. Procure pelo **ícone de instalação** (➕) na barra de endereços
2. Clique no ícone
3. Confirme a instalação

## Verificações

### Se o botão não aparecer:

1. **Abra o DevTools** (F12)
2. Vá na aba **"Console"**
3. Verifique se há mensagens sobre:
   - ✅ Service Worker registrado
   - ✅ PWA pode ser instalado
   - ⚠️ Erros ou avisos

4. Vá na aba **"Application"**
5. Verifique:
   - **Manifest**: Deve estar carregado e sem erros
   - **Service Workers**: Deve estar "activated and is running"
   - **Storage**: Verifique se há cache

### Requisitos para Instalação:

- ✅ Service Worker ativo
- ✅ Manifest.json válido
- ✅ Ícone de pelo menos 192x192
- ✅ Site acessado via HTTPS (ou localhost/IP local)
- ✅ Pelo menos uma visita prévia

### Problemas Comuns:

**Problema**: Botão não aparece
- **Solução**: Use o método manual (Menu > Mais ferramentas > Criar atalho)

**Problema**: "Site não seguro"
- **Solução**: Para produção, use HTTPS. Para desenvolvimento local, o Brave pode ser mais restritivo. Tente usar `localhost` em vez do IP.

**Problema**: Service Worker não ativa
- **Solução**: 
  1. Limpe o cache (Ctrl+Shift+Delete)
  2. Recarregue a página (Ctrl+F5)
  3. Verifique o console para erros

## Nota sobre HTTPS

O Brave pode ser mais restritivo com PWAs em HTTP. Para melhor experiência:

- **Desenvolvimento**: Use `localhost:3000` em vez de `192.168.1.6:3000`
- **Produção**: Configure HTTPS com certificado SSL

## Depois da Instalação

Após instalar, o app aparecerá como um aplicativo separado:
- No Windows: Menu Iniciar e área de trabalho
- No Linux: Menu de aplicativos
- No macOS: Launchpad e Applications

