import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Export an HTML element to a multi-page PDF.
 * Uses html2canvas to capture the element as an image, then splits across pages.
 */
export async function exportToPDF(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  let canvas: HTMLCanvasElement

  try {
    // Try scale 2 first (high-quality)
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })
  } catch {
    // Fallback to scale 1 if canvas is too large (OOM on big reports)
    console.warn('html2canvas failed at scale 2, retrying at scale 1')
    try {
      canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })
    } catch (err) {
      throw new Error(`Error generando PDF: el reporte es demasiado grande para capturar. ${err instanceof Error ? err.message : err}`)
    }
  }

  const imgData = canvas.toDataURL('image/png')
  const imgWidth = 210 // A4 width in mm
  const pageHeight = 297 // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const pdf = new jsPDF('p', 'mm', 'a4')
  let heightLeft = imgHeight
  let position = 0

  // First page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  // Additional pages
  while (heightLeft > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(`${filename}.pdf`)
}
