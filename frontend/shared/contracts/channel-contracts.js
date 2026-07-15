export const conversationIntents = {
  MAIN_MENU: 'main_menu',
  REPORT_INCIDENT: 'report_incident',
  REQUEST_MUNICIPAL_SERVICE: 'request_municipal_service',
  LOOKUP_TICKET: 'lookup_ticket',
  KNOW_MUNICIPALITY: 'know_municipality',
  MUNICIPAL_HISTORY: 'municipal_history',
  LANDMARKS: 'landmarks',
  MUNICIPAL_COUNCIL: 'municipal_council',
  CONTACTS_AND_HOURS: 'contacts_and_hours',
  MAYOR_PROFILE: 'mayor_profile',
  DEPUTY_MAYOR_PROFILE: 'deputy_mayor_profile',
};

export const channelAgnosticMessageTypes = {
  TEXT: 'text',
  QUICK_REPLIES: 'quick_replies',
  IMAGE_CARD: 'image_card',
  FORM_STEP: 'form_step',
  TICKET_STATUS: 'ticket_status',
};

export const whatsappReadyConversationContract = {
  version: '1.1',
  channel: 'channel-agnostic',
  targetChannels: ['web-demo', 'whatsapp-business-platform-future'],
  note: 'Contrato preparado para mapear mensajes, respuestas rápidas y pasos conversacionales a WhatsApp Business Platform sin conectar Meta todavía.',
  inboundMessage: {
    externalUserId: 'string',
    channel: 'string',
    text: 'string',
    payload: 'string | null',
    attachments: 'Array<{ type: string, url: string }>',
    timestamp: 'ISO-8601 string',
  },
  outboundMessage: {
    type: Object.values(channelAgnosticMessageTypes),
    text: 'string',
    quickReplies: 'Array<{ label: string, payload: string }>',
    media: '{ url: string, alt: string } | null',
    nextState: 'string | null',
  },
  ticketDraft: {
    category: 'string',
    sector: 'string',
    locationText: 'string',
    latitude: 'number | null',
    longitude: 'number | null',
    description: 'string',
    evidence: 'Array<{ type: string, temporaryUrl: string }>',
  },
};
