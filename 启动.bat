@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo   moreless / 多少
echo   ----------------------------------------
echo.

if not exist "node_modules" (
  echo   第一次运行，正在安装依赖，可能要几分钟...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   依赖安装失败，把上面的报错贴到 GitHub Issues：
    echo   https://github.com/YukieUdon/moreless/issues
    pause
    exit /b 1
  )
)

echo   正在启动开发服务器。
echo   出现二维码后，用手机上的 Expo Go 扫码。
echo   手机和电脑要连同一个 Wi-Fi。关掉这个窗口就停止。
echo.

call npx expo start

echo.
echo   开发服务器已停止。
pause
