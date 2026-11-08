import { ref } from 'vue'
import axios from 'axios'

/**
 * Custom hook / composable for interacting with a local PrintBridge desktop service.
 * Fully backward-compatible with v1.0.x while adding support for Cash Drawer Kick,
 * Auto Paper Cut, Offline Queue inspection, and Health telemetry in PrintBridge v3.11.0+.
 *
 * @param {Object} [options] Configuration options.
 * @param {string} [options.port='8080'] The port of the local printer service.
 * @param {string} [options.baseUrl] The base URL of the local printer service (overrides port if provided).
 * @param {number} [options.timeout=5000] Request timeout in milliseconds.
 */
export function useLocalPrinterService(options = {}) {
    const localPort = options.port || '8080'
    const baseUrl = options.baseUrl || `http://localhost:${localPort}`

    // Create axios client for the local print server
    const localClient = axios.create({
        baseURL: baseUrl,
        timeout: options.timeout || 5000,
    })

    const isConnected = ref(false)
    const printers = ref([])
    const lastError = ref('')
    const isChecking = ref(false)

    /**
     * Checks if the local desktop print server is running and accessible.
     */
    const checkConnection = async () => {
        isChecking.value = true
        try {
            const response = await localClient.get('/printers')
            if (response.data && response.data.success) {
                isConnected.value = true
                printers.value = response.data.printers || []
                lastError.value = ''
                return true
            }
            isConnected.value = false
            return false
        } catch (error) {
            isConnected.value = false
            console.error('Local printer connection check failed:', error)
            lastError.value = `Local printing service at ${baseUrl} is unreachable. Please make sure the desktop app is running.`
            return false
        } finally {
            isChecking.value = false
        }
    }

    /**
     * Fetch printers list from the local desktop client.
     */
    const getPrinters = async () => {
        await checkConnection()
        return printers.value
    }

    /**
     * Print HTML content directly to the local desktop client.
     * Backward-compatible:
     * - printHTML(printerName, htmlContent)
     * - printHTML(printerName, htmlContent, '80mm')
     * - printHTML(printerName, htmlContent, '80mm', { cutPaper: true, openDrawer: true, jobId: '...' })
     * - printHTML(printerName, htmlContent, { width: '80mm', cutPaper: true, openDrawer: true })
     * - printHTML({ printerName, html, width, cutPaper, openDrawer, jobId })
     *
     * @param {string|Object} printerNameOrOptions
     * @param {string} [htmlContent]
     * @param {string|Object} [width='80mm']
     * @param {Object} [printOptions={}] - Optional { cutPaper, openDrawer, waitUntil, jobId }
     */
    const printHTML = async (printerNameOrOptions, htmlContent, width = '80mm', printOptions = {}) => {
        try {
            let payload

            if (printerNameOrOptions && typeof printerNameOrOptions === 'object') {
                const opts = printerNameOrOptions
                payload = {
                    html: opts.html || opts.htmlContent,
                    printerName: opts.printerName || 'Default',
                    width: opts.width || '80mm',
                    waitUntil: opts.waitUntil || 'networkidle0',
                }
                if (opts.cutPaper !== undefined) payload.cutPaper = Boolean(opts.cutPaper)
                if (opts.openDrawer !== undefined) payload.openDrawer = Boolean(opts.openDrawer)
                if (opts.jobId !== undefined) payload.jobId = String(opts.jobId)
            } else {
                const extraOpts = (width && typeof width === 'object') ? width : (printOptions || {})
                const resolvedWidth = (typeof width === 'string') ? width : (extraOpts.width || '80mm')

                payload = {
                    html: htmlContent,
                    printerName: printerNameOrOptions,
                    width: resolvedWidth,
                    waitUntil: extraOpts.waitUntil || 'networkidle0',
                }

                if (extraOpts.cutPaper !== undefined) payload.cutPaper = Boolean(extraOpts.cutPaper)
                if (extraOpts.openDrawer !== undefined) payload.openDrawer = Boolean(extraOpts.openDrawer)
                if (extraOpts.jobId !== undefined) payload.jobId = String(extraOpts.jobId)
            }

            const response = await localClient.post('/print', payload)
            if (response.data && response.data.success) {
                return response.data
            } else {
                throw new Error(response.data?.message || 'Print job failed on local client')
            }
        } catch (error) {
            console.error('Error printing HTML locally:', error)
            lastError.value = 'Local printing failed: ' + (error.response?.data?.message || error.message)
            throw error
        }
    }

    /**
     * Trigger standalone RJ11 Cash Drawer Kick pulse without printing a receipt (PrintBridge v3.11.0+).
     *
     * @param {string} [printerName='Default']
     * @param {number} [pin=0] - 0 for Pin 2 (default), 1 for Pin 5
     */
    const openCashDrawer = async (printerName = 'Default', pin = 0) => {
        try {
            const response = await localClient.post('/drawer', { printerName, pin })
            if (response.data && response.data.success) {
                return response.data
            } else {
                throw new Error(response.data?.message || 'Failed to open cash drawer')
            }
        } catch (error) {
            lastError.value = 'Cash drawer kick failed: ' + (error.response?.data?.message || error.message)
            throw error
        }
    }

    return {
        isConnected,
        isChecking,
        printers,
        lastError,
        checkConnection,
        getPrinters,
        printHTML,
        openCashDrawer,
    }
}
