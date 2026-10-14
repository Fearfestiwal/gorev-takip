@echo off
chcp 65001 >nul
title Sirket Gorev Takip Sunucusu
cd /d "%~dp0"

echo ====================================================================
echo   KOORDINASYON GOREV TAKIP SISTEMI - SUNUCU BASLATILIYOR...
echo ====================================================================

set PYTHON_CMD=
if exist "%USERPROFILE%\AppData\Roaming\uv\python\cpython-3.14-windows-x86_64-none\python.exe" (
    set PYTHON_CMD="%USERPROFILE%\AppData\Roaming\uv\python\cpython-3.14-windows-x86_64-none\python.exe"
) else if exist "%USERPROFILE%\.local\bin\uv.exe" (
    set PYTHON_CMD="%USERPROFILE%\.local\bin\uv.exe" run python
) else (
    set PYTHON_CMD=python
)

%PYTHON_CMD% sunucu.py
pause
