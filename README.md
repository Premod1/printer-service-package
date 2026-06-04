# printer-service-package

A lightweight Vue 3 composable (`useLocalPrinterService`) designed to interface with a local desktop printing service (e.g., running on port `8080`) to fetch local printers, sync them to a backend Laravel database, and send HTML content directly to a thermal or document printer.

---

## Features

- **Connection Monitoring:** Auto-check if the local print client is running (`isConnected`, `isChecking`).
- **Printer Listing:** Fetch all system printers connected to the local desktop client.
- **Laravel DB Sync:** Automatically POST list of printers back to the Laravel backend endpoint.
- **HTML Direct Printing:** Send HTML payload (supports standard width settings e.g., `80mm`) directly to a chosen local printer.
- **Customizable Host/Port:** Configure ports, timeouts, or custom base URLs out of the box.

---

## Installation

You can install this package in your target Vue project in a few different ways:

### 1. Local Tarball (Recommended for offline/development)
Once packaged as a `.tgz` archive (e.g., `printer-service-package-1.0.0.tgz`), run this inside your main project:
```bash
npm install /path/to/printer-service-package-1.0.0.tgz
```

### 2. Local Folder Reference
You can link directly to the package directory during development:
```bash
npm install /path/to/printer-service-package
```

### 3. NPM Registry (After Publishing)
If you publish this package to an npm registry (public or private):
```bash
npm install printer-service-package
```

---

## Usage Example

Import and invoke the composable inside your Vue components (using Composition API `<script setup>`):

```vue
<template>
  <div class="printer-manager">
    <h3>Local Printer Service Status</h3>
    
    <!-- Status -->
    <div :class="['status-badge', isConnected ? 'online' : 'offline']">
      {{ isChecking ? 'Checking...' : (isConnected ? 'Connected' : 'Offline') }}
    </div>

    <button @click="checkConnection" :disabled="isChecking">
      Check Connection
    </button>

    <!-- Error Logs -->
    <p v-if="lastError" class="error-text">{{ lastError }}</p>

    <!-- Printers List -->
    <div v-if="isConnected" class="printers-section">
      <h4>Available Printers:</h4>
      <select v-model="selectedPrinter">
        <option disabled value="">Select a printer</option>
        <option v-for="printer in printers" :key="printer.name" :value="printer.name">
          {{ printer.name }} ({{ printer.displayName || 'System Default' }})
        </option>
      </select>

      <button @click="handleSync">Sync Printers to Database</button>
      
      <!-- Print Demo -->
      <div class="print-demo">
        <textarea v-model="htmlToPrint" placeholder="Enter HTML content to print"></textarea>
        <button @click="handlePrint" :disabled="!selectedPrinter">
          Print HTML
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLocalPrinterService } from 'printer-service-package'

// Initialize the composable with optional configuration
const {
  isConnected,
  isChecking,
  printers,
  lastError,
  checkConnection,
  syncPrintersToDatabase,
  printHTML
} = useLocalPrinterService({
  port: '8080',       // default local client port
  timeout: 5000       // default local request timeout
})

const selectedPrinter = ref('')
const htmlToPrint = ref('<h1>Receipt</h1><p>Thank you for your purchase!</p>')

const handleSync = async () => {
  try {
    const result = await syncPrintersToDatabase()
    alert('Printers synced to Laravel database successfully!')
  } catch (error) {
    alert('Sync failed: ' + error.message)
  }
}

const handlePrint = async () => {
  if (!selectedPrinter.value) return
  try {
    await printHTML(selectedPrinter.value, htmlToPrint.value, '80mm')
    alert('Print job sent successfully!')
  } catch (error) {
    alert('Printing failed: ' + error.message)
  }
}
</script>

<style scoped>
.printer-manager {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.status-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 4px;
  color: white;
  margin-bottom: 10px;
}
.status-badge.online { background-color: #4caf50; }
.status-badge.offline { background-color: #f44336; }
.error-text { color: red; font-size: 14px; }
.printers-section { margin-top: 15px; }
.print-demo { margin-top: 15px; display: flex; flex-direction: column; gap: 8px; }
textarea { height: 100px; }
</style>
```

---

## API Reference

### Configuration Options
When initializing `useLocalPrinterService(options)`, you can pass:
- `port` (string, default: `'8080'`): The port the desktop service is running on.
- `baseUrl` (string): Full base URL (overrides `port`).
- `timeout` (number, default: `5000`): Request timeout to the desktop service.

### State (Reactive Ref Values)
- `isConnected` (boolean): `true` if local printing service responds to `/printers`.
- `isChecking` (boolean): `true` while fetching status/printers list.
- `printers` (array): List of local printer objects returned from local client (e.g. `[{ name: 'EPSON_TM_T88VI' }]`).
- `lastError` (string): Details of the last failed request or connection issue.

### Methods
- `checkConnection()`: Pings `/printers` to verify connection and update state. Returns `Promise<boolean>`.
- `getPrinters()`: Checks connection and returns the list of printers. Returns `Promise<array>`.
- `syncPrintersToDatabase()`: Fetches printers and posts the list to `/admin/settings/printers/local-sync` (uses the global `axios` instance configured for your backend). Returns `Promise<any>`.
- `printHTML(printerName, htmlContent, width)`: Sends a POST request to `/print` with HTML, printer name, and width (default: `'80mm'`). Returns `Promise<any>`.
