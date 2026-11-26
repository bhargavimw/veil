/**
 * All copy for the VEIL landing site lives here.
 * Edit text freely — sections read from these exports.
 */

export const nav = {
  links: [
    { label: 'Problem', href: '#problem' },
    { label: 'Solution', href: '#solution' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Product', href: '#product' },
    { label: 'Features', href: '#features' },
    { label: 'Roadmap', href: '#roadmap' },
  ],
  cta: { label: 'Live demo', href: '/dashboard' },
};

export const hero = {
  eyebrow: 'MCP PRIVACY GATEWAY',
  titleBefore: 'AI agents run our digital lives.',
  titleAccent: 'Who protects ours?',
  subtext:
    'VEIL sits between you and every AI agent, so apps get what they need and nothing more.',
  primaryCta: { label: 'See the problem', href: '#problem' },
  secondaryCta: { label: 'Open live demo', href: '/dashboard' },
};

export const problem = {
  eyebrow: 'THE PROBLEM',
  title: 'They get access to ',
  titleAccent: 'everything',
  body:
    'To be useful, AI agents connected through MCP usually get full-scope access to your accounts.',
  chips: ['Name', 'Phone', 'ID Card', 'Credit Card', 'Address', 'Messages'],
};

export const leak = {
  eyebrow: 'THE LEAK',
  title: 'Where does your data go?',
  cards: [
    {
      title: 'No visibility',
      body: "You can't see what an agent read or sent.",
    },
    {
      title: 'No control',
      body: 'Access is all-or-nothing and hard to revoke.',
    },
    {
      title: 'No boundaries',
      body: 'Sensitive data leaks into third-party logs, prompts and model providers.',
    },
  ],
};

export const stakes = {
  eyebrow: 'WHY IT MATTERS',
  title: 'One leak is enough',
  risks: [
    {
      title: 'Identity theft',
      body: 'A stolen profile of names, IDs and addresses can be reused for years.',
    },
    {
      title: 'Financial fraud',
      body: 'Cards and payment details in agent logs become direct losses.',
    },
    {
      title: 'Phishing & impersonation',
      body: 'Leaked messages and contacts make convincing attacks trivial.',
    },
    {
      title: 'Lost trust',
      body: 'Once shared, you never know where your data ends up.',
    },
  ],
  closing:
    'As agents get more powerful, the risk grows. Today people either avoid useful agents or over-share.',
};

export const solution = {
  eyebrow: 'THE SOLUTION',
  title: 'Use AI agents without giving away yourself.',
  body:
    'VEIL is privacy middleware that sits between your agents and every MCP service. Agents only receive the data they need to do the task.',
  before: {
    label: 'Without VEIL',
    line: 'Full access to everything',
    points: ['Whole inbox, calendar and drive', 'Real name, card, phone, address', 'No record of what was read'],
  },
  after: {
    label: 'With VEIL',
    line: "Only what's necessary",
    points: ['Scoped, revocable permissions', 'Aliases and masked fields', 'Every request audited'],
  },
};

export const howItWorks = {
  eyebrow: 'HOW IT WORKS',
  title: 'One gateway, four protections',
  steps: [
    {
      title: 'Virtual identity',
      body: 'Your real email becomes an alias the app never learns.',
    },
    {
      title: 'Permission check',
      body: 'Every request is allowed, masked, held for approval — or denied.',
    },
    {
      title: 'Sensitive-data filter',
      body: '"4111 1111 1111 1111" leaves as "[CARD_1]".',
    },
    {
      title: 'Audit log',
      body: 'Every action the agent takes is recorded for you.',
    },
  ],
  footer: 'Responses are filtered on the way back too.',
};

export const productPreview = {
  eyebrow: 'PRODUCT PREVIEW',
  title: 'This is what VEIL looks like',
  sidebar: ['Dashboard', 'Agents', 'Identities', 'Permissions', 'Activity', 'Settings'],
  stats: [
    { label: 'Requests protected', value: 1248 },
    { label: 'PII items masked', value: 312 },
    { label: 'Agents connected', value: 4 },
    { label: 'Privacy score', value: 96 },
  ],
  activity: [
    { agent: 'Assistant-1', app: 'Gmail', action: 'Read inbox', status: 'Masked' },
    { agent: 'Shopper-Bot', app: 'Store', action: 'Checkout', status: 'Approval needed' },
    { agent: 'Planner', app: 'Calendar', action: 'Read events', status: 'Allowed' },
    { agent: 'Unknown-Agent', app: 'Drive', action: 'Download all', status: 'Blocked' },
  ],
  agentView: {
    real: 'Hi Aarav, your card 4111 1111 1111 1111, call 98xxxxxx10',
    masked: 'Hi [NAME_1], your card [CARD_1], call [PHONE_1]',
  },
  identities: [
    { label: 'Email alias', value: 'aarav.shop@veil.alias', created: 'Created for shopping' },
    { label: 'Phone alias', value: '+1 (555) 013-4477', created: 'Virtual number · forward to you' },
  ],
  approvePrompt: 'Shopper-Bot wants to complete checkout on Store with your aliased identity.',
};

export const features = {
  eyebrow: 'FEATURES',
  title: 'Everything you need to stay in control',
  items: [
    {
      title: 'Virtual identities',
      body: 'Per-service aliases for email, phone and address — revoke anytime.',
    },
    {
      title: 'Sensitive-data filtering',
      body: 'Cards, IDs, OTPs and secrets are masked before they leave.',
    },
    {
      title: 'Permission-based access control',
      body: 'Fine-grained allow / mask / ask / deny rules per agent and tool.',
    },
    {
      title: 'Privacy monitoring',
      body: 'A live audit log and privacy score for every connected agent.',
    },
    {
      title: 'Data minimization',
      body: 'Agents see free/busy instead of full event details by default.',
    },
  ],
};

export const useCases = {
  eyebrow: 'USE CASES',
  title: 'Built for everyday life',
  items: [
    {
      title: 'Book a restaurant',
      body: 'With an alias email and phone — no spam to your real inbox.',
    },
    {
      title: 'Summarize your inbox',
      body: 'With OTPs, cards and IDs masked automatically.',
    },
    {
      title: 'Schedule meetings',
      body: 'Seeing only free/busy slots, never event details.',
    },
    {
      title: 'Shop online',
      body: 'With a virtual address and payment alias at checkout.',
    },
  ],
};

export const architecture = {
  eyebrow: 'ARCHITECTURE',
  title: 'Under the hood',
  gatewayModules: ['Identity vault', 'Policy engine', 'PII engine', 'Audit store'],
  connectors: ['Gmail', 'Calendar', 'Drive', 'Slack'],
  tech: ['Python', 'FastAPI', 'MCP SDK', 'Presidio', 'SQLite', 'Next.js'],
  principles: [
    { title: 'Zero trust', body: 'No agent is trusted by default; every call is checked.' },
    { title: 'Fail closed', body: 'If VEIL can’t evaluate a request, it doesn’t go through.' },
    { title: 'Local-first', body: 'Your vault and logs live with you, not in the cloud.' },
  ],
};

export const roadmap = {
  eyebrow: 'ROADMAP',
  title: 'From prototype to demo in four weeks',
  items: [
    {
      phase: 'Week 1',
      title: 'Core proxy',
      body: 'MCP proxy, Gmail connector and basic masking.',
    },
    {
      phase: 'Week 2',
      title: 'Vault & policy',
      body: 'Identity vault and the permission policy engine.',
    },
    {
      phase: 'Week 3',
      title: 'Control plane',
      body: 'Approvals, audit log and the dashboard.',
    },
    {
      phase: 'Week 4',
      title: 'Polish & demo',
      body: 'More connectors, leak tests and the live demo.',
    },
  ],
};

export const cta = {
  title: 'Use AI agents without giving away yourself.',
  primary: { label: 'View on GitHub', href: '#' },
  secondary: { label: 'Try the live demo', href: '/dashboard' },
};

export const footer = {
  tagline: 'Personal data privacy gateway for the age of AI agents.',
  note: 'Built for the MCP hackathon',
  links: nav.links,
};
