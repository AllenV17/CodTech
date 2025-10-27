@echo off
echo Starting Real-time Document Editor...
echo.

echo Checking if MongoDB is running...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: MongoDB is not installed or not in PATH
    echo Please install MongoDB and make sure it's running
    pause
    exit /b 1
)

echo Starting MongoDB (if not already running)...
start "MongoDB" mongod --dbpath ./data/db 2>nul

echo Waiting for MongoDB to start...
timeout /t 3 /nobreak >nul

echo Starting backend server...
start "Backend Server" cmd /k "npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend...
start "Frontend" cmd /k "cd client && npm start"

echo.
echo Application is starting up...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul

