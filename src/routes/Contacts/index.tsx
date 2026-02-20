import { Link } from 'react-router-dom'
import ContactList from './ContactList'
import { Plus } from 'lucide-react'

export default function Contacts() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl">Contactos</h1>
        <Link
          to="/contacts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </Link>
      </div>
      <ContactList />
    </div>
  )
}
