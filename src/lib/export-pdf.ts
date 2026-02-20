import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

/**
 * Export an HTML element to a multi-page PDF.
 * Uses html-to-image (better CSS variable support than html2canvas)
 * then splits across A4 pages with jsPDF.
 */
export async function exportToPDF(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  // Capture element as PNG data URL
  const imgData = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
  })

  // Load image to get natural dimensions
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Error cargando imagen del reporte'))
    img.src = imgData
  })

  const imgWidth = 210 // A4 width in mm
  const pageHeight = 297 // A4 height in mm
  const imgHeight = (img.naturalHeight * imgWidth) / img.naturalWidth

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
