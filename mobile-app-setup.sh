#!/bin/bash

# Script para criar o projeto mobile React Native

echo "🚀 Criando aplicativo mobile Modernize Cloud"
echo "=============================================="
echo ""

# Verificar se React Native CLI está instalado
if ! command -v npx &> /dev/null; then
    echo "❌ Node.js/npx não encontrado. Instale Node.js primeiro."
    exit 1
fi

# Nome do projeto
PROJECT_NAME="modernize-cloud-mobile"
PARENT_DIR="$(dirname "$(pwd)")"
PROJECT_PATH="$PARENT_DIR/$PROJECT_NAME"

echo "📦 Criando projeto React Native..."
echo "Nome: $PROJECT_NAME"
echo "Local: $PROJECT_PATH"
echo ""

# Criar projeto
cd "$PARENT_DIR" || exit
npx react-native@latest init "$PROJECT_NAME" --skip-install

if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ Erro ao criar projeto"
    exit 1
fi

echo ""
echo "✅ Projeto criado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. cd $PROJECT_PATH"
echo "2. npm install"
echo "3. npm install axios socket.io-client react-navigation @react-navigation/native @react-navigation/stack"
echo "4. npm install @react-native-async-storage/async-storage react-native-document-picker react-native-fs"
echo "5. npm install react-native-image-viewing react-native-share"
echo ""
echo "📱 Para Android:"
echo "   cd android && ./gradlew clean"
echo ""
echo "🍎 Para iOS:"
echo "   cd ios && pod install"
echo ""

