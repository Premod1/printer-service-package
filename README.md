# 🖨️ Printer Service Node Package

[![npm version](https://img.shields.io/npm/v/printer-service-package.svg)](https://www.npmjs.com/package/printer-service-package)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, robust, and developer-friendly Vue 3 composable package to handle local printer integrations smoothly. Perfect for Point of Sale (POS) systems, thermal receipt printers, and automated waybill/invoice printing workflows.

> [!IMPORTANT]
> **Desktop App Required:** To use this package, you must download and run the **PrintBridge** desktop application from [https://premod.me/printbridge](https://premod.me/printbridge).

---

## ✨ Features
* **🔌 Zero Configuration Connection**: Connect to the local PrintBridge hardware server queue effortlessly.
* **🖨️ Thermal & HTML Printing**: Send raw or styled HTML templates directly to thermal/receipt printers (supporting default `80mm` and custom widths).
* **🚦 Real-time Status Monitoring**: Check printer availability, connection health, and queue status reactively using Vue refs.
* **🛡️ Production Ready**: Built-in timeout setups, automated error catch handling, and detailed logs to prevent queue blocking.

---

## 📦 Installation

Install the package via NPM:

```bash
npm install printer-service-package
```

---

## Quick Start

Here is a simple example showing how to fetch available printers, select one, and print an HTML document from a Vue 3 component (using `<script setup>`):

```vue
<template>
  <div class="printer-card">
    <h3>🖨️ Print Terminal</h3>

    <!-- Fetch printers button -->
    <button @click="loadPrinters" :disabled="isChecking">
      {{ isChecking ? 'Checking connection...' : 'Refresh Printer List' }}
    </button>

    <!-- Printer selection dropdown -->
    <div v-if="printers.length > 0" class="controls">
      <select v-model="selectedPrinter">
        <option disabled value="">Select local printer</option>
        <option v-for="printer in printers" :key="printer.name" :value="printer.name">
          {{ printer.name }}
        </option>
      </select>

      <!-- Print action -->
      <button @click="handlePrint" :disabled="!selectedPrinter">
        Print Test Page
      </button>
    </div>

    <!-- Live Status / Error logs -->
    <div v-if="isConnected" class="badge online">Print Server Online</div>
    <div v-else class="badge offline">Print Server Offline</div>
    
    <p v-if="lastError" class="error-text">{{ lastError }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLocalPrinterService } from 'printer-service-package'

// Initialize the composable
const { 
  printers, 
  isConnected, 
  isChecking, 
  lastError, 
  getPrinters, 
  printHTML 
} = useLocalPrinterService({
  port: '8080',   // Port of local PrintBridge service (default: 8080)
  timeout: 5000   // Request timeout limit (default: 5000ms)
})

const selectedPrinter = ref('')

const loadPrinters = async () => {
  await getPrinters()
}

const handlePrint = async () => {
  if (!selectedPrinter.value) return
  try {
    const htmlReceipt = '<h1>Invoice #1024</h1><p>Thank you for your purchase!</p>'
    await printHTML(selectedPrinter.value, htmlReceipt, '80mm')
    alert('Print job successfully queued!')
  } catch (error) {
    alert('Print failed: ' + error.message)
  }
}
</script>

<style scoped>
.printer-card { padding: 16px; border: 1px solid #eaeaea; border-radius: 8px; }
.controls { margin: 12px 0; display: flex; gap: 8px; }
.badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: white; }
.online { background: #4caf50; }
.offline { background: #f44336; }
.error-text { color: #f44336; font-size: 13px; margin-top: 8px; }
</style>
```

---

## 🛠️ API Reference

### `useLocalPrinterService(options)`
Hook to control the local printing service. Accepts an optional configuration object:
- `port` *(string, default: `'8080'`)*: The port of the local PrintBridge app.
- `baseUrl` *(string)*: Complete custom URL (overrides port).
- `timeout` *(number, default: `5000`)*: Connection timeout in milliseconds.

#### State (Reactive Ref Values)
* **`isConnected`** *(Ref<boolean>)*: `true` if the local PrintBridge service responds to queries.
* **`isChecking`** *(Ref<boolean>)*: `true` while the service state is being verified.
* **`printers`** *(Ref<array>)*: A list of available local printer objects (e.g. `[{ name: 'Epson_TM_T88' }]`).
* **`lastError`** *(Ref<string>)*: Contains details of the last failed request.

#### Methods
* **`checkConnection()`**: Verifies if the desktop client is running. Returns `Promise<boolean>`.
* **`getPrinters()`**: Updates and returns the list of available system printers. Returns `Promise<array>`.
* **`printHTML(printerName, htmlContent, width)`**: Sends an HTML payload with the specified width (default: `'80mm'`) to the local print queue. Returns `Promise<any>`.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
