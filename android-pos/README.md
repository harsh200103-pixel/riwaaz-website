# 👑 Riwaaz POS - Native Android App (`Riwaaz-POS.apk`)

This folder contains the complete native Android wrapper configuration for **Riwaaz by Eshmira Admin POS** with direct Bluetooth ESC/POS printing for **Seznik Dev Thermal Printers**.

---

## ✨ Features
1. **Direct Bluetooth Kiosk Mode:** Loads `https://riwaaz-website.vercel.app/admin` in a dedicated full-screen Android app.
2. **Native Bluetooth Bridge (`BluetoothPOS`):** Tapping **⚡ Connect Printer** connects directly to your paired **Seznik Dev** thermal receipt or barcode printer.
3. **0.2s Direct Printing:** Sends raw ESC/POS byte commands directly to the thermal printer without browser print popups.

---

## 🚀 How to Build the APK (for Android Phones & Tablets)

1. **Install Dependencies:**
   ```bash
   cd android-pos
   npm install
   ```

2. **Add Android Platform:**
   ```bash
   npx cap add android
   ```

3. **Open in Android Studio & Build APK:**
   ```bash
   npx cap open android
   ```
   * Inside Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   * Your ready-to-install **`Riwaaz-POS.apk`** will be generated in `app/build/outputs/apk/debug/app-debug.apk`!

---

## 💡 Using Direct Web Bluetooth in Chrome Android (Zero-Install Option)
Even without compiling the APK, you can open `https://riwaaz-website.vercel.app/admin` in **Google Chrome on Android** and tap **⚡ Connect Printer** in the top bar to connect directly to your Seznik Dev printer via Web Bluetooth API!
