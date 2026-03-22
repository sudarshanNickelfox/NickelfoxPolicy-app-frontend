export interface User {
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface Session {
  user: User;
  accessToken: string;
  role: 'admin' | 'employee';
}

export type PolicyStatus = 'unread' | 'read' | 'acknowledged';

export type PolicyFileType = 'pdf' | 'docx';

export interface Policy {
  id: string;
  title: string;
  description: string;
  category: string;
  department: string;
  version: string;
  fileType: PolicyFileType;
  status: PolicyStatus;
  effectiveDate: string;
  updatedAt: string;
  requiresAcknowledgement: boolean;
  isArchived: boolean;
}

export interface PolicyDetail extends Policy {
  fileUrl: string;
  officeOnlineUrl?: string;
  signed_url: string | null;
}

export interface PolicyPreview {
  officeOnlineUrl?: string;
  redirectUrl?: string;
}

export interface PolicyFilters {
  categories: string[];
  departments: string[];
}

export interface PolicyQueryParams {
  status?: PolicyStatus | '';
  category?: string;
  department?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedPolicies {
  data: Policy[];
  nextCursor: string | null;
  total: number;
}

export interface Acknowledgement {
  id: string;
  policyId: string;
  policyTitle: string;
  policyVersion: string;
  acknowledgedAt: string;
  isArchived: boolean;
}

export interface AcknowledgementResponse {
  acknowledgement_id: string;
  acknowledged_at: string;
}


export interface AcknowledgementReport {
  id: string;
  userName: string;
  userEmail: string;
  policyTitle: string;
  policyVersion: string;
  acknowledgedAt: string;
  department: string;
}

export interface AdminAcknowledgementsReport {
  data: AcknowledgementReport[];
  total: number;
  complianceRate: number;
}
