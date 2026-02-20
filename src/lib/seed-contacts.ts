import { v4 as uuid } from 'uuid'
import type { Contact, Interaction } from './types'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function makeInteraction(
  overrides: Partial<Interaction> & Pick<Interaction, 'type' | 'format' | 'quality' | 'summary' | 'contactId'>,
): Interaction {
  return {
    id: uuid(),
    type: overrides.type,
    format: overrides.format,
    quality: overrides.quality,
    summary: overrides.summary,
    outcome: overrides.outcome ?? '',
    nextAction: overrides.nextAction ?? '',
    nextActionDate: overrides.nextActionDate,
    contactId: overrides.contactId,
    additionalContactIds: overrides.additionalContactIds ?? [],
    opportunityId: overrides.opportunityId,
    duration: overrides.duration,
    date: overrides.date ?? daysAgo(Math.floor(Math.random() * 30)),
    createdAt: new Date().toISOString(),
  }
}

export function createSeedContacts(): Contact[] {
  const now = new Date().toISOString()

  const contacts: Contact[] = [
    // ── Chile (6) ──────────────────────────
    {
      id: uuid(), firstName: 'Alejandro', lastName: 'Vásquez',
      title: 'Director de Proyectos', company: 'Minera Escondida',
      country: 'CL', email: 'a.vasquez@escondida.cl', phone: '+56 9 8765 4321',
      notes: 'Contacto principal para proyectos mineros en Atacama.',
      tags: ['mining', 'decision-maker'], interactions: [], createdAt: now, updatedAt: daysAgo(3),
    },
    {
      id: uuid(), firstName: 'Catalina', lastName: 'Muñoz',
      title: 'Gerente de Desarrollo', company: 'ENEL Chile',
      country: 'CL', email: 'cmunoz@enel.cl',
      notes: 'Interesada en proyectos de energía renovable.',
      tags: ['energy', 'renewables'], interactions: [], createdAt: now, updatedAt: daysAgo(7),
    },
    {
      id: uuid(), firstName: 'Roberto', lastName: 'Figueroa',
      title: 'Jefe de Licitaciones', company: 'MOP Chile',
      country: 'CL', email: 'rfigueroa@mop.gov.cl',
      notes: 'Contacto gubernamental para infraestructura pública.',
      tags: ['government', 'infrastructure'], interactions: [], createdAt: now, updatedAt: daysAgo(15),
    },
    {
      id: uuid(), firstName: 'María José', lastName: 'Araya',
      title: 'VP Operaciones', company: 'AES Gener',
      country: 'CL', email: 'mjaraya@aesgener.cl', phone: '+56 2 2686 8000',
      notes: 'Key stakeholder para LNG Talcahuano.',
      tags: ['energy', 'lng', 'stakeholder'], interactions: [], createdAt: now, updatedAt: daysAgo(5),
    },
    {
      id: uuid(), firstName: 'Gonzalo', lastName: 'Pérez',
      title: 'Gerente Técnico', company: 'Alto Maipo SpA',
      country: 'CL', email: 'gperez@altomaipo.cl',
      notes: 'Proyecto perdido (Alto Maipo II), mantener relación.',
      tags: ['hydroelectric', 'past-client'], interactions: [], createdAt: now, updatedAt: daysAgo(45),
    },
    {
      id: uuid(), firstName: 'Francisca', lastName: 'Soto',
      title: 'Directora Comercial', company: 'Colbún',
      country: 'CL', email: 'fsoto@colbun.cl',
      notes: 'Potencial para futuros proyectos eólicos.',
      tags: ['energy', 'wind', 'prospect'], interactions: [], createdAt: now, updatedAt: daysAgo(20),
    },

    // ── Perú (5) ──────────────────────────
    {
      id: uuid(), firstName: 'Carlos', lastName: 'Huamán',
      title: 'Director de Ingeniería', company: 'Sociedad Minera Cerro Verde',
      country: 'PE', email: 'chuaman@cerroverde.pe', phone: '+51 54 288 800',
      notes: 'Contacto para ampliación Cerro Verde.',
      tags: ['mining', 'decision-maker'], interactions: [], createdAt: now, updatedAt: daysAgo(10),
    },
    {
      id: uuid(), firstName: 'Ana Lucía', lastName: 'Torres',
      title: 'Gerente de Proyectos', company: 'Engie Perú',
      country: 'PE', email: 'altorres@engie.pe',
      notes: 'Contacto clave para Central Solar Moquegua.',
      tags: ['energy', 'solar', 'key-contact'], interactions: [], createdAt: now, updatedAt: daysAgo(4),
    },
    {
      id: uuid(), firstName: 'Jorge', lastName: 'Mendoza',
      title: 'Subdirector de Inversión', company: 'ProInversión',
      country: 'PE', email: 'jmendoza@proinversion.gob.pe',
      notes: 'Contacto gubernamental para licitaciones de infraestructura.',
      tags: ['government', 'infrastructure'], interactions: [], createdAt: now, updatedAt: daysAgo(25),
    },
    {
      id: uuid(), firstName: 'Daniela', lastName: 'Quispe',
      title: 'Jefa de Compras', company: 'Graña y Montero',
      country: 'PE', email: 'dquispe@gym.pe',
      notes: 'EPC contractor, potencial para teaming.',
      tags: ['epc', 'teaming'], interactions: [], createdAt: now, updatedAt: daysAgo(35),
    },
    {
      id: uuid(), firstName: 'Miguel', lastName: 'Castillo',
      title: 'Gerente de Desarrollo', company: 'Enel Perú',
      country: 'PE', email: 'mcastillo@enel.pe',
      notes: 'Seguimiento de proyectos renovables en el sur.',
      tags: ['energy', 'renewables'], interactions: [], createdAt: now, updatedAt: daysAgo(12),
    },

    // ── Colombia (4) ──────────────────────
    {
      id: uuid(), firstName: 'Andrés', lastName: 'Restrepo',
      title: 'Director de Infraestructura', company: 'ANI Colombia',
      country: 'CO', email: 'arestrepo@ani.gov.co',
      notes: 'Responsable de concesiones 5G para Metro Bogotá.',
      tags: ['government', 'infrastructure', 'metro'], interactions: [], createdAt: now, updatedAt: daysAgo(8),
    },
    {
      id: uuid(), firstName: 'Laura', lastName: 'Mejía',
      title: 'Gerente de Puertos', company: 'Grupo Argos',
      country: 'CO', email: 'lmejia@grupoargos.com', phone: '+57 4 319 0900',
      notes: 'Contacto principal para Puerto Multimodal Barranquilla.',
      tags: ['ports', 'infrastructure', 'key-contact'], interactions: [], createdAt: now, updatedAt: daysAgo(6),
    },
    {
      id: uuid(), firstName: 'Felipe', lastName: 'Herrera',
      title: 'VP Finanzas', company: 'ISA Group',
      country: 'CO', email: 'fherrera@isa.com.co',
      notes: 'Potencial financiador de proyectos de transmisión.',
      tags: ['energy', 'finance', 'prospect'], interactions: [], createdAt: now, updatedAt: daysAgo(18),
    },
    {
      id: uuid(), firstName: 'Valentina', lastName: 'Ospina',
      title: 'Coordinadora Técnica', company: 'Metro de Bogotá',
      country: 'CO', email: 'vospina@metrodebogota.gov.co',
      notes: 'Coordinación técnica del proyecto Metro Bogotá Línea 1.',
      tags: ['government', 'metro', 'technical'], interactions: [], createdAt: now, updatedAt: daysAgo(11),
    },
  ]

  return contacts
}

/**
 * Creates 12 seed interactions distributed across contacts.
 * Returns pairs of [contactId, Interaction] to be added.
 */
export function createSeedInteractions(contacts: Contact[]): Array<{ contactId: string; interaction: Interaction }> {
  if (contacts.length < 12) return []

  return [
    {
      contactId: contacts[0].id, // Alejandro Vásquez
      interaction: makeInteraction({
        type: 'meeting', format: 'in_person', quality: 'high', duration: 90,
        summary: 'Reunión de kick-off para explorar expansión Planta Desaladora Atacama III.',
        outcome: 'Interés confirmado, solicitan propuesta técnica.',
        nextAction: 'Preparar propuesta técnica preliminar',
        nextActionDate: daysAgo(-7),
        contactId: contacts[0].id, date: daysAgo(3),
      }),
    },
    {
      contactId: contacts[1].id, // Catalina Muñoz
      interaction: makeInteraction({
        type: 'call', format: 'virtual', quality: 'medium', duration: 45,
        summary: 'Llamada de seguimiento sobre portafolio renovable ENEL.',
        outcome: 'Mencionó nuevo parque eólico en evaluación para 2027.',
        nextAction: 'Enviar perfil de experiencia en eólica',
        contactId: contacts[1].id, date: daysAgo(7),
      }),
    },
    {
      contactId: contacts[3].id, // María José Araya
      interaction: makeInteraction({
        type: 'presentation', format: 'in_person', quality: 'high', duration: 120,
        summary: 'Presentación de ASCH SPA para proyecto LNG Talcahuano.',
        outcome: 'Buena recepción. Piden reunión técnica con equipo de ingeniería.',
        nextAction: 'Coordinar reunión técnica con equipo AES',
        nextActionDate: daysAgo(-14),
        contactId: contacts[3].id, date: daysAgo(5),
      }),
    },
    {
      contactId: contacts[6].id, // Carlos Huamán
      interaction: makeInteraction({
        type: 'site_visit', format: 'in_person', quality: 'high', duration: 240,
        summary: 'Visita técnica a instalaciones Cerro Verde, Arequipa.',
        outcome: 'Identificadas 3 áreas de ampliación potencial.',
        nextAction: 'Documentar hallazgos y enviar resumen',
        contactId: contacts[6].id, date: daysAgo(10),
      }),
    },
    {
      contactId: contacts[7].id, // Ana Lucía Torres
      interaction: makeInteraction({
        type: 'meeting', format: 'virtual', quality: 'high', duration: 60,
        summary: 'Revisión de avance de propuesta Central Solar Moquegua.',
        outcome: 'Ajustes solicitados en cronograma y equipo propuesto.',
        nextAction: 'Revisar y reenviar propuesta ajustada',
        nextActionDate: daysAgo(-3),
        contactId: contacts[7].id, date: daysAgo(4),
      }),
    },
    {
      contactId: contacts[8].id, // Jorge Mendoza
      interaction: makeInteraction({
        type: 'event', format: 'in_person', quality: 'medium', duration: 180,
        summary: 'Conferencia ProInversión — networking en evento anual de infraestructura.',
        outcome: 'Recopilados datos de 5 proyectos en cartera 2026.',
        nextAction: 'Analizar cartera y priorizar oportunidades',
        contactId: contacts[8].id, date: daysAgo(25),
      }),
    },
    {
      contactId: contacts[11].id, // Andrés Restrepo
      interaction: makeInteraction({
        type: 'meeting', format: 'in_person', quality: 'high', duration: 75,
        summary: 'Reunión en ANI sobre proceso de licitación Metro Bogotá.',
        outcome: 'Confirmado timeline de licitación para Q3 2026.',
        nextAction: 'Preparar documentación de precalificación',
        nextActionDate: daysAgo(-21),
        contactId: contacts[11].id, date: daysAgo(8),
      }),
    },
    {
      contactId: contacts[12].id, // Laura Mejía
      interaction: makeInteraction({
        type: 'call', format: 'virtual', quality: 'medium', duration: 30,
        summary: 'Seguimiento sobre estado de factibilidad Puerto Barranquilla.',
        outcome: 'Estudio de factibilidad en curso, resultado esperado en 6 semanas.',
        nextAction: 'Agendar llamada de seguimiento en 4 semanas',
        contactId: contacts[12].id, date: daysAgo(6),
      }),
    },
    {
      contactId: contacts[2].id, // Roberto Figueroa
      interaction: makeInteraction({
        type: 'email', format: 'async', quality: 'low', duration: undefined,
        summary: 'Envío de credenciales ASCH SPA para registro de proveedores MOP.',
        outcome: 'Acuse de recibo confirmado.',
        nextAction: 'Esperar resultado de registro',
        contactId: contacts[2].id, date: daysAgo(15),
      }),
    },
    {
      contactId: contacts[5].id, // Francisca Soto
      interaction: makeInteraction({
        type: 'social', format: 'in_person', quality: 'medium', duration: 45,
        summary: 'Almuerzo networking en Club de la Unión con equipo Colbún.',
        outcome: 'Buena disposición para explorar colaboración futura.',
        nextAction: 'Enviar información de experiencia ASCH en eólica',
        contactId: contacts[5].id, date: daysAgo(20),
      }),
    },
    {
      contactId: contacts[14].id, // Valentina Ospina
      interaction: makeInteraction({
        type: 'proposal_delivery', format: 'async', quality: 'high', duration: undefined,
        summary: 'Entrega de propuesta técnica para supervisión Metro Bogotá Línea 1.',
        outcome: 'Propuesta recibida, en evaluación por comité técnico.',
        nextAction: 'Seguimiento con comité en 2 semanas',
        nextActionDate: daysAgo(-10),
        contactId: contacts[14].id, date: daysAgo(11),
      }),
    },
    {
      contactId: contacts[10].id, // Miguel Castillo
      interaction: makeInteraction({
        type: 'meeting', format: 'virtual', quality: 'medium', duration: 50,
        summary: 'Exploración de oportunidades renovables en el sur de Perú con Enel.',
        outcome: 'Identificado proyecto solar de 200MW en Tacna.',
        nextAction: 'Solicitar términos de referencia preliminares',
        contactId: contacts[10].id, date: daysAgo(12),
      }),
    },
  ]
}
