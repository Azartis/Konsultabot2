# 🧪 How to See Login Error Messages

## ⚠️ IMPORTANT: Restart the App First!

If the app is running, **stop it and restart**:

```bash
# Stop current process (Ctrl+C in terminal)
# Then restart:
npm start
# Press 'w' for web
```

---

## ✅ Test Scenarios to See Error Messages:

### **1. Empty Fields Error**
**Steps:**
1. Open Login screen
2. **Don't type anything** in email or password
3. Click "Sign In" button
4. **You should see:** Red banner at top saying "Please fill in all fields"

---

### **2. Invalid Email Format**
**Steps:**
1. Type in email field: `notanemail`
2. Click on the password field (or anywhere else)
3. **You should see:** 
   - Email field has RED border
   - Below email: "⚠️ Please enter a valid email address"

---

### **3. Short Password**
**Steps:**
1. Type valid email: `test@test.com`
2. Type in password: `123`
3. Click anywhere else (tab away from password)
4. **You should see:**
   - Password field has RED border
   - Below password: "⚠️ Password must be at least 6 characters"

---

### **4. Wrong Credentials**
**Steps:**
1. Type email: `wrong@evsu.edu.ph`
2. Type password: `wrongpassword`
3. Click "Sign In"
4. **You should see:** Red banner at top saying "Invalid credentials"

---

## 🔴 If You Don't See Errors:

### Check 1: Is the app running?
```bash
npm start
```

### Check 2: Clear cache and restart
```bash
# Stop the app (Ctrl+C)
npm start -- --clear
```

### Check 3: Hard refresh browser
- Press `Ctrl+Shift+R` (Windows)
- Or `Cmd+Shift+R` (Mac)

### Check 4: Check console for errors
- Open browser DevTools (F12)
- Look for red errors in Console tab

---

## 📸 What You Should See:

### Empty Fields:
```
┌────────────────────────────────┐
│ ⚠️ Please fill in all fields   │  ← RED BANNER
└────────────────────────────────┘
```

### Invalid Email:
```
Email: [notanemail________________]  ← RED BORDER
       ⚠️ Please enter a valid email address
```

### Short Password:
```
Password: [••••__________________]  ← RED BORDER
          ⚠️ Password must be at least 6 characters
```

---

## ✨ The error messages ARE in the code!

Location: `src/screens/auth/LoginScreen.js`
- Lines 155-160: General error banner
- Lines 188-193: Email error message
- Lines 231-236: Password error message

If you still don't see them after restarting, there might be a build issue!
