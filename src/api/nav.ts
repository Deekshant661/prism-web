import apiClient from './client';
import type { NavPoint } from '../types/nav';
import type { UploadResult } from '../types/api';

export async function getFundNav(
  id: string,
  from?: string,
  to?: string
): Promise<NavPoint[]> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get<NavPoint[]>(`/funds/${id}/nav`, { params });
  return data;
}

export async function getSchemeNav(
  schemeId: string,
  from?: string,
  to?: string
): Promise<NavPoint[]> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get<NavPoint[]>(`/schemes/${schemeId}/nav`, { params });
  return data;
}

export async function uploadNavCsv(fundId: string, file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<UploadResult>(
    `/funds/${fundId}/nav/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function bulkUploadNav(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<UploadResult>('/nav/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
