import apiClient from './client';
import type { FactsheetExtraction, FactsheetConfirmPayload } from '../types/api';

export async function uploadFactsheet(file: File): Promise<FactsheetExtraction> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<FactsheetExtraction>(
    '/factsheets/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function confirmFactsheet(payload: FactsheetConfirmPayload): Promise<void> {
  await apiClient.post('/factsheets/confirm', payload);
}
