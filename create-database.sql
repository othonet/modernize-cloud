-- Script para criar o banco de dados private_cloud_db
-- Execute com: mysql -u root -p < create-database.sql

CREATE DATABASE IF NOT EXISTS private_cloud_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Verificar se foi criado
SHOW DATABASES LIKE 'private_cloud_db';

