export type MemberCategory   = 'ordinario' | 'under26' | 'sostenitore';
export type MemberGender     = 'm' | 'f' | 'altro';
export type DocType          = 'ci' | 'passaporto' | 'patente';
export type PaymentMethod    = 'online' | 'contanti';
export type GuardianRelation = 'genitore' | 'tutore_legale';

export interface GuardianDto {
  firstName: string;
  lastName: string;
  fiscalCode: string;
  relation: GuardianRelation;
  docType: DocType;
  docNumber: string;
  docExpiry: string;
}

export interface CreateRegistrationRequest {
  isMinor: boolean;
  category: MemberCategory;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  birthDate: string;
  birthPlace: string;
  gender: MemberGender;
  docType: DocType;
  docNumber: string;
  docExpiry: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressZip: string;
  addressCity: string;
  addressProvince: string;
  paymentMethod: PaymentMethod;
  privacyBase: boolean;
  privacyNewsletter: boolean;
  privacyThirdParties: boolean;
  guardian?: GuardianDto;
}

export interface RegistrationResult {
  id: string;
  status: string;
  membershipYear: number;
  payment_url?: string;
  // populated locally
  firstName?: string;
  lastName?: string;
  category?: MemberCategory;
}
