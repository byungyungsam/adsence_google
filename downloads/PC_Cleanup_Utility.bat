@echo off
chcp 65001 >nul
:: Admin privilege elevation check
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :admin
) else (
    goto :elevate
)

:elevate
echo 관리자 권한을 요청 중입니다...
powershell -Command "Start-Process '%~f0' -Verb RunAs"
exit /b

:admin
cd /d "%~dp0"
echo ===================================================
echo   PC 쾌적화 및 광고 알림 삭제 도구 (관리자 권한)
echo ===================================================
echo.

:: Create a temporary PowerShell script file
set "temp_ps1=%TEMP%\cleanup_temp_%RANDOM%.ps1"

(
echo # PC Cleanup Script
echo Write-Host "=== 1. Google Chrome 종료 ===" -ForegroundColor Cyan
echo $chrome = Get-Process -Name chrome -ErrorAction SilentlyContinue
echo if ($chrome^) {
echo     Write-Host "실행 중인 Chrome 브라우저를 종료합니다..." -ForegroundColor Yellow
echo     Stop-Process -Name chrome -Force
echo     Start-Sleep -Seconds 2
echo } else {
echo     Write-Host "Chrome이 실행 중이지 않습니다."
echo }
echo.
echo Write-Host "`n=== 2. Chrome 광고 알림 사이트 차단 ===" -ForegroundColor Cyan
echo $chromePath = "$env:LOCALAPPDATA\Google\Chrome\User Data"
echo if (Test-Path $chromePath^) {
echo     $prefFiles = Get-ChildItem -Path $chromePath -Filter "Preferences" -Recurse -ErrorAction SilentlyContinue
echo     foreach ($prefFile in $prefFiles^) {
echo         try {
echo             $content = Get-Content -Raw -Path $prefFile.FullName -Encoding UTF8
echo             $json = ConvertFrom-Json $content
echo             $notifications = $json.profile.content_settings.exceptions.notifications
echo             if ($notifications^) {
echo                 $domains = @("https://www.softonic.kr:443,*", "https://www.edimakor.ai:443,*", "https://www.edimakor.net:443,*", "https://www.hitpaw.net:443,*")
echo                 foreach ($domain in $domains^) {
echo                     if ($notifications.psobject.Properties[$domain]^) {
echo                         $notifications.$domain.setting = 2
echo                     } else {
echo                         $newBlock = [PSCustomObject]@{ last_modified = "13426240000000000"; setting = 2 }
echo                         Add-Member -InputObject $notifications -NotePropertyName $domain -NotePropertyValue $newBlock
echo                     }
echo                 }
echo                 $updatedContent = $json | ConvertTo-Json -Depth 100
echo                 Set-Content -Path $prefFile.FullName -Value $updatedContent -Encoding UTF8
echo                 Write-Host "  차단 완료: $($prefFile.FullName)" -ForegroundColor Green
echo             }
echo         } catch {
echo             Write-Host "  오류 발생 ($($prefFile.FullName)^): $($_.Exception.Message)" -ForegroundColor Red
echo         }
echo     }
echo }
echo.
echo Write-Host "`n=== 3. 불필요한 시작 프로그램 비활성화 ===" -ForegroundColor Cyan
echo # Opera GX Browser Assistant 제거
echo Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "Opera GX Browser Assistant" -ErrorAction SilentlyContinue
echo Write-Host "  Opera GX Browser Assistant 시작 프로그램 해제 시도 완료."
echo # ALNotify 제거 (관리자 권한 필요)
echo Remove-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "ALNotify" -ErrorAction SilentlyContinue
echo Write-Host "  알약 업데이트 알림(ALNotify) 시작 프로그램 해제 시도 완료."
echo.
echo Write-Host "`n=== 4. 시스템 임시 파일 정리 ===" -ForegroundColor Cyan
echo $tempPath = $env:TEMP
echo if (Test-Path $tempPath^) {
echo     $files = Get-ChildItem -Path $tempPath -Recurse -File -ErrorAction SilentlyContinue
echo     $count = 0
echo     foreach ($file in $files^) {
echo         try {
echo             Remove-Item -Path $file.FullName -Force -ErrorAction Stop
echo             $count++
echo         } catch {}
echo     }
echo     Write-Host "  임시 파일 $count개 삭제 완료." -ForegroundColor Green
echo }
echo.
echo Write-Host "`n작업이 모두 성공적으로 완료되었습니다!" -ForegroundColor Green
) > "%temp_ps1%"

:: Execute the temporary PowerShell script
powershell -ExecutionPolicy Bypass -File "%temp_ps1%"

:: Delete the temporary script file
del "%temp_ps1%"

echo.
echo ===================================================
echo 모든 최적화 및 광고 차단 작업이 종료되었습니다.
echo 아무 키나 누르면 이 창이 닫힙니다.
echo ===================================================
pause >nul
