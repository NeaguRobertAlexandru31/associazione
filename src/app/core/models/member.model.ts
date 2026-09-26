export type UserRole       = 'SUPERADMIN' | 'ADMIN' | 'MEMBER';

export type DashboardPage =
  | 'overview'
  | 'members'
  | 'events'
  | 'messages'
  | 'activities'
  | 'news'
  | 'projects'
  | 'donations'
  | 'settings'
  | 'permissions'
  | 'tessera'
  | 'services';

export type PagePermissions = Partial<Record<DashboardPage, boolean>>;
export type MemberCategory = 'ordinario' | 'under26' | 'sostenitore';
export type MemberStatus   = 'in_attesa_pagamento' | 'pagamento_in_corso' | 'attivo' | 'rifiutato';

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

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImage?: string | null;
  boardRoles: string[];
  pagePermissions?: PagePermissions | null;
}

export interface MemberListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  category: MemberCategory;
  status: MemberStatus;
  membershipYear: number | null;
  profileImage?: string | null;
  boardRoles: string[];
  pagePermissions?: PagePermissions | null;
  createdAt: string;
}

export interface MembersResponse {
  direttivo: MemberListItem[];
  soci: MemberListItem[];
}

export interface Guardian {
  firstName: string;
  lastName: string;
  fiscalCode: string;
  relation: string;
  docType: string;
  docNumber: string;
  docExpiry: string;
}

export interface MemberDetail extends MemberListItem {
  isMinor: boolean;
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
  privacyBase: boolean;
  privacyNewsletter: boolean;
  privacyThirdParties: boolean;
  guardian?: Guardian | null;
  updatedAt: string;
}

export interface TesseraInfo {
  id: string;
  firstName: string;
  lastName: string;
  category: string;
  status: string;
  membershipYear: number;
  expiryDate: string;
  expired: boolean;
  daysLeft: number;
  paymentMethod: string | null;
  profileImage: string | null;
  cardCode: string;
}

export interface UpdateMemberRequest {
  firstName?: string; lastName?: string; fiscalCode?: string;
  birthDate?: string; birthPlace?: string; gender?: string;
  docType?: string; docNumber?: string; docExpiry?: string;
  email?: string; phone?: string;
  addressStreet?: string; addressZip?: string; addressCity?: string; addressProvince?: string;
  category?: MemberCategory; status?: MemberStatus; paymentMethod?: string; isMinor?: boolean;
  privacyNewsletter?: boolean; privacyThirdParties?: boolean;
}
