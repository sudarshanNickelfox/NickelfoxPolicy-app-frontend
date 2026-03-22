import type { Acknowledgement } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function fetchUserAcknowledgements(token: string): Promise<Acknowledgement[]> {
  const res = await fetch(`${BASE_URL}/api/acknowledgements`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch acknowledgements (${res.status})`);
  const json = await res.json();
  // Handle both array and { data: [] } response shapes
  return Array.isArray(json) ? json : (json.data ?? []);
}

export async function exportAcknowledgementsCSV(token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/acknowledgements?format=csv`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-acknowledgements.csv';
  a.click();
  URL.revokeObjectURL(url);
}
