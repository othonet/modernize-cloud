#!/bin/bash

# Script para iniciar a aplicação Modernize Cloud
# Este script inicia tanto o compilador CSS quanto o servidor Node.js

cd "$(dirname "$0")"

echo "🚀 Iniciando Modernize Cloud..."
echo ""
echo "📦 Compilando CSS e iniciando servidor..."
echo ""

# Usar npm run dev:all que roda ambos em paralelo
npm run dev:all

