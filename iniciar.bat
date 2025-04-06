@echo off
title Sistema Financeiro - Inicialização
color 0A
mode con: cols=80 lines=30

echo ============================================
echo    SISTEMA FINANCEIRO - INICIALIZACAO
echo ============================================
echo.

:: Verificar Node.js
echo [1/5] Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js em: https://nodejs.org/
    pause
    exit
)

:: Verificar MongoDB
echo [2/5] Verificando conexao com MongoDB...
cd /d "%~dp0"
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/sistema-financeiro').then(() => { console.log('MongoDB conectado'); process.exit(0); }).catch(err => { console.error('Erro MongoDB:', err); process.exit(1); })"
if %errorlevel% neq 0 (
    echo [ERRO] Nao foi possivel conectar ao MongoDB!
    echo Verifique se o MongoDB Compass esta instalado e rodando
    pause
    exit
)

:: Verificar e liberar portas em uso
echo [3/5] Verificando portas...
echo Verificando porta 5002...
netstat -ano | findstr :5002 > temp.txt
if %errorlevel% equ 0 (
    echo Encontrado processo usando a porta 5002
    echo Tentando liberar a porta...
    for /f "tokens=5" %%a in ('type temp.txt ^| findstr :5002') do (
        taskkill /F /PID %%a
    )
    del temp.txt
    timeout /t 2 /nobreak
)

echo Verificando porta 3000...
netstat -ano | findstr :3000 > temp.txt
if %errorlevel% equ 0 (
    echo Encontrado processo usando a porta 3000
    echo Tentando liberar a porta...
    for /f "tokens=5" %%a in ('type temp.txt ^| findstr :3000') do (
        taskkill /F /PID %%a
    )
    del temp.txt
    timeout /t 2 /nobreak
)

:: Iniciar backend
echo [4/5] Iniciando backend...
start /min cmd /c "title Backend - Sistema Financeiro && node server.js"

:: Aguardar 15 segundos
echo Aguardando backend iniciar...
timeout /t 15 /nobreak

:: Verificar se o backend esta rodando
curl http://localhost:5002
if %errorlevel% neq 0 (
    echo [ERRO] Backend nao esta respondendo na porta 5002!
    echo Verifique a janela do backend para ver o erro
    pause
    exit
)

:: Criar usuário admin
echo Criando usuário admin...
curl -X POST http://localhost:5002/api/auth/criar-admin

:: Iniciar frontend
echo [5/5] Iniciando frontend...
cd "client"
echo Instalando dependencias do frontend...
call npm install
echo Iniciando servidor do frontend...
start /min cmd /c "title Frontend - Sistema Financeiro && set PORT=3000 && npm start"

:: Aguardar 30 segundos
echo Aguardando frontend iniciar...
timeout /t 30 /nobreak

:: Verificar se o frontend esta rodando
curl http://localhost:3000
if %errorlevel% neq 0 (
    echo [AVISO] Frontend nao esta respondendo na porta 3000!
    echo Tentando iniciar manualmente...
    start /min cmd /c "title Frontend - Sistema Financeiro && cd client && npm start"
    timeout /t 30 /nobreak
)

:: Abrir navegador
echo Abrindo navegador...
start chrome http://localhost:3000

echo.
echo ============================================
echo    SISTEMA INICIADO COM SUCESSO!
echo ============================================
echo.
echo Credenciais de acesso:
echo Email: admin@admin.com
echo Senha: admin123
echo.
echo Se o navegador nao abrir automaticamente:
echo 1. Abra manualmente o Chrome
echo 2. Digite na barra de enderecos: http://localhost:3000
echo.
echo Para encerrar o sistema:
echo 1. Feche todas as janelas do terminal
echo 2. Feche o navegador
echo.
echo Se precisar de ajuda:
echo 1. Verifique se o backend esta rodando (porta 5002)
echo 2. Verifique se o frontend esta rodando (porta 3000)
echo 3. Verifique se o MongoDB esta conectado
echo.
timeout /t 5 /nobreak
exit 