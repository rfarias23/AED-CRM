import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useContactStore } from '@/stores/useContactStore'
import DataTable from '@/components/shared/DataTable'
import CountryFlag from '@/components/shared/CountryFlag'
import EmptyState from '@/components/shared/EmptyState'
import type { Contact } from '@/lib/types'
import { Plus, Users } from 'lucide-react'

const col = createColumnHelper<Contact>()

const columns = [
  col.accessor((row) => `${row.firstName} ${row.lastName}`, {
    id: 'name',
    header: 'Nombre',
    cell: (info) => (
      <Link
        to={`/contacts/${info.row.original.id}`}
        className="font-medium text-accent hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  col.accessor('title', {
    header: 'Cargo',
    cell: (info) => <span className="text-sm">{info.getValue()}</span>,
  }),
  col.accessor('company', {
    header: 'Empresa',
    cell: (info) => <span className="text-sm">{info.getValue()}</span>,
  }),
  col.accessor('country', {
    header: 'País',
    cell: (info) => (
      <span className="flex items-center gap-1.5">
        <CountryFlag code={info.getValue()} size="sm" />
        <span className="text-sm">{info.getValue()}</span>
      </span>
    ),
  }),
  col.accessor('interactions', {
    header: 'Interacciones',
    cell: (info) => (
      <span className="font-mono text-sm text-muted">{info.getValue().length}</span>
    ),
  }),
]

export default function ContactList() {
  const contacts = useContactStore((s) => s.contacts)
  const loading = useContactStore((s) => s.loading)
  const load = useContactStore((s) => s.load)

  useEffect(() => { load() }, [load])

  if (loading) return <p className="text-muted">Cargando contactos...</p>

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-12 h-12" />}
        title="Sin contactos"
        description="Comienza agregando tu primer contacto."
        action={
          <Link
            to="/contacts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Contacto
          </Link>
        }
      />
    )
  }

  return <DataTable data={contacts} columns={columns} searchPlaceholder="Buscar contactos..." />
}
