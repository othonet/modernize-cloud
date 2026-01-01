#!/bin/bash

echo "🗄️  Criando banco de dados private_cloud_db..."
echo ""

# Tentar diferentes métodos de acesso ao MySQL
if command -v mysql &> /dev/null; then
    MYSQL_CMD="mysql"
elif command -v mariadb &> /dev/null; then
    MYSQL_CMD="mariadb"
else
    echo "❌ MySQL/MariaDB não encontrado."
    echo ""
    echo "Por favor, execute manualmente:"
    echo "  mysql -u root -p < create-database.sql"
    echo ""
    echo "Ou conecte-se ao MySQL e execute:"
    echo "  CREATE DATABASE IF NOT EXISTS private_cloud_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    exit 1
fi

echo "Digite a senha do MySQL quando solicitado:"
$MYSQL_CMD -u root -p < create-database.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Banco de dados criado com sucesso!"
    echo ""
    echo "Agora atualize o arquivo .env com:"
    echo "  DATABASE_URL=\"mysql://root:SUA_SENHA@localhost:3306/private_cloud_db\""
else
    echo ""
    echo "❌ Erro ao criar banco de dados."
    echo "Tente executar manualmente:"
    echo "  mysql -u root -p"
    echo "  CREATE DATABASE IF NOT EXISTS private_cloud_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

