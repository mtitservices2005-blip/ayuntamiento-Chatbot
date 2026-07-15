export const contentStatuses = {
  DRAFT: 'draft',
  REVIEWED: 'reviewed',
  PUBLISHED: 'published',
};

export const municipalConfig = {
  municipality: {
    name: 'Ayuntamiento Municipal de Laguna Salada',
    shortName: 'Laguna Salada',
    tagline: 'Asistente Virtual Municipal',
  },
  branding: {
    primaryColor: '#075e54',
    secondaryColor: '#128c7e',
    backgroundColor: '#e5ddd5',
    logoUrl: '../../images/logo.png',
  },
  institutionalContent: {
    history: {
      status: contentStatuses.PUBLISHED,
      title: 'Historia del municipio',
      body: 'Laguna Salada es uno de los tres municipios de la provincia Valverde, ubicado en la región Cibao Noroeste de la República Dominicana.\n\nFue constituido como municipio mediante la Ley 916, promulgada el 12 de agosto de 1978.\n\nLimita al norte con la provincia Puerto Plata, al sur con Santa Cruz de Mao, al este con Esperanza y al oeste con la provincia Monte Cristi.\n\nSu desarrollo ha estado estrechamente relacionado con la agricultura, el comercio y el crecimiento de sus comunidades.',
      source: 'Contenido recuperado desde V1 local del proyecto.',
    },
    landmarks: [
      {
        id: 'parque-maximo-gomez',
        status: contentStatuses.PUBLISHED,
        name: 'Parque Municipal Mirador del Valle “Máximo Gómez”',
        photoUrl: './assets/placeholder-landmark.svg',
        sourceImage: 'images/parque-maximo-gomez.png',
        description: 'Uno de los principales espacios públicos de Laguna Salada, dedicado al encuentro, la recreación y la convivencia de la comunidad.',
      },
      {
        id: 'palacio-municipal',
        status: contentStatuses.PUBLISHED,
        name: 'Palacio Municipal de Laguna Salada',
        photoUrl: '../../images/palacio-municipal.png',
        description: 'Sede del gobierno local y centro de la administración municipal de Laguna Salada, provincia Valverde.',
      },
      {
        id: 'parroquia-san-antonio',
        status: contentStatuses.REVIEWED,
        name: 'Parroquia San Antonio de Padua',
        photoUrl: './assets/placeholder-landmark.svg',
        sourceImage: 'images/parroquia-san-antonio.png',
        description: 'Espacio religioso vinculado a la vida espiritual y comunitaria de Laguna Salada y a la tradición de San Antonio de Padua.',
      },
      {
        id: 'cementerio-municipal',
        status: contentStatuses.PUBLISHED,
        name: 'Cementerio Municipal de Laguna Salada',
        photoUrl: '../../images/cementerio-municipal.jpeg',
        description: 'Espacio municipal destinado al descanso y memoria de los seres queridos de la comunidad de Laguna Salada.',
      },
    ],
    authorities: {
      mayor: {
        id: 'mayor',
        status: contentStatuses.DRAFT,
        menuLabel: 'Conoce a tu alcalde',
        photoUrl: './assets/placeholder-authority.svg',
        name: '[PENDIENTE: nombre oficial del alcalde]',
        role: 'Alcalde municipal',
        term: '[PENDIENTE: período oficial]',
        biography: '[PENDIENTE: biografía oficial validada por el Ayuntamiento]',
        career: '[PENDIENTE: trayectoria oficial validada por el Ayuntamiento]',
        functions: ['[PENDIENTE: función oficial 1]', '[PENDIENTE: función oficial 2]', '[PENDIENTE: función oficial 3]'],
        institutionalMessage: '[PENDIENTE: mensaje institucional oficial]',
      },
      deputyMayor: {
        id: 'deputyMayor',
        status: contentStatuses.DRAFT,
        menuLabel: 'Conoce a tu vicealcaldesa',
        photoUrl: './assets/placeholder-authority.svg',
        name: '[PENDIENTE: nombre oficial de la vicealcaldesa]',
        role: 'Vicealcaldesa municipal',
        term: '[PENDIENTE: período oficial]',
        biography: '[PENDIENTE: biografía oficial validada por el Ayuntamiento]',
        career: '[PENDIENTE: trayectoria oficial validada por el Ayuntamiento]',
        functions: ['[PENDIENTE: función oficial 1]', '[PENDIENTE: función oficial 2]', '[PENDIENTE: función oficial 3]'],
        institutionalMessage: '[PENDIENTE: mensaje institucional oficial]',
      },
    },
    council: [
      { id: 'council-pending-1', status: contentStatuses.DRAFT, name: '[PENDIENTE: nombre oficial]', role: 'Concejo municipal', commission: '[PENDIENTE: comisión oficial]', biography: '[PENDIENTE: reseña oficial validada]' },
    ],
  },
  contacts: {
    title: 'Contactos y horarios',
    phone: '[PENDIENTE: teléfono oficial]',
    email: '[PENDIENTE: correo oficial]',
    address: '[PENDIENTE: dirección oficial]',
    openingHours: '[PENDIENTE: horarios oficiales]',
  },
  reportCategories: ['🗑️ Basura acumulada', '💡 Luminaria dañada', '🛣️ Calle deteriorada', '🌳 Árbol caído', '🚧 Obstrucción de vía', '➕ Otro problema municipal'],
};
