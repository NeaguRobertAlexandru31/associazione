export type SubscriptionType = 'simpatizzante' | 'sostenitore' | 'benemerito';
export type AdminRole = 'SUPERADMIN' | 'ADMIN';

export interface DirettivoMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
}

export interface SocioMember {
  id: string;
  name: string;
  email: string;
  subscription: SubscriptionType;
  profileImage: string | null;
  createdAt: string;
}

export interface MembersResponse {
  direttivo: DirettivoMember[];
  soci: SocioMember[];
}
