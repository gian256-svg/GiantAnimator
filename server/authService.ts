import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes, pbkdf2Sync } from 'crypto';

// ── WebSocket polyfill para Electron / Node 20 sem WS nativo ────
async function ensureWebSocket() {
  if (typeof (globalThis as any).WebSocket === 'undefined') {
    try {
      const ws = await import('ws');
      (globalThis as any).WebSocket = (ws as any).default ?? ws;
    } catch (_) {}
  }
}

// ── Singleton client ─────────────────────────────────────────────
let _client: SupabaseClient | null = null;
let _initFailed = false;

async function db(): Promise<SupabaseClient | null> {
  if (_client) return _client;
  if (_initFailed) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) { _initFailed = true; return null; }
  try {
    await ensureWebSocket();
    _client = createClient(url, key, { auth: { persistSession: false } });
    return _client;
  } catch (err: any) {
    _initFailed = true;
    console.warn('⚠️  [AUTH] Supabase indisponível:', err.message?.split('\n')[0]);
    return null;
  }
}

// ── Password hashing (PBKDF2, no extra deps) ─────────────────────
function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
}
function generateSalt(): string { return randomBytes(32).toString('hex'); }
function generateToken(): string { return randomBytes(48).toString('hex'); }

// ── Types ────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface UserPreferences {
  theme: string;
  exportMov: boolean;
  exportAlpha: boolean;
  showCallouts: boolean;
  showAuditor: boolean;
  zoomEnabled: boolean;
  engine: string;
  backgroundType: string;
  uploadMode: string;
  customPalette?: object;
}

export interface UserStats {
  userId: string;
  email: string;
  name: string;
  totalJobs: number;
  lastActivity: string | null;
  favoriteTheme: string | null;
  favoriteEngine: string | null;
  themeCounts: Record<string, number>;
  engineCounts: Record<string, number>;
  componentCounts: Record<string, number>;
}

const DEFAULT_PREFS: UserPreferences = {
  theme: 'original',
  exportMov: false,
  exportAlpha: false,
  showCallouts: true,
  showAuditor: true,
  zoomEnabled: false,
  engine: 'remotion',
  backgroundType: 'dark',
  uploadMode: 'vision',
};

// ── Auth Operations ──────────────────────────────────────────────

export async function createUser(
  email: string,
  name: string,
  password: string,
  role: 'admin' | 'user' = 'user'
): Promise<{ user: AuthUser | null; error: string | null }> {
  const client = await db();
  if (!client) return { user: null, error: 'Serviço indisponível' };

  const salt = generateSalt();
  const hash = hashPassword(password, salt);

  const { data, error } = await client
    .from('users')
    .insert({ email: email.toLowerCase().trim(), name, password_hash: hash, salt, role })
    .select('id, email, name, role')
    .single();

  if (error) {
    const msg = error.message.includes('unique') ? 'E-mail já cadastrado' : error.message;
    return { user: null, error: msg };
  }
  return { user: data as AuthUser, error: null };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; token: string | null; error: string | null }> {
  const client = await db();
  if (!client) return { user: null, token: null, error: 'Serviço indisponível' };

  const { data: userRow } = await client
    .from('users')
    .select('id, email, name, role, password_hash, salt')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (!userRow) return { user: null, token: null, error: 'E-mail ou senha incorretos' };

  const hash = hashPassword(password, userRow.salt);
  if (hash !== userRow.password_hash) {
    return { user: null, token: null, error: 'E-mail ou senha incorretos' };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await client.from('user_sessions').insert({
    token,
    user_id: userRow.id,
    expires_at: expiresAt.toISOString(),
  });
  await client.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', userRow.id);

  const user: AuthUser = { id: userRow.id, email: userRow.email, name: userRow.name, role: userRow.role };
  return { user, token, error: null };
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  if (!token) return null;
  const client = await db();
  if (!client) return null;

  const { data: session } = await client
    .from('user_sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .single();

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    await client.from('user_sessions').delete().eq('token', token);
    return null;
  }

  const { data: user } = await client
    .from('users')
    .select('id, email, name, role')
    .eq('id', session.user_id)
    .single();

  return user as AuthUser | null;
}

export async function logout(token: string): Promise<void> {
  const client = await db();
  if (!client) return;
  await client.from('user_sessions').delete().eq('token', token);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ error: string | null }> {
  const client = await db();
  if (!client) return { error: 'Serviço indisponível' };

  const { data: userRow } = await client
    .from('users')
    .select('password_hash, salt')
    .eq('id', userId)
    .single();

  if (!userRow) return { error: 'Usuário não encontrado' };

  const hash = hashPassword(currentPassword, userRow.salt);
  if (hash !== userRow.password_hash) return { error: 'Senha atual incorreta' };

  const newSalt = generateSalt();
  const newHash = hashPassword(newPassword, newSalt);

  await client.from('users').update({ password_hash: newHash, salt: newSalt }).eq('id', userId);
  await client.from('user_sessions').delete().eq('user_id', userId);

  return { error: null };
}

// ── Preferences ──────────────────────────────────────────────────

export async function getPreferences(userId: string): Promise<UserPreferences> {
  const client = await db();
  if (!client) return { ...DEFAULT_PREFS };

  const { data } = await client.from('user_preferences').select('*').eq('user_id', userId).single();
  if (!data) return { ...DEFAULT_PREFS };

  return {
    theme: data.theme ?? DEFAULT_PREFS.theme,
    exportMov: data.export_mov ?? DEFAULT_PREFS.exportMov,
    exportAlpha: data.export_alpha ?? DEFAULT_PREFS.exportAlpha,
    showCallouts: data.show_callouts ?? DEFAULT_PREFS.showCallouts,
    showAuditor: data.show_auditor ?? DEFAULT_PREFS.showAuditor,
    zoomEnabled: data.zoom_enabled ?? DEFAULT_PREFS.zoomEnabled,
    engine: data.engine ?? DEFAULT_PREFS.engine,
    backgroundType: data.background_type ?? DEFAULT_PREFS.backgroundType,
    uploadMode: data.upload_mode ?? DEFAULT_PREFS.uploadMode,
    customPalette: data.custom_palette ?? undefined,
  };
}

export async function savePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<void> {
  const client = await db();
  if (!client) return;

  const row: any = { user_id: userId, updated_at: new Date().toISOString() };
  if (prefs.theme !== undefined) row.theme = prefs.theme;
  if (prefs.exportMov !== undefined) row.export_mov = prefs.exportMov;
  if (prefs.exportAlpha !== undefined) row.export_alpha = prefs.exportAlpha;
  if (prefs.showCallouts !== undefined) row.show_callouts = prefs.showCallouts;
  if (prefs.showAuditor !== undefined) row.show_auditor = prefs.showAuditor;
  if (prefs.zoomEnabled !== undefined) row.zoom_enabled = prefs.zoomEnabled;
  if (prefs.engine !== undefined) row.engine = prefs.engine;
  if (prefs.backgroundType !== undefined) row.background_type = prefs.backgroundType;
  if (prefs.uploadMode !== undefined) row.upload_mode = prefs.uploadMode;
  if (prefs.customPalette !== undefined) row.custom_palette = prefs.customPalette;

  await client.from('user_preferences').upsert(row, { onConflict: 'user_id' });
}

// ── Admin ────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<AuthUser[]> {
  const client = await db();
  if (!client) return [];
  const { data } = await client.from('users').select('id, email, name, role').order('created_at');
  return (data ?? []) as AuthUser[];
}

export async function getUserStats(): Promise<UserStats[]> {
  const client = await db();
  if (!client) return [];

  const { data: users } = await client.from('users').select('id, email, name').order('created_at');
  if (!users) return [];

  const stats: UserStats[] = [];

  for (const u of users) {
    const { data: jobs } = await client
      .from('jobs')
      .select('options, created_at, component_id')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false });

    const jobList = jobs ?? [];
    const themeCounts: Record<string, number> = {};
    const engineCounts: Record<string, number> = {};
    const componentCounts: Record<string, number> = {};

    for (const j of jobList) {
      const opts = j.options ?? {};
      const theme = opts.chartTheme ?? 'original';
      const engine = opts.engine ?? 'remotion';
      const cid = j.component_id ?? 'unknown';
      themeCounts[theme] = (themeCounts[theme] ?? 0) + 1;
      engineCounts[engine] = (engineCounts[engine] ?? 0) + 1;
      componentCounts[cid] = (componentCounts[cid] ?? 0) + 1;
    }

    const favoriteTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const favoriteEngine = Object.entries(engineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    stats.push({
      userId: u.id,
      email: u.email,
      name: u.name,
      totalJobs: jobList.length,
      lastActivity: jobList[0]?.created_at ?? null,
      favoriteTheme,
      favoriteEngine,
      themeCounts,
      engineCounts,
      componentCounts,
    });
  }

  return stats;
}

export async function adminCreateUser(
  email: string,
  name: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  return createUser(email, name, password, 'user');
}

export async function adminDeleteUser(userId: string): Promise<{ error: string | null }> {
  const client = await db();
  if (!client) return { error: 'Serviço indisponível' };
  const { error } = await client.from('users').delete().eq('id', userId);
  return { error: error?.message ?? null };
}

export async function adminResetPassword(
  userId: string,
  newPassword: string
): Promise<{ error: string | null }> {
  const client = await db();
  if (!client) return { error: 'Serviço indisponível' };
  const newSalt = generateSalt();
  const newHash = hashPassword(newPassword, newSalt);
  await client.from('users').update({ password_hash: newHash, salt: newSalt }).eq('id', userId);
  await client.from('user_sessions').delete().eq('user_id', userId);
  return { error: null };
}

export async function bootstrapAdmin(password: string): Promise<void> {
  const client = await db();
  if (!client) return;

  const { data } = await client
    .from('users')
    .select('id, password_hash')
    .eq('email', 'gianluca.palmisciano@timeprimo.com')
    .single();

  if (data && data.password_hash === 'CHANGE_VIA_APP') {
    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    await client.from('users').update({ password_hash: hash, salt }).eq('id', data.id);
    console.log('✅ [AUTH] Admin password bootstrapped.');
  }
}
