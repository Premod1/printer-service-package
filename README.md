# printer-service-package

A lightweight Vue 3 composable (`useLocalPrinterService`) designed to interface with a local desktop printing service to fetch system printers and send HTML content directly to a thermal or document printer.

---

## Features

- **Connection Monitoring:** Auto-check if the local print client is running (`isConnected`, `isChecking`).
- **Printer Listing:** Fetch all system printers connected to the local desktop client.
- **HTML Direct Printing:** Send HTML payload (e.g., standard thermal receipt width `80mm`) directly to a chosen local printer.
- **Customizable Host/Port:** Configure ports, timeouts, or custom base URLs out of the box.

---

## Installation

```bash
npm install printer-service-package
```

---

## Usage Example

Here is a simple example showing how to fetch printers, select one, and print HTML:

```vue
<template>
  <div>
    <h3>Local Printer Service</h3>

    <!-- Fetch printers button -->
    <button @click="loadPrinters" :disabled="isChecking">
      {{ isChecking ? 'Loading...' : 'Get Printers' }}
    </button>

    <!-- Printer select dropdown -->
    <div v-if="printers.length > 0">
      <select v-model="selectedPrinter">
        <option disabled value="">Select a printer</option>
        <option v-for="printer in printers" :key="printer.name" :value="printer.name">
          {{ printer.name }}
        </option>
      </select>

      <!-- Print action -->
      <button @click="handlePrint" :disabled="!selectedPrinter">
        Print Test Page
      </button>
    </div>

    <!-- Error message if any -->
    <p v-if="lastError" style="color: red;">{{ lastError }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLocalPrinterService } from 'printer-service-package'

const { printers, isChecking, lastError, getPrinters, printHTML } = useLocalPrinterService()
const selectedPrinter = ref('')

const loadPrinters = async () => {
  await getPrinters()
}

const handlePrint = async () => {
  if (!selectedPrinter.value) return
  try {
    const htmlContent = '<h1>Receipt</h1><p>Thank you for your purchase!</p>'
    await printHTML(selectedPrinter.value, htmlContent, '80mm')
    alert('Printed successfully!')
  } catch (error) {
    alert('Print failed: ' + error.message)
  }
}
</script>
```

---

## API Reference

### Configuration Options
When initializing `useLocalPrinterService(options)`, you can optionally pass:
- `port` (string, default: `'8080'`): The port the desktop service is running on.
- `baseUrl` (string): Full base URL (overrides `port`).
- `timeout` (number, default: `5000`): Request timeout in milliseconds.

### State (Reactive Ref Values)
- `isConnected` (boolean): `true` if local printing service responds to `/printers`.
- `isChecking` (boolean): `true` while fetching status/printers list.
- `printers` (array): List of local printer objects returned from local client (e.g. `[{ name: 'EPSON_TM_T88VI' }]`).
- `lastError` (string): Details of the last failed request or connection issue.

### Methods
- `checkConnection()`: Pings `/printers` to verify connection and update state. Returns `Promise<boolean>`.
- `getPrinters()`: Checks connection and returns the list of printers. Returns `Promise<array>`.
- `printHTML(printerName, htmlContent, width)`: Sends a POST request to `/print` with HTML, printer name, and width (default: `'80mm'`). Returns `Promise<any>`.
