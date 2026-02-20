import * as XLSX from 'xlsx'
import { db } from './db'

/**
 * Export opportunities to an Excel file.
 */
export async function exportOpportunitiesToExcel(): Promise<void> {
  try {
    const opportunities = await db.opportunities.toArray()

    const rows = opportunities.map((o) => ({
      'Nombre': o.name,
      'Cliente': o.client,
      'País': o.country,
      'Sector': o.sector,
      'Etapa': o.stage,
      'Valor Original': o.valueOriginal,
      'Moneda': o.valueCurrency,
      'Valor USD': o.valueUSD,
      '% ASCH': o.aschPercentage,
      'Valor ASCH USD': o.aschValueUSD,
      'PoA': o.probabilityOfAward,
      'Tipo Contrato': o.contractType,
      'Tipo Cliente': o.clientType,
      'Cierre Est.': o.expectedCloseDate,
      'Inicio Est.': o.expectedStartDate,
      'Creado': o.createdAt,
      'Actualizado': o.updatedAt,
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Oportunidades')
    XLSX.writeFile(wb, `Oportunidades_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (err) {
    throw new Error(`Error exportando oportunidades a Excel: ${err instanceof Error ? err.message : err}`)
  }
}

/**
 * Export expenses to an Excel file.
 */
export async function exportExpensesToExcel(): Promise<void> {
  try {
    const expenses = await db.expenses.toArray()
    const opportunities = await db.opportunities.toArray()
    const oppMap = new Map(opportunities.map((o) => [o.id, o]))

    const rows = expenses.map((e) => {
      const opp = e.opportunityId ? oppMap.get(e.opportunityId) : null
      return {
        'Fecha': e.date,
        'Tipo': e.type,
        'Descripción': e.description,
        'Proveedor': e.vendor,
        'País': opp?.country ?? '',
        'Monto Original': e.amountOriginal,
        'Moneda': e.currency,
        'Monto USD': e.amountUSD,
        'Recibo': e.receiptRef,
        'Oportunidad': opp?.name ?? '',
      }
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Gastos')
    XLSX.writeFile(wb, `Gastos_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (err) {
    throw new Error(`Error exportando gastos a Excel: ${err instanceof Error ? err.message : err}`)
  }
}

/**
 * Export contacts to an Excel file.
 */
export async function exportContactsToExcel(): Promise<void> {
  try {
    const contacts = await db.contacts.toArray()

    const rows = contacts.map((c) => ({
      'Nombre': `${c.firstName} ${c.lastName}`,
      'Cargo': c.title,
      'Empresa': c.company,
      'País': c.country,
      'Email': c.email,
      'Teléfono': c.phone,
      'LinkedIn': c.linkedIn,
      'Interacciones': c.interactions.length,
      'Creado': c.createdAt,
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos')
    XLSX.writeFile(wb, `Contactos_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (err) {
    throw new Error(`Error exportando contactos a Excel: ${err instanceof Error ? err.message : err}`)
  }
}
