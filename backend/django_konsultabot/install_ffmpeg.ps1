$ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$downloadPath = "$env:USERPROFILE\Downloads\ffmpeg.zip"
$extractPath = "$env:USERPROFILE\Tools\ffmpeg"

# Create Tools directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\Tools"

# Download FFmpeg
Invoke-WebRequest -Uri $ffmpegUrl -OutFile $downloadPath

# Extract FFmpeg
Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force

# Get the FFmpeg bin directory (it's nested in a versioned folder)
$ffmpegBinPath = Get-ChildItem -Path $extractPath -Filter "ffmpeg-*" | Select-Object -First 1 | Join-Path -ChildPath "bin"

# Add to user PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (-not $userPath.Contains($ffmpegBinPath)) {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$ffmpegBinPath", "User")
}

Write-Host "FFmpeg has been installed and added to your PATH. Please restart your terminal for the changes to take effect."