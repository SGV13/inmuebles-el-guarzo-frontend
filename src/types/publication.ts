// Tipos derivados directamente de los DTOs del backend.
// Cualquier cambio aquí debe reflejar un cambio real en el backend.

export type ProposedOfferType = 'SALE' | 'RENT' | 'BOTH';

export type OwnerDocumentType = 'CC' | 'CE' | 'TI' | 'PP' | 'NIT' | 'RUT';

export type PublicationRequestStatus =
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

// Body del POST /api/v1/publications (endpoint público)
export interface SubmitPublicationRequestBody {
  ownerFullName: string;
  ownerEmail: string;
  ownerPhonePrimary: string;
  ownerPhoneSecondary?: string;
  ownerDocumentType?: OwnerDocumentType;
  ownerDocumentNumber?: string;
  proposedPropertyTypeId?: string;
  proposedOfferType: ProposedOfferType;
  proposedLocation: string;
  proposedAreaM2?: number;
  proposedDescription: string;
  proposedExpectedPrice?: number;
  consentAccepted: boolean;
  captchaToken: string;
}

// Respuesta del POST /api/v1/publications
export interface SubmitPublicationRequestResponse {
  id: string;
  referenceNumber: string;
  status: PublicationRequestStatus;
  createdAt: string;
}

// Item en la lista del GET /api/v1/publications
export interface PublicationRequestSummary {
  id: string;
  referenceNumber: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPhonePrimary: string;
  proposedOfferType: ProposedOfferType;
  proposedLocation: string;
  status: PublicationRequestStatus;
  assignedAdvisorId: string | undefined;
  createdAt: string;
  decidedAt: string | undefined;
}

// Respuesta del GET /api/v1/publications
export interface ListPublicationRequestsResponse {
  items: PublicationRequestSummary[];
  total: number;
  page: number;
  limit: number;
}

// Respuesta del GET /api/v1/publications/:id
export interface PublicationRequestDetail {
  id: string;
  referenceNumber: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPhonePrimary: string;
  ownerPhoneSecondary: string | undefined;
  ownerDocumentType: string | undefined;
  ownerDocumentNumber: string | undefined;
  proposedPropertyTypeId: string | undefined;
  proposedOfferType: ProposedOfferType;
  proposedLocation: string;
  proposedAreaM2: number | undefined;
  proposedDescription: string;
  proposedExpectedPrice: number | undefined;
  status: PublicationRequestStatus;
  assignedAdvisorId: string | undefined;
  decisionAt: string | undefined;
  decisionByAdminId: string | undefined;
  decisionMotive: string | undefined;
  captchaValidated: boolean;
  submittedFromIp: string | undefined;
  submittedFromUserAgent: string | undefined;
  createdAt: string;
  updatedAt: string;
}

// Respuesta del POST /api/v1/publications/:id/approve
export interface ApprovePublicationRequestResponse {
  id: string;
  referenceNumber: string;
  status: PublicationRequestStatus;
  decisionAt: string;
}

// Respuesta del POST /api/v1/publications/:id/reject
export interface RejectPublicationRequestResponse {
  id: string;
  referenceNumber: string;
  status: PublicationRequestStatus;
  decisionAt: string;
}

// Respuesta del POST /api/v1/publications/:id/start-review
export interface StartReviewPublicationRequestResponse {
  id: string;
  referenceNumber: string;
  status: PublicationRequestStatus;
  updatedAt: string;
}

// Body del POST /api/v1/publications/:id/reject
export interface RejectPublicationRequestBody {
  decisionMotive: string;
}

// Query params del GET /api/v1/publications
export interface ListPublicationRequestsQuery {
  status?: PublicationRequestStatus;
  page?: number;
  limit?: number;
}
