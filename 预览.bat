@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem 在电脑浏览器里验收：同一个 Metro 服务器同时喂手机和浏览器。
rem 服务器没在跑就先起一个，然后打开 http://localhost:8081

netstat -ano | findstr ":8081 " | findstr LISTENING >nul
if not errorlevel 1 goto open

echo   开发服务器没在跑，正在启动（第一次要十几秒）...
start "moreless dev server" cmd /c "npx expo start"

:wait
timeout /t 2 >nul
netstat -ano | findstr ":8081 " | findstr LISTENING >nul
if errorlevel 1 goto wait

:open
start "" http://localhost:8081
echo.
echo   已在浏览器打开 http://localhost:8081
echo   改完代码这里自动刷新；手机想一起看，从 Expo Go 的「最近」点开即可，不用重扫。
echo.
timeout /t 5 >nul
