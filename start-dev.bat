@echo off
cd /d "%~dp0"
echo Paji Shoes - starting dev server...
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
if not exist .env (
  echo ERROR: .env file missing. Copy from .env.example and fill in values.
  pause
  exit /b 1
)
echo Pushing database schema to Neon...
call npm run db:push
echo Seeding admin user and demo data...
call npm run db:seed
echo.
echo Open http://localhost:3000
call npm run dev
