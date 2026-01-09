import { Parser } from 'json2csv'
import ExcelJS from 'exceljs'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

class ExportService {
  constructor() {
    this.exportDir = path.join(__dirname, '../../exports')
    this.ensureExportDir()
  }

  async ensureExportDir() {
    try {
      await fs.mkdir(this.exportDir, { recursive: true })
    } catch (error) {
      // Directory already exists
    }
  }

  async exportToCSV(results, filename) {
    const fields = [
      { label: 'Name', value: 'name' },
      { label: 'Address', value: 'address' },
      { label: 'Phone', value: 'phone' },
      { label: 'Website', value: 'website' },
      { label: 'Rating', value: 'rating' },
      { label: 'Reviews', value: 'review_count' },
      { label: 'Latitude', value: 'latitude' },
      { label: 'Longitude', value: 'longitude' },
      { label: 'Types', value: row => Array.isArray(row.types) ? row.types.join(', ') : row.types || '' },
      { label: 'Place ID', value: 'place_id' }
    ]

    const parser = new Parser({ fields })
    const csv = parser.parse(results)

    const filePath = path.join(this.exportDir, `${filename}.csv`)
    await fs.writeFile(filePath, csv, 'utf8')
    return filePath
  }

  async exportToJSON(results, filename) {
    const cleanResults = results.map(r => ({
      name: r.name,
      address: r.address,
      phone: r.phone,
      website: r.website,
      rating: r.rating,
      review_count: r.review_count,
      latitude: r.latitude,
      longitude: r.longitude,
      types: r.types,
      place_id: r.place_id
    }))

    const filePath = path.join(this.exportDir, `${filename}.json`)
    await fs.writeFile(filePath, JSON.stringify(cleanResults, null, 2), 'utf8')
    return filePath
  }

  async exportToExcel(results, filename) {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Google Maps Scraper'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet('Results')

    // Define columns
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Website', key: 'website', width: 30 },
      { header: 'Rating', key: 'rating', width: 8 },
      { header: 'Reviews', key: 'review_count', width: 10 },
      { header: 'Latitude', key: 'latitude', width: 12 },
      { header: 'Longitude', key: 'longitude', width: 12 },
      { header: 'Types', key: 'types', width: 25 },
      { header: 'Place ID', key: 'place_id', width: 30 }
    ]

    // Add rows
    results.forEach(result => {
      worksheet.addRow({
        name: result.name,
        address: result.address,
        phone: result.phone,
        website: result.website,
        rating: result.rating,
        review_count: result.review_count,
        latitude: result.latitude,
        longitude: result.longitude,
        types: Array.isArray(result.types) ? result.types.join(', ') : result.types || '',
        place_id: result.place_id
      })
    })

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: `J${results.length + 1}`
    }

    const filePath = path.join(this.exportDir, `${filename}.xlsx`)
    await workbook.xlsx.writeFile(filePath)
    return filePath
  }

  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }
}

export default new ExportService()
