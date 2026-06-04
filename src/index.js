import { ref } from 'vue'
import axios from 'axios'

/**
 * Custom hook / composable for interacting with a local printer service.
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
     * Sync the printers list fetched from the local client to the backend Laravel database.
     */
    const syncPrintersToDatabase = async () => {
        try {
            // Ensure we have fetched printers first
            if (printers.value.length === 0) {
                await getPrinters()
            }
            if (printers.value.length === 0) {
                throw new Error('No printers found on local client to sync.')
            }

            // Sync using the global/app-level axios instance (so Laravel config/headers are applied)
            const response = await axios.post('/admin/settings/printers/local-sync', {
                printers: printers.value
            })

            return response.data
        } catch (error) {
            console.error('Failed to sync printers to database:', error)
            lastError.value = 'Sync to database failed: ' + (error.response?.data?.message || error.message)
            throw error
        }
    }

    /**
     * Print HTML content directly to the local desktop client.
     *
     * @param {string} printerName
     * @param {string} htmlContent
     * @param {string} width
     */
    const printHTML = async (printerName, htmlContent, width = '80mm') => {
        try {
            const payload = {
                html: htmlContent,
                printerName: printerName,
                width: width,
                waitUntil: 'networkidle0'
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

    return {
        isConnected,
        isChecking,
        printers,
        lastError,
        checkConnection,
        getPrinters,
        syncPrintersToDatabase,
        printHTML
    }
}
