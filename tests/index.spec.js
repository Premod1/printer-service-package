import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLocalPrinterService } from '../src/index.js'
import axios from 'axios'

// Mock axios
vi.mock('axios', () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
    create: vi.fn(),
  }
  // Make create return the mockAxios object so chained get/post requests work
  mockAxios.create.mockReturnValue(mockAxios)
  return {
    default: mockAxios
  }
})

describe('useLocalPrinterService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default states', () => {
    const service = useLocalPrinterService()
    expect(service.isConnected.value).toBe(false)
    expect(service.isChecking.value).toBe(false)
    expect(service.printers.value).toEqual([])
    expect(service.lastError.value).toBe('')
  })

  it('should check connection and update printers on success', async () => {
    const service = useLocalPrinterService()
    
    // Setup mock response for the localClient.get('/printers')
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        printers: [{ name: 'Printer 1' }, { name: 'Printer 2' }]
      }
    })

    const connected = await service.checkConnection()
    
    expect(connected).toBe(true)
    expect(service.isConnected.value).toBe(true)
    expect(service.printers.value).toEqual([{ name: 'Printer 1' }, { name: 'Printer 2' }])
    expect(service.lastError.value).toBe('')
    expect(axios.get).toHaveBeenCalledWith('/printers')
  })

  it('should handle check connection failure', async () => {
    const service = useLocalPrinterService()
    
    axios.get.mockRejectedValueOnce(new Error('Network Error'))

    const connected = await service.checkConnection()
    
    expect(connected).toBe(false)
    expect(service.isConnected.value).toBe(false)
    expect(service.lastError.value).toContain('Local printing service at http://localhost:8080 is unreachable')
  })

  it('should sync printers to database successfully', async () => {
    const service = useLocalPrinterService()

    // 1. Mock connection check printers
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        printers: [{ name: 'Printer 1' }]
      }
    })

    // 2. Mock database sync post call (this uses the global/default axios instance)
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: 'Synced' }
    })

    const result = await service.syncPrintersToDatabase()
    
    expect(result.success).toBe(true)
    expect(axios.post).toHaveBeenCalledWith('/admin/settings/printers/local-sync', {
      printers: [{ name: 'Printer 1' }]
    })
  })

  it('should fail database sync if no printers found', async () => {
    const service = useLocalPrinterService()

    axios.get.mockResolvedValueOnce({
      data: { success: true, printers: [] }
    })

    await expect(service.syncPrintersToDatabase()).rejects.toThrow('No printers found on local client to sync.')
  })

  it('should print HTML successfully', async () => {
    const service = useLocalPrinterService()

    axios.post.mockResolvedValueOnce({
      data: { success: true }
    })

    const result = await service.printHTML('Printer 1', '<h1>Hello</h1>', '80mm')
    
    expect(result.success).toBe(true)
    expect(axios.post).toHaveBeenCalledWith('/print', {
      html: '<h1>Hello</h1>',
      printerName: 'Printer 1',
      width: '80mm',
      waitUntil: 'networkidle0'
    })
  })
})
