import type { Agent, Approval, ConnectedApp, Identity, OversightMode, Token, VeilEvent } from './types';

/** All data is obviously fake: test card 4111..., 555 numbers, example.com. */

export const AGENTS: Agent[] = [
  {
    id: 'assistant-1',
    name: 'Assistant-1',
    status: 'active',
    last_active: 'just now',
    privacy_score: 96,
    permissions: {
      'gmail.read_inbox': 'mask',
      'gmail.send_email': 'ask',
      'calendar.read_events': 'allow',
      'drive.download_all': 'deny',
      'store.checkout': 'ask',
    },
  },
  {
    id: 'shopper-bot',
    name: 'Shopper-Bot',
    status: 'active',
    last_active: '2 min ago',
    privacy_score: 91,
    permissions: {
      'gmail.read_inbox': 'deny',
      'gmail.send_email': 'deny',
      'calendar.read_events': 'deny',
      'drive.download_all': 'deny',
      'store.checkout': 'ask',
    },
  },
  {
    id: 'planner',
    name: 'Planner',
    status: 'active',
    last_active: '8 min ago',
    privacy_score: 94,
    permissions: {
      'gmail.read_inbox': 'deny',
      'gmail.send_email': 'deny',
      'calendar.read_events': 'allow',
      'drive.download_all': 'mask',
      'store.checkout': 'deny',
    },
  },
  {
    id: 'unknown-agent',
    name: 'Unknown-Agent',
    status: 'active',
    last_active: 'yesterday',
    privacy_score: 40,
    permissions: {
      'gmail.read_inbox': 'deny',
      'gmail.send_email': 'deny',
      'calendar.read_events': 'deny',
      'drive.download_all': 'deny',
      'store.checkout': 'deny',
    },
  },
];

export const IDENTITIES: Identity[] = [
  { id: 'id-email-shop', kind: 'email', alias: 'aarav.shop@veil.alias', used_by: ['Shopper-Bot'], status: 'active' },
  { id: 'id-email-assist', kind: 'email', alias: 'aarav.mail@veil.alias', used_by: ['Assistant-1'], status: 'active' },
  { id: 'id-phone', kind: 'phone', alias: '+91 00000 00000', used_by: ['Shopper-Bot', 'Assistant-1'], status: 'active' },
  { id: 'id-name', kind: 'name', alias: 'A. Sharma', used_by: ['Assistant-1', 'Planner'], status: 'active' },
  { id: 'id-address', kind: 'address', alias: '12 Layer-2 Lane, Nebula Heights', used_by: ['Shopper-Bot'], status: 'active' },
];

export const APPROVALS: Approval[] = [
  {
    id: 'apr-seed-1',
    agent: 'Assistant-1',
    app: 'Gmail',
    action: 'send_email',
    details: 'Forward invoice to accountant@example.com',
    data_to_release: ['message body', 'recipient address'],
    status: 'pending',
    created_at: new Date(Date.now() - 36e5 * 2).toISOString(),
  },
];

export const TOOLS = [
  'gmail.read_inbox',
  'gmail.send_email',
  'calendar.read_events',
  'drive.download_all',
  'store.checkout',
] as const;

export const TOKENS: Token[] = [
  { id: 'tok-1', label: 'Assistant-1 prod', agent: 'Assistant-1', scopes: ['gmail.read_inbox', 'calendar.read_events'], created_at: new Date(Date.now() - 36e5 * 48).toISOString(), last_used: '2 min ago', status: 'active' },
  { id: 'tok-2', label: 'Shopper-Bot checkout', agent: 'Shopper-Bot', scopes: ['store.checkout'], created_at: new Date(Date.now() - 36e5 * 12).toISOString(), last_used: '14 min ago', status: 'active' },
  { id: 'tok-3', label: 'Planner calendar', agent: 'Planner', scopes: ['calendar.read_events', 'drive.download_all'], created_at: new Date(Date.now() - 36e5 * 72).toISOString(), last_used: '8 min ago', status: 'active' },
  { id: 'tok-4', label: 'Legacy (revoked)', agent: 'Assistant-1', scopes: ['gmail.send_email'], created_at: new Date(Date.now() - 36e5 * 200).toISOString(), last_used: '3 days ago', status: 'revoked' },
];

export const CONNECTED_APPS: ConnectedApp[] = [
  { id: 'gmail', name: 'Gmail', status: 'connected', connected_at: new Date(Date.now() - 36e5 * 48).toISOString(), agents_using: 1 },
  { id: 'calendar', name: 'Calendar', status: 'connected', connected_at: new Date(Date.now() - 36e5 * 48).toISOString(), agents_using: 2 },
  { id: 'drive', name: 'Drive', status: 'connected', connected_at: new Date(Date.now() - 36e5 * 72).toISOString(), agents_using: 2 },
  { id: 'slack', name: 'Slack', status: 'disconnected', connected_at: '', agents_using: 0 },
  { id: 'store', name: 'Store', status: 'connected', connected_at: new Date(Date.now() - 36e5 * 12).toISOString(), agents_using: 1 },
];

export const DEFAULT_OVERSIGHT_MODE: OversightMode = 'restricted';

export const METADATA_STRIPPED = 1842;

/** Seed: 40 past events across the 4 agents and 4 apps. */
export function seedEvents(): VeilEvent[] {
  const agents = ['Assistant-1', 'Shopper-Bot', 'Planner', 'Unknown-Agent'];
  const rows: VeilEvent[] = [];
  const now = Date.now();
  for (let i = 0; i < 40; i++) {
    const agent = agents[i % 4];
    const minsAgo = 47 + i * 23 + ((i * 7) % 13);
    const ts = new Date(now - minsAgo * 60000).toISOString();
    const n = i % 4;
    if (n === 0) {
      rows.push({
        id: `ev-seed-${i}`,
        timestamp: ts,
        agent,
        app: 'Gmail',
        tool: 'gmail.read_inbox',
        status: 'masked',
        pii_found: ['name', 'email', 'phone'],
        policy_rule: 'PII filter: mask names, emails, phones',
        original_preview: 'Hi Aarav Sharma, receipt for aarav@gmail.com, call +91 98765 43210',
        masked_preview: 'Hi [NAME_1], receipt for [EMAIL_1], call [PHONE_1]',
      });
    } else if (n === 1) {
      rows.push({
        id: `ev-seed-${i}`,
        timestamp: ts,
        agent,
        app: 'Store',
        tool: 'store.checkout',
        status: 'allowed',
        pii_found: [],
        policy_rule: 'Alias identity: use aarav.shop@veil.alias',
        original_preview: 'Checkout for order #4111 using saved card 4111 1111 1111 1111',
        masked_preview: 'Checkout for order #4111 using saved card [CARD_1]',
      });
    } else if (n === 2) {
      rows.push({
        id: `ev-seed-${i}`,
        timestamp: ts,
        agent,
        app: 'Calendar',
        tool: 'calendar.read_events',
        status: 'allowed',
        pii_found: [],
        policy_rule: 'Free/busy only',
        original_preview: 'Dentist Tue 3pm, Dr. Rao, Room 4B',
        masked_preview: 'Busy: Tuesday 15:00-16:00',
      });
    } else {
      rows.push({
        id: `ev-seed-${i}`,
        timestamp: ts,
        agent: 'Unknown-Agent',
        app: 'Drive',
        tool: 'drive.download_all',
        status: 'blocked',
        pii_found: [],
        policy_rule: 'Deny: unlisted agent, fail closed',
        original_preview: 'Bulk download of all Drive files',
        masked_preview: '—',
      });
    }
  }
  return rows;
}
