export type MemberCategory = 'ordinario' | 'under26' | 'sostenitore';
export type MemberStatus  = 'in_attesa_pagamento' | 'pagamento_in_corso' | 'attivo' | 'rifiutato';
export type AdminRole     = 'SUPERADMIN' | 'ADMIN';

export type BoardRole =
  | 'presidente'
  | 'vicepresidente'
  | 'segretario'
  | 'tesoriere'
  | 'consigliere'
  | 'revisore_dei_conti'
  | 'responsabile_eventi';

export const BOARD_ROLE_LABELS: Record<BoardRole, string> = {
  presidente:          'Presidente',
  vicepresidente:      'Vicepresidente',
  segretario:          'Segretario',
  tesoriere:           'Tesoriere',
  consigliere:         'Consigliere',
  revisore_dei_conti:  'Revisore dei conti',
  responsabile_eventi: 'Responsabile eventi',
};

export interface DirettivoMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  boardRoles?: BoardRole[];
  createdAt: string;
}

export interface SocioMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  category: MemberCategory;
  status: MemberStatus;
  membershipYear: number;
  createdAt: string;
}

export interface MembersResponse {
  direttivo: DirettivoMember[];
  soci: SocioMember[];
}

export interface Guardian {
  firstName: string;
  lastName: string;
  fiscalCode: string;
  phone: string;
}

export interface UpdateSocioRequest {
  firstName?: string; lastName?: string; fiscalCode?: string;
  birthDate?: string; birthPlace?: string; gender?: string;
  docType?: string; docNumber?: string; docExpiry?: string;
  email?: string; phone?: string;
  addressStreet?: string; addressZip?: string; addressCity?: string; addressProvince?: string;
  category?: MemberCategory; status?: MemberStatus; paymentMethod?: string; isMinor?: boolean;
}

export interface SocioMemberDetail extends SocioMember {
  fiscalCode: string;
  birthDate: string;
  birthPlace: string;
  gender: string;
  docType: string;
  docNumber: string;
  docExpiry: string;
  phone: string;
  addressStreet: string;
  addressZip: string;
  addressCity: string;
  addressProvince: string;
  paymentMethod: string;
  isMinor: boolean;
  privacyBase: boolean;
  privacyNewsletter: boolean;
  privacyThirdParties: boolean;
  guardian?: Guardian | null;
  updatedAt: string;
}
