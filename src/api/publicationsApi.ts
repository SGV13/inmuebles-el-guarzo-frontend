import { api } from './axios';
import { authenticatedApi } from './authenticatedApi';
import type {
  SubmitPublicationRequestBody,
  SubmitPublicationRequestResponse,
  ListPublicationRequestsResponse,
  ListPublicationRequestsQuery,
  PublicationRequestDetail,
  ApprovePublicationRequestResponse,
  RejectPublicationRequestResponse,
  RejectPublicationRequestBody,
  StartReviewPublicationRequestResponse,
} from '../types/publication';

// POST /api/v1/publications — público, sin auth
export async function submitPublicationRequest(
  body: SubmitPublicationRequestBody,
): Promise<SubmitPublicationRequestResponse> {
  const response = await api.post<SubmitPublicationRequestResponse>(
    '/publications',
    body,
  );
  return response.data;
}

// GET /api/v1/publications — solo ADMIN
export async function listPublicationRequests(
  query: ListPublicationRequestsQuery = {},
): Promise<ListPublicationRequestsResponse> {
  const response = await authenticatedApi.get<ListPublicationRequestsResponse>(
    '/publications',
    { params: query },
  );
  return response.data;
}

// GET /api/v1/publications/:id — solo ADMIN
export async function getPublicationRequestDetail(
  id: string,
): Promise<PublicationRequestDetail> {
  const response = await authenticatedApi.get<PublicationRequestDetail>(
    `/publications/${id}`,
  );
  return response.data;
}

// POST /api/v1/publications/:id/start-review — solo ADMIN
export async function startReviewPublicationRequest(
  id: string,
): Promise<StartReviewPublicationRequestResponse> {
  const response = await authenticatedApi.post<StartReviewPublicationRequestResponse>(
    `/publications/${id}/start-review`,
  );
  return response.data;
}

// POST /api/v1/publications/:id/approve — solo ADMIN
export async function approvePublicationRequest(
  id: string,
): Promise<ApprovePublicationRequestResponse> {
  const response = await authenticatedApi.post<ApprovePublicationRequestResponse>(
    `/publications/${id}/approve`,
  );
  return response.data;
}

// POST /api/v1/publications/:id/reject — solo ADMIN
export async function rejectPublicationRequest(
  id: string,
  body: RejectPublicationRequestBody,
): Promise<RejectPublicationRequestResponse> {
  const response = await authenticatedApi.post<RejectPublicationRequestResponse>(
    `/publications/${id}/reject`,
    body,
  );
  return response.data;
}
