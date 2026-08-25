import { supabase, isSupabaseEnvConfigured } from '../lib/supabase';
import {
  CRMCard,
  PhaseId,
  Priority,
  User,
  LeadInteraction,
  LeadFilterParams,
  PaginatedLeadsResponse,
  CardMessage,
  CardAuditHistory,
} from '../types/crm';

// PostgREST or()-filter values containing a comma or parenthesis break the
// filter's own syntax unless wrapped in double quotes (with any embedded
// backslash/quote escaped first).
function escapeOrFilterValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// DDL for creating the optimized database schema in Supabase SQL editor
export function getSupabaseSchemaSQL(): string {
  return `-- =========================================================
-- PipeCRM - High Volume Schema for Supabase / PostgreSQL
-- =========================================================

-- 1. Table: leads (Cadastral data, current phase, value, assigned consultant)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  contact_role TEXT,
  assigned_user_id TEXT NOT NULL DEFAULT 'user_consultant_1',
  phase_id TEXT NOT NULL DEFAULT 'mapeados',
  value NUMERIC NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'media',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  due_date TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  entered_current_phase_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: lead_interactions (Conversations, notes, AI messages, logs indexed by date)
CREATE TABLE IF NOT EXISTS lead_interactions (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'note',
  channel TEXT,
  sender TEXT NOT NULL DEFAULT 'user',
  user_id TEXT,
  user_name TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- INDEXES FOR HIGH-VOLUME SCALE & FAST SEARCH
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_leads_phase_id ON leads(phase_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_user_id ON leads(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_date ON lead_interactions(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_type ON lead_interactions(type);

-- Full-text / Trigram searching index for rapid search
CREATE INDEX IF NOT EXISTS idx_leads_search ON leads USING gin(
  to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(company_name, '') || ' ' || coalesce(contact_name, '') || ' ' || coalesce(contact_email, '') || ' ' || coalesce(contact_phone, ''))
);

-- 3. Table: user_roles (maps a real Supabase Auth user to an app role so
-- admins/managers can see the whole team's pipeline. This is intentionally
-- separate from the local "persona switcher" used in demo/offline mode —
-- only a real row here grants team-wide visibility once Supabase is active.
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'consultant' CHECK (role IN ('admin', 'manager', 'consultant', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Each consultant (Supabase Auth user) can see and manage their own leads.
-- Users with an 'admin' or 'manager' row in user_roles can see and manage
-- the whole team's leads. assigned_user_id stores auth.uid()::text, set
-- automatically by the app when a lead is created (never trust a
-- client-supplied value).
-- =========================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read leads" ON leads;
DROP POLICY IF EXISTS "Allow public insert leads" ON leads;
DROP POLICY IF EXISTS "Allow public update leads" ON leads;
DROP POLICY IF EXISTS "Allow public delete leads" ON leads;
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own or team leads" ON leads;

-- Users can only read their own role row; role changes are made from the
-- Supabase SQL editor / dashboard (service role), never from the client,
-- so nobody can self-promote.
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- SECURITY DEFINER so it can read user_roles from inside another table's
-- RLS policy without re-triggering user_roles' own RLS recursively.
CREATE OR REPLACE FUNCTION public.has_team_visibility()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  );
$$;

CREATE POLICY "Users can view own or team leads" ON leads
  FOR SELECT USING (auth.uid()::text = assigned_user_id OR public.has_team_visibility());
CREATE POLICY "Users can insert own or team leads" ON leads
  FOR INSERT WITH CHECK (auth.uid()::text = assigned_user_id OR public.has_team_visibility());
CREATE POLICY "Users can update own or team leads" ON leads
  FOR UPDATE USING (auth.uid()::text = assigned_user_id OR public.has_team_visibility())
  WITH CHECK (auth.uid()::text = assigned_user_id OR public.has_team_visibility());
-- Deletion is restricted to admin/manager to match the app's RBAC gate on
-- deleteCard() — a plain consultant must not be able to delete their own
-- lead directly via the Supabase client, bypassing the UI check.
CREATE POLICY "Only admin or manager can delete leads" ON leads
  FOR DELETE USING (public.has_team_visibility());

DROP POLICY IF EXISTS "Allow public read interactions" ON lead_interactions;
DROP POLICY IF EXISTS "Allow public insert interactions" ON lead_interactions;
DROP POLICY IF EXISTS "Allow public update interactions" ON lead_interactions;
DROP POLICY IF EXISTS "Allow public delete interactions" ON lead_interactions;
DROP POLICY IF EXISTS "Users can view own lead interactions" ON lead_interactions;
DROP POLICY IF EXISTS "Users can insert own lead interactions" ON lead_interactions;
DROP POLICY IF EXISTS "Users can update own lead interactions" ON lead_interactions;
DROP POLICY IF EXISTS "Users can delete own lead interactions" ON lead_interactions;

-- Interactions are scoped through their parent lead's ownership, plus the
-- same team-wide exception for admin/manager.
CREATE POLICY "Users can view own or team lead interactions" ON lead_interactions
  FOR SELECT USING (
    public.has_team_visibility() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_interactions.lead_id AND leads.assigned_user_id = auth.uid()::text)
  );
CREATE POLICY "Users can insert own or team lead interactions" ON lead_interactions
  FOR INSERT WITH CHECK (
    public.has_team_visibility() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_interactions.lead_id AND leads.assigned_user_id = auth.uid()::text)
  );
CREATE POLICY "Users can update own or team lead interactions" ON lead_interactions
  FOR UPDATE USING (
    public.has_team_visibility() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_interactions.lead_id AND leads.assigned_user_id = auth.uid()::text)
  );
CREATE POLICY "Users can delete own or team lead interactions" ON lead_interactions
  FOR DELETE USING (
    public.has_team_visibility() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_interactions.lead_id AND leads.assigned_user_id = auth.uid()::text)
  );

-- =========================================================
-- MIGRATION NOTE (run once if you already have data from the old
-- "Allow public" policies): reassign existing rows to a real Supabase
-- Auth user UUID before enabling the policies above, otherwise those
-- rows become invisible to everyone.
--   UPDATE leads SET assigned_user_id = '<seu-auth-user-uuid>'
--   WHERE assigned_user_id NOT IN (SELECT id::text FROM auth.users);
--
-- GRANT TEAM VISIBILITY: to let a real user see and manage the whole
-- team's leads (dashboard / admin panel usage), give them a role here —
-- this is what actually grants it; the app's local persona switcher does
-- not. Run once per admin/manager, replacing the email:
--   INSERT INTO user_roles (user_id, role)
--   SELECT id, 'admin' FROM auth.users WHERE email = 'seu-email@dominio.com'
--   ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
-- =========================================================
`;
}

// Convert Supabase row to CRMCard
export function mapRowToCard(row: any): CRMCard {
  return {
    id: row.id,
    title: row.title || '',
    companyName: row.company_name || '',
    contactName: row.contact_name || '',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    contactWhatsapp: row.contact_whatsapp || row.contact_phone || '',
    contactRole: row.contact_role || '',
    assignedUserId: row.assigned_user_id || 'user_consultant_1',
    phaseId: (row.phase_id as PhaseId) || 'mapeados',
    value: Number(row.value) || 0,
    priority: (row.priority as Priority) || 'media',
    tags: Array.isArray(row.tags) ? row.tags : [],
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    customFields: typeof row.custom_fields === 'object' && row.custom_fields !== null ? row.custom_fields : {},
    messages: [], // Loaded on demand from lead_interactions
    history: [], // Loaded on demand from lead_interactions
    enteredCurrentPhaseAt: row.entered_current_phase_at || row.created_at || new Date().toISOString(),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    dueDate: row.due_date || undefined,
    lastContactAt: row.last_contact_at || undefined,
  };
}

// Convert CRMCard to Supabase row format
export function mapCardToRow(card: Partial<CRMCard>): Record<string, any> {
  const row: Record<string, any> = {};
  if (card.id !== undefined) row.id = card.id;
  if (card.title !== undefined) row.title = card.title;
  if (card.companyName !== undefined) row.company_name = card.companyName;
  if (card.contactName !== undefined) row.contact_name = card.contactName;
  if (card.contactEmail !== undefined) row.contact_email = card.contactEmail;
  if (card.contactPhone !== undefined) row.contact_phone = card.contactPhone;
  if (card.contactWhatsapp !== undefined) row.contact_whatsapp = card.contactWhatsapp;
  if (card.contactRole !== undefined) row.contact_role = card.contactRole;
  if (card.assignedUserId !== undefined) row.assigned_user_id = card.assignedUserId;
  if (card.phaseId !== undefined) row.phase_id = card.phaseId;
  if (card.value !== undefined) row.value = Number(card.value) || 0;
  if (card.priority !== undefined) row.priority = card.priority;
  if (card.tags !== undefined) row.tags = card.tags;
  if (card.checklist !== undefined) row.checklist = card.checklist;
  if (card.customFields !== undefined) row.custom_fields = card.customFields;
  if (card.enteredCurrentPhaseAt !== undefined) row.entered_current_phase_at = card.enteredCurrentPhaseAt;
  if (card.dueDate !== undefined) row.due_date = card.dueDate;
  if (card.lastContactAt !== undefined) row.last_contact_at = card.lastContactAt;
  if (card.createdAt !== undefined) row.created_at = card.createdAt;
  row.updated_at = new Date().toISOString();
  return row;
}

// Map row to LeadInteraction
export function mapRowToInteraction(row: any): LeadInteraction {
  return {
    id: row.id,
    leadId: row.lead_id,
    type: row.type || 'note',
    channel: row.channel,
    sender: row.sender || 'user',
    userId: row.user_id,
    userName: row.user_name,
    content: row.content || '',
    metadata: typeof row.metadata === 'object' && row.metadata !== null ? row.metadata : {},
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Fetch paginated leads from Supabase with search, filters and metrics
 */
export async function fetchPaginatedLeads(params: LeadFilterParams, consultorId: string): Promise<PaginatedLeadsResponse> {
  if (!isSupabaseEnvConfigured) {
    throw new Error('Supabase client não configurado');
  }
  if (!consultorId) {
    throw new Error('Usuário não autenticado.');
  }

  const {
    phaseId,
    assignedUserId,
    priority,
    search,
    page = 1,
    pageSize = 30,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  // 1. Build Query. No forced assigned_user_id filter here — RLS is the
  // source of truth for visibility: a plain consultant only ever gets
  // their own rows back, while an admin/manager (per user_roles) sees the
  // whole team. The assignedUserId param below narrows within whatever
  // the RLS policy already allows, it doesn't widen it.
  let query = supabase.from('leads').select('*', { count: 'exact' });

  if (phaseId && phaseId !== 'all') {
    query = query.eq('phase_id', phaseId);
  }

  if (assignedUserId && assignedUserId !== 'all') {
    query = query.eq('assigned_user_id', assignedUserId);
  }

  if (priority && priority !== 'all') {
    query = query.eq('priority', priority);
  }

  if (search && search.trim()) {
    const q = escapeOrFilterValue(`%${search.trim()}%`);
    query = query.or(
      `title.ilike.${q},company_name.ilike.${q},contact_name.ilike.${q},contact_email.ilike.${q},contact_phone.ilike.${q}`
    );
  }

  // Sorting
  const sortColumn = sortBy === 'value' ? 'value' : sortBy === 'title' ? 'title' : 'created_at';
  query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

  // Pagination (range is inclusive 0-indexed)
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching paginated leads:', error);
    throw error;
  }

  const leads: CRMCard[] = (data || []).map(mapRowToCard);
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // 2. Fetch Aggregates & Phase Counts for pipeline headers.
  // Same RLS-driven scoping as the main query above, narrowed the same way
  // by assignedUserId when a specific consultant is selected.
  let statsQuery = supabase.from('leads').select('phase_id, value');
  if (assignedUserId && assignedUserId !== 'all') {
    statsQuery = statsQuery.eq('assigned_user_id', assignedUserId);
  }
  const { data: statsData } = await statsQuery;

  const phaseCounts: Record<PhaseId, number> = {
    mapeados: 0,
    prospeccao: 0,
    diagnostica: 0,
    proposta: 0,
    negociacao: 0,
    followup_1: 0,
    followup_2: 0,
    followup_3: 0,
    followup_4: 0,
    followup_5: 0,
    ganho: 0,
    perdido: 0,
  };

  let totalPipelineValue = 0;
  let totalWonValue = 0;
  let totalWonCount = 0;
  let totalLostCount = 0;

  if (statsData) {
    statsData.forEach((row: any) => {
      const p = row.phase_id as PhaseId;
      const v = Number(row.value) || 0;
      if (phaseCounts[p] !== undefined) {
        phaseCounts[p] += 1;
      }
      if (p === 'ganho') {
        totalWonValue += v;
        totalWonCount += 1;
      } else if (p === 'perdido') {
        totalLostCount += 1;
      } else {
        totalPipelineValue += v;
      }
    });
  }

  return {
    leads,
    totalCount,
    page,
    pageSize,
    totalPages,
    phaseCounts,
    totalPipelineValue,
    totalWonValue,
    totalWonCount,
    totalLostCount,
  };
}

/**
 * Fetch ALL leads visible to the current user (RLS-scoped) for the Kanban /
 * table / dashboard views, which each render the full `cards` array grouped by
 * phase and cannot work with a single 30-row page. Rows are streamed in batches
 * of `BATCH_SIZE` to get past Supabase's default 1000-row response cap, then the
 * same pipeline aggregates (phase counts, values) are computed as in
 * fetchPaginatedLeads. Visibility is unchanged — RLS still decides which rows
 * come back (own leads vs. whole team for admin/manager); this only removes the
 * artificial page-size truncation for the board.
 */
export async function fetchAllLeads(params: LeadFilterParams, consultorId: string): Promise<PaginatedLeadsResponse> {
  if (!isSupabaseEnvConfigured) {
    throw new Error('Supabase client não configurado');
  }
  if (!consultorId) {
    throw new Error('Usuário não autenticado.');
  }

  const {
    phaseId,
    assignedUserId,
    priority,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  const applyFilters = (q: any) => {
    if (phaseId && phaseId !== 'all') {
      q = q.eq('phase_id', phaseId);
    }
    if (assignedUserId && assignedUserId !== 'all') {
      q = q.eq('assigned_user_id', assignedUserId);
    }
    if (priority && priority !== 'all') {
      q = q.eq('priority', priority);
    }
    if (search && search.trim()) {
      const s = escapeOrFilterValue(`%${search.trim()}%`);
      q = q.or(
        `title.ilike.${s},company_name.ilike.${s},contact_name.ilike.${s},contact_email.ilike.${s},contact_phone.ilike.${s}`
      );
    }
    return q;
  };

  const sortColumn = sortBy === 'value' ? 'value' : sortBy === 'title' ? 'title' : 'created_at';

  // Stream all matching rows in batches to bypass the default row cap.
  const BATCH_SIZE = 1000;
  const allRows: any[] = [];
  let totalCount = 0;
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = supabase.from('leads').select('*', { count: 'exact' });
    query = applyFilters(query)
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range(offset, offset + BATCH_SIZE - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching all leads:', error);
      throw error;
    }

    if (typeof count === 'number') {
      totalCount = count;
    }

    const batch = data || [];
    allRows.push(...batch);

    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  const leads: CRMCard[] = allRows.map(mapRowToCard);

  // Pipeline aggregates & phase counts (same RLS scoping, narrowed by
  // assignedUserId when a specific consultant is selected).
  let statsQuery = supabase.from('leads').select('phase_id, value');
  if (assignedUserId && assignedUserId !== 'all') {
    statsQuery = statsQuery.eq('assigned_user_id', assignedUserId);
  }
  const { data: statsData } = await statsQuery;

  const phaseCounts: Record<PhaseId, number> = {
    mapeados: 0,
    prospeccao: 0,
    diagnostica: 0,
    proposta: 0,
    negociacao: 0,
    followup_1: 0,
    followup_2: 0,
    followup_3: 0,
    followup_4: 0,
    followup_5: 0,
    ganho: 0,
    perdido: 0,
  };

  let totalPipelineValue = 0;
  let totalWonValue = 0;
  let totalWonCount = 0;
  let totalLostCount = 0;

  if (statsData) {
    statsData.forEach((row: any) => {
      const p = row.phase_id as PhaseId;
      const v = Number(row.value) || 0;
      if (phaseCounts[p] !== undefined) {
        phaseCounts[p] += 1;
      }
      if (p === 'ganho') {
        totalWonValue += v;
        totalWonCount += 1;
      } else if (p === 'perdido') {
        totalLostCount += 1;
      } else {
        totalPipelineValue += v;
      }
    });
  }

  return {
    leads,
    totalCount,
    page: 1,
    pageSize: leads.length,
    totalPages: 1,
    phaseCounts,
    totalPipelineValue,
    totalWonValue,
    totalWonCount,
    totalLostCount,
  };
}

/**
 * Fetch ALL interactions for a single lead on-demand when opening the card modal.
 * Index: (lead_id, created_at DESC/ASC)
 */
export async function fetchLeadInteractions(leadId: string): Promise<{
  interactions: LeadInteraction[];
  messages: CardMessage[];
  history: CardAuditHistory[];
}> {
  if (!isSupabaseEnvConfigured) {
    return { interactions: [], messages: [], history: [] };
  }

  const { data, error } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Error fetching interactions for lead ${leadId}:`, error);
    throw error;
  }

  const interactions: LeadInteraction[] = (data || []).map(mapRowToInteraction);

  // Derive messages and audit history from interactions
  const messages: CardMessage[] = [];
  const history: CardAuditHistory[] = [];

  interactions.forEach((item) => {
    if (item.type === 'message' || item.type === 'whatsapp' || item.type === 'email' || item.type === 'note' || item.type === 'ai_note' || item.type === 'ai_prompt') {
      messages.push({
        id: item.id,
        channel: (item.channel === 'whatsapp' || item.channel === 'email' ? item.channel : 'internal_note') as any,
        sender: (item.sender === 'client' ? 'lead' : item.sender === 'system' ? 'system' : 'consultant') as any,
        senderName: item.userName || (item.sender === 'client' ? 'Lead' : 'Consultor'),
        content: item.content,
        timestamp: item.createdAt,
        status: 'delivered',
        subject: item.metadata?.subject,
      });
    }

    if (item.type === 'status_change' || item.type === 'history') {
      history.push({
        id: item.id,
        timestamp: item.createdAt,
        userId: item.userId || 'system',
        userName: item.userName || 'Sistema',
        action: item.metadata?.action || 'Atualização no card',
        previousPhase: item.metadata?.previousPhase,
        newPhase: item.metadata?.newPhase,
        fieldChanges: item.metadata?.fieldChanges,
      });
    }
  });

  return { interactions, messages, history };
}

/**
 * Create a new lead in Supabase and insert initial interaction record
 */
export async function createLeadInSupabase(
  card: Partial<CRMCard>,
  currentUser: User,
  consultorId: string
): Promise<CRMCard> {
  if (!isSupabaseEnvConfigured) {
    throw new Error('Supabase não conectado.');
  }
  if (!consultorId) {
    throw new Error('Usuário não autenticado.');
  }

  const id = card.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const fullCard: CRMCard = {
    id,
    title: card.title || 'Nova Oportunidade',
    companyName: card.companyName || 'Empresa',
    contactName: card.contactName || 'Contato Principal',
    contactEmail: card.contactEmail || '',
    contactPhone: card.contactPhone || '',
    contactWhatsapp: card.contactWhatsapp || card.contactPhone || '',
    contactRole: card.contactRole || '',
    // Use the consultant explicitly chosen in the UI (NewCardModal) when
    // provided, falling back to the authenticated creator's id otherwise.
    // RLS is the final gate: only admin/manager (per user_roles) may assign a
    // lead to a different user; a plain consultant assigning to someone else
    // gets a permission-denied error surfaced by the caller.
    assignedUserId: card.assignedUserId || consultorId,
    phaseId: card.phaseId || 'mapeados',
    value: Number(card.value) || 0,
    priority: card.priority || 'media',
    tags: card.tags || [],
    checklist: card.checklist || [],
    customFields: card.customFields || {},
    messages: [],
    history: [],
    enteredCurrentPhaseAt: now,
    createdAt: now,
    updatedAt: now,
    dueDate: card.dueDate,
    lastContactAt: now,
  };

  const row = mapCardToRow(fullCard);
  const { error: leadError } = await supabase.from('leads').insert([row]);

  if (leadError) {
    console.error('Error inserting lead in Supabase:', leadError);
    throw leadError;
  }

  // Insert initial interaction
  await supabase.from('lead_interactions').insert([
    {
      id: `inter-${Date.now()}-1`,
      lead_id: id,
      type: 'history',
      channel: 'system',
      sender: 'user',
      user_id: currentUser.id,
      user_name: currentUser.name,
      content: `Oportunidade cadastrada na fase "${fullCard.phaseId}" por ${currentUser.name}.`,
      metadata: { action: 'Criação do Lead', initialPhase: fullCard.phaseId },
      created_at: now,
    },
  ]);

  return fullCard;
}

/**
 * Update an existing lead in Supabase
 */
export async function updateLeadInSupabase(
  leadId: string,
  updates: Partial<CRMCard>,
  currentUser?: User,
  noteContent?: string
): Promise<void> {
  if (!isSupabaseEnvConfigured) {
    throw new Error('Supabase não conectado.');
  }

  const row = mapCardToRow(updates);
  delete row.id; // Do not overwrite PK

  const { error } = await supabase
    .from('leads')
    .update(row)
    .eq('id', leadId);

  if (error) {
    console.error(`Error updating lead ${leadId}:`, error);
    throw error;
  }

  if (noteContent && currentUser) {
    await addLeadInteractionToSupabase(leadId, {
      type: 'note',
      channel: 'internal',
      sender: 'user',
      userId: currentUser.id,
      userName: currentUser.name,
      content: noteContent,
    });
  }
}

/**
 * Move lead to a new phase and record status transition in lead_interactions
 */
export async function moveLeadPhaseInSupabase(
  leadId: string,
  targetPhase: PhaseId,
  previousPhase: PhaseId,
  currentUser: User,
  customFields?: Record<string, any>,
  customReason?: string
): Promise<void> {
  if (!isSupabaseEnvConfigured) {
    throw new Error('Supabase não conectado.');
  }

  const now = new Date().toISOString();

  const updatePayload: Record<string, any> = {
    phase_id: targetPhase,
    entered_current_phase_at: now,
    updated_at: now,
  };

  if (customFields && Object.keys(customFields).length > 0) {
    updatePayload.custom_fields = customFields;
  }

  const { error } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', leadId);

  if (error) {
    console.error(`Error moving lead ${leadId} to ${targetPhase}:`, error);
    throw error;
  }

  // Format custom fields summary for interaction content if present
  let fieldSummary = '';
  if (customFields && Object.keys(customFields).length > 0) {
    fieldSummary = ' | Dados coletados: ' + Object.entries(customFields)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }

  // Record interaction
  await supabase.from('lead_interactions').insert([
    {
      id: `trans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      lead_id: leadId,
      type: 'status_change',
      channel: 'system',
      sender: 'user',
      user_id: currentUser.id,
      user_name: currentUser.name,
      content: `Fase alterada de "${previousPhase}" para "${targetPhase}".${customReason ? ` Motivo: ${customReason}` : ''}${fieldSummary}`,
      metadata: {
        action: 'Movimentação de Fase',
        previousPhase,
        newPhase: targetPhase,
        customReason,
        customFields,
      },
      created_at: now,
    },
  ]);
}

/**
 * Add a new interaction (Message, WhatsApp, Call note, AI note) to Supabase
 */
export async function addLeadInteractionToSupabase(
  leadId: string,
  interaction: Partial<LeadInteraction>
): Promise<LeadInteraction> {
  if (!isSupabaseEnvConfigured) {
    throw new Error('Supabase não conectado.');
  }

  const id = interaction.id || `inter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = interaction.createdAt || new Date().toISOString();

  const record: LeadInteraction = {
    id,
    leadId,
    type: interaction.type || 'note',
    channel: interaction.channel || 'internal',
    sender: interaction.sender || 'user',
    userId: interaction.userId,
    userName: interaction.userName,
    content: interaction.content || '',
    metadata: interaction.metadata || {},
    createdAt: now,
  };

  const { error } = await supabase.from('lead_interactions').insert([
    {
      id: record.id,
      lead_id: record.leadId,
      type: record.type,
      channel: record.channel,
      sender: record.sender,
      user_id: record.userId,
      user_name: record.userName,
      content: record.content,
      metadata: record.metadata,
      created_at: record.createdAt,
    },
  ]);

  if (error) {
    console.error(`Error adding interaction to lead ${leadId}:`, error);
    throw error;
  }

  // Update lead's updated_at and last_contact_at
  await supabase
    .from('leads')
    .update({
      updated_at: now,
      last_contact_at: now,
    })
    .eq('id', leadId);

  return record;
}

/**
 * Delete lead from Supabase (interactions are deleted via ON DELETE CASCADE)
 */
export async function deleteLeadFromSupabase(leadId: string): Promise<void> {
  if (!isSupabaseEnvConfigured) {
    throw new Error('Supabase não conectado.');
  }

  const { error } = await supabase.from('leads').delete().eq('id', leadId);
  if (error) {
    console.error(`Error deleting lead ${leadId}:`, error);
    throw error;
  }
}

/**
 * Batch migrate existing cards and their historical messages/checklist to Supabase
 */
export async function migrateCardsToSupabase(cards: CRMCard[]): Promise<{
  success: boolean;
  insertedLeads: number;
  insertedInteractions: number;
  message: string;
}> {
  if (!isSupabaseEnvConfigured) {
    return {
      success: false,
      insertedLeads: 0,
      insertedInteractions: 0,
      message: 'Supabase não configurado.',
    };
  }

  try {
    const leadRows = cards.map(mapCardToRow);

    // Upsert leads in batches of 100
    const batchSize = 100;
    for (let i = 0; i < leadRows.length; i += batchSize) {
      const batch = leadRows.slice(i, i + batchSize);
      const { error: leadErr } = await supabase.from('leads').upsert(batch, { onConflict: 'id' });
      if (leadErr) throw leadErr;
    }

    // Prepare interactions from existing messages and history
    const interactionRows: any[] = [];
    cards.forEach((card) => {
      // Existing messages
      (card.messages || []).forEach((msg, idx) => {
        interactionRows.push({
          id: msg.id || `mig-msg-${card.id}-${idx}`,
          lead_id: card.id,
          type: msg.channel === 'whatsapp' ? 'whatsapp' : msg.channel === 'email' ? 'email' : 'note',
          channel: msg.channel,
          sender: msg.sender === 'lead' ? 'client' : 'user',
          user_id: undefined,
          user_name: msg.senderName,
          content: msg.content,
          metadata: { subject: msg.subject, status: msg.status },
          created_at: msg.timestamp || new Date().toISOString(),
        });
      });

      // Existing history
      (card.history || []).forEach((h, idx) => {
        interactionRows.push({
          id: h.id || `mig-hist-${card.id}-${idx}`,
          lead_id: card.id,
          type: 'history',
          channel: 'system',
          sender: 'user',
          user_id: h.userId,
          user_name: h.userName,
          content: `${h.action}${h.newPhase ? `: movido para ${h.newPhase}` : ''}`,
          metadata: {
            action: h.action,
            previousPhase: h.previousPhase,
            newPhase: h.newPhase,
            fieldChanges: h.fieldChanges,
          },
          created_at: h.timestamp || new Date().toISOString(),
        });
      });
    });

    if (interactionRows.length > 0) {
      for (let i = 0; i < interactionRows.length; i += batchSize) {
        const batch = interactionRows.slice(i, i + batchSize);
        const { error: interErr } = await supabase
          .from('lead_interactions')
          .upsert(batch, { onConflict: 'id' });
        if (interErr) console.warn('Warning inserting interaction batch:', interErr);
      }
    }

    return {
      success: true,
      insertedLeads: cards.length,
      insertedInteractions: interactionRows.length,
      message: `${cards.length} leads e ${interactionRows.length} interações sincronizados com o Supabase!`,
    };
  } catch (err: any) {
    return {
      success: false,
      insertedLeads: 0,
      insertedInteractions: 0,
      message: `Erro na migração: ${err.message}`,
    };
  }
}
