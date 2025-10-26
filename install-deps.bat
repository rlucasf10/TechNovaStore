@echo off
echo Installing dependencies for all services...

REM Install root dependencies
echo Installing root dependencies...
call npm install

REM Install shared config dependencies
echo Installing shared config dependencies...
cd shared\config
call npm install
cd ..\..

REM Install API Gateway dependencies
echo Installing API Gateway dependencies...
cd api-gateway
call npm install
cd ..

REM Install service dependencies
echo Installing Product Service dependencies...
cd services\product
call npm install
cd ..\..

echo Installing User Service dependencies...
cd services\user
call npm install
cd ..\..

echo Installing Order Service dependencies...
cd services\order
call npm install
cd ..\..

echo All dependencies installed!
echo You can now run the services with:
echo   npm run dev:gateway (for API Gateway)
echo   cd services\product ^&^& npm run dev (for Product Service)
echo   cd services\user ^&^& npm run dev (for User Service)
echo   cd services\order ^&^& npm run dev (for Order Service)