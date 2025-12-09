# 🔧 Fix JAVA_HOME Error for Android Build

## 🎯 **The Problem**

The error `JAVA_HOME is not set and no 'java' command could be found` means:
- Java JDK is not installed, OR
- Java is installed but `JAVA_HOME` environment variable is not set

**Why this is needed:** Android builds require Java JDK to compile native code.

---

## ✅ **Quick Fix: Use Automated Script**

I've created a script that finds and configures Java automatically:

```powershell
cd KonsultabotMobileNew
.\setup-java.ps1
```

This script will:
1. ✅ Check if Java is installed
2. ✅ Find Java installation automatically
3. ✅ Set JAVA_HOME for current session
4. ✅ Set JAVA_HOME permanently
5. ✅ Verify Java is working

---

## 📥 **Option 1: Install Java JDK (If Not Installed)**

### **Step 1: Download Java JDK**

1. Visit: https://adoptium.net/temurin/releases/
2. Choose:
   - **Version:** JDK 17 (LTS) - Recommended for Android
   - **Operating System:** Windows
   - **Architecture:** x64
3. Download the installer (.msi file)

### **Step 2: Install Java**

1. Run the downloaded installer
2. **Important:** Check "Add to PATH" during installation
3. Use default installation location (usually `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`)

### **Step 3: Verify Installation**

```powershell
java -version
```

**Expected output:**
```
openjdk version "17.0.x" ...
```

### **Step 4: Set JAVA_HOME**

Run the setup script:
```powershell
cd KonsultabotMobileNew
.\setup-java.ps1
```

Or set manually:
```powershell
# Find Java installation (usually in one of these)
$javaPath = "C:\Program Files\Eclipse Adoptium\jdk-17.0.9+9-hotspot"

# Set for current session
$env:JAVA_HOME = $javaPath

# Set permanently
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, "User")
```

### **Step 5: Restart PowerShell**

Close and reopen PowerShell for changes to take effect.

---

## 🔍 **Option 2: Use Android Studio's Java (If Installed)**

If you have Android Studio installed, it includes Java:

```powershell
# Find Android Studio's Java
$androidStudioJava = "$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr"

if (Test-Path $androidStudioJava) {
    $env:JAVA_HOME = $androidStudioJava
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $androidStudioJava, "User")
    Write-Host "✅ Using Android Studio's Java: $androidStudioJava" -ForegroundColor Green
} else {
    Write-Host "❌ Android Studio Java not found" -ForegroundColor Red
}
```

---

## ✅ **Verify Java is Working**

After setting JAVA_HOME:

```powershell
# Check Java version
java -version

# Check JAVA_HOME
$env:JAVA_HOME

# Verify JAVA_HOME points to correct location
Test-Path "$env:JAVA_HOME\bin\java.exe"
```

**Expected:**
- `java -version` shows Java version
- `$env:JAVA_HOME` shows the Java installation path
- `Test-Path` returns `True`

---

## 🚀 **After Java is Configured**

Once Java is set up, rebuild the app:

```powershell
cd KonsultabotMobileNew

# Option 1: Use the rebuild script
.\rebuild-voice-module.ps1

# Option 2: Manual rebuild
npx expo prebuild --clean
npx expo run:android
```

---

## 📋 **Quick Reference: Java Requirements**

| Requirement | Details |
|-------------|---------|
| **Java Version** | JDK 17 (LTS) recommended, JDK 11+ works |
| **Installation** | Download from https://adoptium.net/ |
| **JAVA_HOME** | Must point to JDK root (not JRE, not bin folder) |
| **PATH** | Should include `%JAVA_HOME%\bin` |

---

## 🆘 **Troubleshooting**

### **Error: "Java not found"**
**Solution:** Install Java JDK from https://adoptium.net/

### **Error: "JAVA_HOME not set"**
**Solution:** Run `.\setup-java.ps1` or set manually (see above)

### **Error: "Wrong Java version"**
**Solution:** Android requires JDK 11+. Install JDK 17 (LTS) recommended.

### **Error: "JAVA_HOME points to wrong location"**
**Solution:** JAVA_HOME should point to JDK root (folder containing `bin`, `lib`, etc.), NOT the `bin` folder.

**Correct:**
```
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9+9-hotspot
```

**Wrong:**
```
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.9+9-hotspot\bin
```

---

## ✅ **After Java is Configured**

1. ✅ Run `.\setup-java.ps1` to configure Java
2. ✅ Restart PowerShell
3. ✅ Run `.\rebuild-voice-module.ps1` to build the app
4. ✅ Voice module will be compiled into the app

---

**Java is required for Android builds. Once configured, your app will build successfully!** 🎯

