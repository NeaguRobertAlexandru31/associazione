export type MemberCategory = 'ordinario' | 'under26' | 'sostenitore';
export type MemberStatus  = 'in_attesa_pagamento' | 'pagamento_in_corso' | 'attivo' | 'rifiutato';
export type AdminRole     = 'SUPERADMIN' | 'ADMIN';

export interface DirettivoMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
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
