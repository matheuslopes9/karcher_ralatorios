@echo off
echo ========================================
echo  Karcher Analytics Platform
echo  Iniciando ambiente de desenvolvimento
echo ========================================
echo.

REM Verifica se Docker está instalado
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRO: Docker nao encontrado. Instale o Docker Desktop primeiro.
    pause
    exit /b 1
)

REM Verifica se docker-compose está disponível
where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRO: docker-compose nao encontrado.
    pause
    exit /b 1
)

REM Verifica se arquivo .env existe
if not exist ".env" (
    echo Criando arquivo .env...
    copy .env.example .env
    echo.
    echo ATENCAO: Edite o arquivo .env com suas configuracoes antes de continuar.
    pause
)

echo Iniciando servicos com Docker Compose...
echo.

docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  Servicos iniciados com sucesso!
    echo ========================================
    echo.
    echo  Backend:  http://localhost:8080
    echo  Frontend: http://localhost:3000
    echo  Health:   http://localhost:8080/health
    echo.
    echo  Credenciais Master:
    echo  Usuario: admin
    echo  Senha:   UCT3chn0l0gy!@
    echo.
    echo  Para ver os logs:
    echo  docker-compose logs -f
    echo.
    echo  Para parar os servicos:
    echo  docker-compose down
    echo.
) else (
    echo.
    echo ERRO ao iniciar os servicos. Verifique a saida acima.
    pause
    exit /b 1
)
