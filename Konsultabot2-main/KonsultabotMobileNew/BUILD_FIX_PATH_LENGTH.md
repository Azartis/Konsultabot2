# 🔧 Fix for Windows Path Length Build Error

## Problem
The build is failing because the project path is too long:
```
C:/Users/Ace Ziegfred Culapas/Downloads/Konsultabot2-main (1)/Konsultabot2-main/KonsultabotMobileNew/...
```
This exceeds CMake's 250-character limit for object file paths.

## Solutions (Choose One)

### ✅ Solution 1: Move Project to Shorter Path (RECOMMENDED)

1. **Move the entire project to a shorter path:**
   ```powershell
   # Create a shorter path
   New-Item -ItemType Directory -Path "C:\Projects" -Force
   
   # Move project
   Move-Item "C:\Users\Ace Ziegfred Culapas\Downloads\Konsultabot2-main (1)\Konsultabot2-main" "C:\Projects\Konsultabot"
   ```

2. **Then rebuild:**
   ```powershell
   cd C:\Projects\Konsultabot\KonsultabotMobileNew
   npx expo prebuild --clean
   npx expo run:android
   ```

### ✅ Solution 2: Enable Windows Long Path Support

1. **Run PowerShell as Administrator:**
   ```powershell
   # Enable long paths
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

2. **Restart your computer**

3. **Rebuild:**
   ```powershell
   cd "C:\Users\Ace Ziegfred Culapas\Downloads\Konsultabot2-main (1)\Konsultabot2-main\KonsultabotMobileNew"
   npx expo prebuild --clean
   npx expo run:android
   ```

### ✅ Solution 3: Configure Gradle to Use Shorter Build Paths

Add to `android/gradle.properties`:
```properties
# Use shorter build paths
android.buildCacheDir=C:/build-cache
android.enableJetifier=true
```

### ✅ Solution 4: Use Subst Command (Quick Fix)

Map a shorter drive letter to your project:

```powershell
# Map K: drive to your project
subst K: "C:\Users\Ace Ziegfred Culapas\Downloads\Konsultabot2-main (1)\Konsultabot2-main"

# Then work from K: drive
cd K:\KonsultabotMobileNew
npx expo prebuild --clean
npx expo run:android
```

**Note:** Subst mappings are temporary and reset on reboot.

## Recommended Action

**Use Solution 1** - Move project to `C:\Projects\Konsultabot` for a permanent fix.

