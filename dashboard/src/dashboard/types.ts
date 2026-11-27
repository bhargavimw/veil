/** Exact data contract for the VEIL dashboard demo. A real backend can replace the mocks. */

export type Status = 'allowed' | 'masked' | 'approval_needed' | 'blocked';

export interface VeilEvent {
  id: string;
  timestamp: string; // ISO 8601
  agent: string;
  app: string;
  tool: string;
  status: Status;
  pii_found: string[];
  policy_rule: string;
  original_preview: string;
  masked_preview: string;
}

export type PermissionValue = 'allow' | 'mask' | 'ask' | 'deny';

export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'revoked';
  last_active: string;
  privacy_score: number;
  permissions: Record<string, PermissionValue>;
}

export type IdentityKind = 'email' | 'phone' | 'name' | 'address';

export interface Identity {
  id: string;
  kind: IdentityKind;
  alias: string;
  used_by: string[];
  status: 'active' | 'revoked';
}

export interface Approval {
  id: string;
  agent: string;
  app: string;
  action: string;
  details: string;
  data_to_release: string[];
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
}

export interface ToastMsg {
  id: number;
  text: string;
  tone: 'success' | 'danger' | 'info';
}

export type OversightMode = 'restricted' | 'flexible' | 'unrestricted';

export interface Token {
  id: string;
  label: string;
  agent: string;
  scopes: string[];
  created_at: string;
  last_used: string;
  status: 'active' | 'revoked';
}

export interface ConnectedApp {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  connected_at: string;
  agents_using: number;
}
