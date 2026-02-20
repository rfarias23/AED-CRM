import { db } from './db'

/**
 * Export the entire IndexedDB database as a JSON blob.
 */
export async function exportDatabaseJSON(): Promise<string> {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      countryProfiles: await db.countryProfiles.toArray(),
      exchangeRates: await db.exchangeRates.toArray(),
      feeStructures: await db.feeStructures.toArray(),
      withholdingProfiles: await db.withholdingProfiles.toArray(),
      intensityConfig: await db.intensityConfig.toArray(),
      opportunities: await db.opportunities.toArray(),
      contacts: await db.contacts.toArray(),
      expenses: await db.expenses.toArray(),
      quarterPlans: await db.quarterPlans.toArray(),
      reportSnapshots: await db.reportSnapshots.toArray(),
      settings: await db.settings.toArray(),
    },
  }
  return JSON.stringify(data, null, 2)
}

/**
 * Import a previously exported JSON backup into the database.
 * Clears all existing data first.
 */
export async function importDatabaseJSON(jsonString: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any
  try {
    data = JSON.parse(jsonString)
  } catch {
    throw new Error('El archivo no es JSON válido. Verifica que sea un backup exportado desde esta aplicación.')
  }

  if (!data.tables || typeof data.tables !== 'object') {
    throw new Error('Formato de backup inválido: falta la sección "tables". Asegúrate de importar un archivo exportado desde esta aplicación.')
  }

  await db.transaction(
    'rw',
    [
      db.countryProfiles, db.exchangeRates, db.feeStructures,
      db.withholdingProfiles, db.intensityConfig, db.opportunities,
      db.contacts, db.expenses, db.quarterPlans, db.reportSnapshots,
      db.settings,
    ],
    async () => {
      // Clear all tables
      await db.countryProfiles.clear()
      await db.exchangeRates.clear()
      await db.feeStructures.clear()
      await db.withholdingProfiles.clear()
      await db.intensityConfig.clear()
      await db.opportunities.clear()
      await db.contacts.clear()
      await db.expenses.clear()
      await db.quarterPlans.clear()
      await db.reportSnapshots.clear()
      await db.settings.clear()

      // Restore from backup (data is validated structurally but typed as any
      // since it comes from untrusted JSON — Dexie will enforce schema on write)
      const t = data.tables
      if (t.countryProfiles?.length) await db.countryProfiles.bulkAdd(t.countryProfiles)
      if (t.exchangeRates?.length) await db.exchangeRates.bulkAdd(t.exchangeRates)
      if (t.feeStructures?.length) await db.feeStructures.bulkAdd(t.feeStructures)
      if (t.withholdingProfiles?.length) await db.withholdingProfiles.bulkAdd(t.withholdingProfiles)
      if (t.intensityConfig?.length) await db.intensityConfig.bulkAdd(t.intensityConfig)
      if (t.opportunities?.length) await db.opportunities.bulkAdd(t.opportunities)
      if (t.contacts?.length) await db.contacts.bulkAdd(t.contacts)
      if (t.expenses?.length) await db.expenses.bulkAdd(t.expenses)
      if (t.quarterPlans?.length) await db.quarterPlans.bulkAdd(t.quarterPlans)
      if (t.reportSnapshots?.length) await db.reportSnapshots.bulkAdd(t.reportSnapshots)
      if (t.settings?.length) await db.settings.bulkAdd(t.settings)
    },
  )
}

/**
 * Download a string as a file.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
