export interface Env {
  DB: D1Database;
}

interface ClickPlanetRow {
  device_id: string;
  planet_name: string;
  name_lower: string;
  color_id: number;
  mass_m: number;
  mass_e: number;
  updated_at: string;
}

interface CatHangerRow {
  device_id: string;
  player_name: string;
  time_sec: number;
  color_id: number;
  eye_color: string;
  accessory: string;
  updated_at: string;
}

interface CatClimberRow {
  device_id: string;
  player_name: string;
  meters: number;
  color_id: number;
  eye_color: string;
  accessory: string;
  updated_at: string;
}

interface FairSlotsRow {
  device_id: string;
  player_name: string;
  level: number;
  coins: number;
  total_won: number;
  total_spins: number;
  tournament_points: number;
  species: string;
  color_id: string;
  updated_at: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

let schemaPromise: Promise<void> | null = null;

function ensureSchema(db: D1Database): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = db
      .batch([
        db.prepare(`
          CREATE TABLE IF NOT EXISTS click_planet_scores (
            device_id TEXT PRIMARY KEY,
            planet_name TEXT NOT NULL,
            name_lower TEXT NOT NULL UNIQUE,
            color_id INTEGER NOT NULL DEFAULT 0,
            mass_m REAL NOT NULL DEFAULT 1.0,
            mass_e INTEGER NOT NULL DEFAULT -2,
            updated_at TEXT NOT NULL
          )
        `),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_cp_mass ON click_planet_scores (mass_e DESC, mass_m DESC, updated_at ASC)`
        ),
        db.prepare(`
          CREATE TABLE IF NOT EXISTS cat_hanger_scores (
            device_id TEXT PRIMARY KEY,
            player_name TEXT NOT NULL,
            time_sec REAL NOT NULL DEFAULT 0,
            color_id INTEGER NOT NULL DEFAULT 0,
            eye_color TEXT NOT NULL DEFAULT 'amber',
            accessory TEXT NOT NULL DEFAULT 'none',
            updated_at TEXT NOT NULL
          )
        `),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_ch_time ON cat_hanger_scores (time_sec DESC, updated_at ASC)`
        ),
        db.prepare(`
          CREATE TABLE IF NOT EXISTS cat_climber_scores (
            device_id TEXT PRIMARY KEY,
            player_name TEXT NOT NULL,
            meters REAL NOT NULL DEFAULT 0,
            color_id INTEGER NOT NULL DEFAULT 0,
            eye_color TEXT NOT NULL DEFAULT 'amber',
            accessory TEXT NOT NULL DEFAULT 'none',
            updated_at TEXT NOT NULL
          )
        `),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_cc_meters ON cat_climber_scores (meters DESC, updated_at ASC)`
        ),
        db.prepare(`
          CREATE TABLE IF NOT EXISTS fair_coin_slots_scores (
            device_id TEXT PRIMARY KEY,
            player_name TEXT NOT NULL,
            level INTEGER NOT NULL DEFAULT 1,
            coins REAL NOT NULL DEFAULT 1500000000,
            total_won REAL NOT NULL DEFAULT 0,
            total_spins INTEGER NOT NULL DEFAULT 0,
            tournament_points INTEGER NOT NULL DEFAULT 0,
            species TEXT NOT NULL DEFAULT 'piggy',
            color_id TEXT NOT NULL DEFAULT 'pink',
            updated_at TEXT NOT NULL
          )
        `),
        db.prepare(
          `CREATE INDEX IF NOT EXISTS idx_fcs_won ON fair_coin_slots_scores (total_won DESC, level DESC, updated_at ASC)`
        ),
      ])
      .then(() => undefined)
      .catch((err) => {
        schemaPromise = null;
        throw err;
      });
  }
  return schemaPromise;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function cleanName(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim().replace(/\s+/g, ' ').slice(0, 24);
  return trimmed || fallback;
}

function cleanDeviceId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().slice(0, 128);
  return trimmed.length >= 4 ? trimmed : null;
}

function normalizeMass(m: number, e: number): { m: number; e: number } {
  if (!Number.isFinite(m) || !Number.isFinite(e) || m <= 0) {
    return { m: 1, e: -2 };
  }
  let nm = m;
  let ne = Math.trunc(e);
  let guard = 0;
  while (nm >= 10 && guard < 1000) {
    nm /= 10;
    ne += 1;
    guard++;
  }
  while (nm < 1 && guard < 1000) {
    nm *= 10;
    ne -= 1;
    guard++;
  }
  return { m: nm, e: ne };
}

function isMassGreater(m1: number, e1: number, m2: number, e2: number): boolean {
  if (e1 !== e2) return e1 > e2;
  return m1 > m2;
}

function validatePlanetName(
  raw: unknown
): { ok: true; name: string } | { ok: false; message: string } {
  if (typeof raw !== 'string') {
    return { ok: false, message: 'Ongeldige planeetnaam.' };
  }
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2 || trimmed.length > 20) {
    return { ok: false, message: 'Planeetnaam moet tussen 2 en 20 tekens zijn.' };
  }
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
    return { ok: false, message: 'Gebruik alleen letters, cijfers, spaties, - of _.' };
  }
  return { ok: true, name: trimmed };
}

async function getClickPlanetRank(db: D1Database, massE: number, massM: number): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM click_planet_scores WHERE mass_e > ? OR (mass_e = ? AND mass_m > ?)`
    )
    .bind(massE, massE, massM)
    .first<{ cnt: number }>();
  return Number(row?.cnt ?? 0) + 1;
}

async function handleClickPlanet(
  request: Request,
  url: URL,
  env: Env
): Promise<Response | null> {
  const path = url.pathname;

  if (request.method === 'GET' && path === '/api/highscores') {
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 100);
    const deviceId = url.searchParams.get('deviceId')?.trim() || '';

    const { results } = await env.DB.prepare(
      `SELECT device_id, planet_name, name_lower, color_id, mass_m, mass_e, updated_at
       FROM click_planet_scores
       ORDER BY mass_e DESC, mass_m DESC, updated_at ASC
       LIMIT ?`
    )
      .bind(limit)
      .all<ClickPlanetRow>();

    const entries = results.map((row, idx) => ({
      rank: idx + 1,
      deviceId: row.device_id,
      planetName: row.planet_name,
      colorId: row.color_id,
      massM: row.mass_m,
      massE: row.mass_e,
      updatedAt: row.updated_at,
    }));

    let player = null;
    if (deviceId) {
      const found = await env.DB.prepare(
        `SELECT * FROM click_planet_scores WHERE device_id = ?`
      )
        .bind(deviceId)
        .first<ClickPlanetRow>();
      if (found) {
        player = {
          rank: await getClickPlanetRank(env.DB, found.mass_e, found.mass_m),
          deviceId: found.device_id,
          planetName: found.planet_name,
          colorId: found.color_id,
          massM: found.mass_m,
          massE: found.mass_e,
          updatedAt: found.updated_at,
        };
      }
    }

    return jsonResponse({ ok: true, entries, player });
  }

  if (request.method === 'GET' && path.startsWith('/api/player/')) {
    const deviceId = decodeURIComponent(path.slice('/api/player/'.length)).trim();
    if (!deviceId) {
      return jsonResponse({ ok: false, error: 'MISSING_DEVICE_ID' }, 400);
    }
    const found = await env.DB.prepare(
      `SELECT * FROM click_planet_scores WHERE device_id = ?`
    )
      .bind(deviceId)
      .first<ClickPlanetRow>();
    if (!found) {
      return jsonResponse({ ok: true, entry: null });
    }
    return jsonResponse({
      ok: true,
      entry: {
        rank: await getClickPlanetRank(env.DB, found.mass_e, found.mass_m),
        deviceId: found.device_id,
        planetName: found.planet_name,
        colorId: found.color_id,
        massM: found.mass_m,
        massE: found.mass_e,
        updatedAt: found.updated_at,
      },
    });
  }

  if (request.method === 'POST' && path === '/api/claim-name') {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const deviceId = cleanDeviceId(body?.deviceId);
    if (!deviceId) {
      return jsonResponse({ ok: false, error: 'INVALID_DEVICE_ID', message: 'Ongeldig toestel-ID.' }, 400);
    }
    const nameCheck = validatePlanetName(body?.planetName);
    if (!nameCheck.ok) {
      return jsonResponse({ ok: false, error: 'INVALID_NAME', message: nameCheck.message }, 400);
    }

    const planetName = nameCheck.name;
    const nameLower = planetName.toLowerCase();
    const colorId = Number.isInteger(body?.colorId) ? Number(body?.colorId) : 0;
    const incomingMass = normalizeMass(Number(body?.massM ?? 1), Number(body?.massE ?? -2));
    const now = new Date().toISOString();

    const owner = await env.DB.prepare(
      `SELECT device_id FROM click_planet_scores WHERE name_lower = ?`
    )
      .bind(nameLower)
      .first<{ device_id: string }>();

    if (owner && owner.device_id !== deviceId) {
      return jsonResponse(
        {
          ok: false,
          error: 'NAME_TAKEN',
          message: 'Deze planeetnaam is al bezet door een andere telefoon!',
        },
        409
      );
    }

    const existing = await env.DB.prepare(
      `SELECT * FROM click_planet_scores WHERE device_id = ?`
    )
      .bind(deviceId)
      .first<ClickPlanetRow>();

    let finalM = incomingMass.m;
    let finalE = incomingMass.e;
    if (existing && !isMassGreater(incomingMass.m, incomingMass.e, existing.mass_m, existing.mass_e)) {
      finalM = existing.mass_m;
      finalE = existing.mass_e;
    }

    if (existing) {
      await env.DB.prepare(
        `UPDATE click_planet_scores
         SET planet_name = ?, name_lower = ?, color_id = ?, mass_m = ?, mass_e = ?, updated_at = ?
         WHERE device_id = ?`
      )
        .bind(planetName, nameLower, colorId, finalM, finalE, now, deviceId)
        .run();
    } else {
      await env.DB.prepare(
        `INSERT INTO click_planet_scores (device_id, planet_name, name_lower, color_id, mass_m, mass_e, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(deviceId, planetName, nameLower, colorId, finalM, finalE, now)
        .run();
    }

    return jsonResponse({
      ok: true,
      entry: {
        rank: await getClickPlanetRank(env.DB, finalE, finalM),
        deviceId,
        planetName,
        colorId,
        massM: finalM,
        massE: finalE,
        updatedAt: now,
      },
    });
  }

  if (request.method === 'POST' && path === '/api/score') {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const deviceId = cleanDeviceId(body?.deviceId);
    if (!deviceId) {
      return jsonResponse({ ok: false, error: 'INVALID_DEVICE_ID' }, 400);
    }
    const colorId = Number.isInteger(body?.colorId) ? Number(body?.colorId) : 0;
    const incoming = normalizeMass(Number(body?.massM ?? 1), Number(body?.massE ?? -2));
    const now = new Date().toISOString();

    const existing = await env.DB.prepare(
      `SELECT * FROM click_planet_scores WHERE device_id = ?`
    )
      .bind(deviceId)
      .first<ClickPlanetRow>();

    if (!existing) {
      const nameCheck = validatePlanetName(body?.planetName);
      if (!nameCheck.ok) {
        return jsonResponse(
          { ok: false, error: 'NAME_REQUIRED', message: 'Vul eerst een unieke planeetnaam in.' },
          400
        );
      }
      const nameLower = nameCheck.name.toLowerCase();
      const owner = await env.DB.prepare(
        `SELECT device_id FROM click_planet_scores WHERE name_lower = ?`
      )
        .bind(nameLower)
        .first<{ device_id: string }>();
      if (owner) {
        return jsonResponse(
          { ok: false, error: 'NAME_TAKEN', message: 'Deze planeetnaam is al bezet door een andere telefoon!' },
          409
        );
      }
      await env.DB.prepare(
        `INSERT INTO click_planet_scores (device_id, planet_name, name_lower, color_id, mass_m, mass_e, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(deviceId, nameCheck.name, nameLower, colorId, incoming.m, incoming.e, now)
        .run();

      return jsonResponse({
        ok: true,
        entry: {
          rank: await getClickPlanetRank(env.DB, incoming.e, incoming.m),
          deviceId,
          planetName: nameCheck.name,
          colorId,
          massM: incoming.m,
          massE: incoming.e,
          updatedAt: now,
        },
      });
    }

    const shouldUpdateMass = isMassGreater(incoming.m, incoming.e, existing.mass_m, existing.mass_e);
    const finalM = shouldUpdateMass ? incoming.m : existing.mass_m;
    const finalE = shouldUpdateMass ? incoming.e : existing.mass_e;
    const finalUpdatedAt = shouldUpdateMass ? now : existing.updated_at;

    await env.DB.prepare(
      `UPDATE click_planet_scores SET color_id = ?, mass_m = ?, mass_e = ?, updated_at = ? WHERE device_id = ?`
    )
      .bind(colorId, finalM, finalE, finalUpdatedAt, deviceId)
      .run();

    return jsonResponse({
      ok: true,
      entry: {
        rank: await getClickPlanetRank(env.DB, finalE, finalM),
        deviceId,
        planetName: existing.planet_name,
        colorId,
        massM: finalM,
        massE: finalE,
        updatedAt: finalUpdatedAt,
      },
    });
  }

  return null;
}

async function handleCatHanger(
  request: Request,
  url: URL,
  env: Env
): Promise<Response | null> {
  const path = url.pathname;

  if (request.method === 'GET' && path === '/api/cat-hanger/highscores') {
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 100);
    const deviceId = url.searchParams.get('deviceId')?.trim() || '';

    const { results } = await env.DB.prepare(
      `SELECT device_id, player_name, time_sec, color_id, eye_color, accessory, updated_at
       FROM cat_hanger_scores
       ORDER BY time_sec DESC, updated_at ASC
       LIMIT ?`
    )
      .bind(limit)
      .all<CatHangerRow>();

    const entries = results.map((r, idx) => ({
      rank: idx + 1,
      deviceId: r.device_id,
      playerName: r.player_name,
      timeSec: r.time_sec,
      colorId: r.color_id,
      eyeColor: r.eye_color,
      accessory: r.accessory,
      updatedAt: r.updated_at,
    }));

    let player = null;
    if (deviceId) {
      const found = await env.DB.prepare(
        `SELECT * FROM cat_hanger_scores WHERE device_id = ?`
      )
        .bind(deviceId)
        .first<CatHangerRow>();
      if (found) {
        const ahead = await env.DB.prepare(
          `SELECT COUNT(*) AS cnt FROM cat_hanger_scores WHERE time_sec > ?`
        )
          .bind(found.time_sec)
          .first<{ cnt: number }>();
        player = {
          rank: Number(ahead?.cnt ?? 0) + 1,
          deviceId: found.device_id,
          playerName: found.player_name,
          timeSec: found.time_sec,
          colorId: found.color_id,
          eyeColor: found.eye_color,
          accessory: found.accessory,
          updatedAt: found.updated_at,
        };
      }
    }

    return jsonResponse({ ok: true, entries, player });
  }

  if (request.method === 'POST' && path === '/api/cat-hanger/score') {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const deviceId = cleanDeviceId(body?.deviceId);
    if (!deviceId) {
      return jsonResponse({ ok: false, error: 'INVALID_DEVICE_ID' }, 400);
    }

    const playerName = cleanName(body?.playerName, 'Kattenbaas');
    const rawTime = Number(body?.timeSec ?? 0);
    if (!Number.isFinite(rawTime) || rawTime <= 0 || rawTime > 86_400) {
      return jsonResponse({ ok: false, error: 'INVALID_TIME' }, 400);
    }
    const timeSec = Math.round(rawTime * 100) / 100;
    const colorId = Number.isInteger(body?.colorId) ? Number(body?.colorId) : 0;
    const eyeColor = cleanName(body?.eyeColor, 'amber').slice(0, 20);
    const accessory = cleanName(body?.accessory, 'none').slice(0, 20);
    const now = new Date().toISOString();

    const existing = await env.DB.prepare(
      `SELECT * FROM cat_hanger_scores WHERE device_id = ?`
    )
      .bind(deviceId)
      .first<CatHangerRow>();

    const finalTime = existing ? Math.max(existing.time_sec, timeSec) : timeSec;
    const updatedAt = !existing || timeSec > existing.time_sec ? now : existing.updated_at;

    await env.DB.prepare(
      `INSERT INTO cat_hanger_scores (device_id, player_name, time_sec, color_id, eye_color, accessory, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(device_id) DO UPDATE SET
         player_name = excluded.player_name,
         time_sec = MAX(cat_hanger_scores.time_sec, excluded.time_sec),
         color_id = excluded.color_id,
         eye_color = excluded.eye_color,
         accessory = excluded.accessory,
         updated_at = ?`
    )
      .bind(deviceId, playerName, finalTime, colorId, eyeColor, accessory, updatedAt, updatedAt)
      .run();

    const ahead = await env.DB.prepare(
      `SELECT COUNT(*) AS cnt FROM cat_hanger_scores WHERE time_sec > ?`
    )
      .bind(finalTime)
      .first<{ cnt: number }>();

    return jsonResponse({
      ok: true,
      entry: {
        rank: Number(ahead?.cnt ?? 0) + 1,
        deviceId,
        playerName,
        timeSec: finalTime,
        colorId,
        eyeColor,
        accessory,
        updatedAt,
      },
    });
  }

  return null;
}

async function handleCatClimber(
  request: Request,
  url: URL,
  env: Env
): Promise<Response | null> {
  const path = url.pathname;

  if (request.method === 'GET' && path === '/api/cat-climber/highscores') {
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 100);
    const deviceId = url.searchParams.get('deviceId')?.trim() || '';

    const { results } = await env.DB.prepare(
      `SELECT device_id, player_name, meters, color_id, eye_color, accessory, updated_at
       FROM cat_climber_scores
       ORDER BY meters DESC, updated_at ASC
       LIMIT ?`
    )
      .bind(limit)
      .all<CatClimberRow>();

    const entries = results.map((r, idx) => ({
      rank: idx + 1,
      deviceId: r.device_id,
      playerName: r.player_name,
      meters: r.meters,
      colorId: r.color_id,
      eyeColor: r.eye_color,
      accessory: r.accessory,
      updatedAt: r.updated_at,
    }));

    let player = null;
    if (deviceId) {
      const found = await env.DB.prepare(
        `SELECT * FROM cat_climber_scores WHERE device_id = ?`
      )
        .bind(deviceId)
        .first<CatClimberRow>();
      if (found) {
        const ahead = await env.DB.prepare(
          `SELECT COUNT(*) AS cnt FROM cat_climber_scores WHERE meters > ?`
        )
          .bind(found.meters)
          .first<{ cnt: number }>();
        player = {
          rank: Number(ahead?.cnt ?? 0) + 1,
          deviceId: found.device_id,
          playerName: found.player_name,
          meters: found.meters,
          colorId: found.color_id,
          eyeColor: found.eye_color,
          accessory: found.accessory,
          updatedAt: found.updated_at,
        };
      }
    }

    return jsonResponse({ ok: true, entries, player });
  }

  if (request.method === 'POST' && path === '/api/cat-climber/score') {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const deviceId = cleanDeviceId(body?.deviceId);
    if (!deviceId) {
      return jsonResponse({ ok: false, error: 'INVALID_DEVICE_ID' }, 400);
    }

    const playerName = cleanName(body?.playerName, 'Kattenbaas');
    const rawMeters = Number(body?.meters ?? 0);
    if (!Number.isFinite(rawMeters) || rawMeters <= 0 || rawMeters > 10_000_000) {
      return jsonResponse({ ok: false, error: 'INVALID_METERS' }, 400);
    }
    const meters = Math.round(rawMeters * 10) / 10;
    const colorId = Number.isInteger(body?.colorId) ? Number(body?.colorId) : 0;
    const eyeColor = cleanName(body?.eyeColor, 'amber').slice(0, 20);
    const accessory = cleanName(body?.accessory, 'none').slice(0, 20);
    const now = new Date().toISOString();

    const existing = await env.DB.prepare(
      `SELECT * FROM cat_climber_scores WHERE device_id = ?`
    )
      .bind(deviceId)
      .first<CatClimberRow>();

    const finalMeters = existing ? Math.max(existing.meters, meters) : meters;
    const updatedAt = !existing || meters > existing.meters ? now : existing.updated_at;

    await env.DB.prepare(
      `INSERT INTO cat_climber_scores (device_id, player_name, meters, color_id, eye_color, accessory, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(device_id) DO UPDATE SET
         player_name = excluded.player_name,
         meters = MAX(cat_climber_scores.meters, excluded.meters),
         color_id = excluded.color_id,
         eye_color = excluded.eye_color,
         accessory = excluded.accessory,
         updated_at = ?`
    )
      .bind(deviceId, playerName, finalMeters, colorId, eyeColor, accessory, updatedAt, updatedAt)
      .run();

    const ahead = await env.DB.prepare(
      `SELECT COUNT(*) AS cnt FROM cat_climber_scores WHERE meters > ?`
    )
      .bind(finalMeters)
      .first<{ cnt: number }>();

    return jsonResponse({
      ok: true,
      entry: {
        rank: Number(ahead?.cnt ?? 0) + 1,
        deviceId,
        playerName,
        meters: finalMeters,
        colorId,
        eyeColor,
        accessory,
        updatedAt,
      },
    });
  }

  return null;
}

async function handleFairSlots(
  request: Request,
  url: URL,
  env: Env
): Promise<Response | null> {
  const path = url.pathname;

  if (request.method === 'GET' && path === '/api/fair-slots/highscores') {
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 100);
    const deviceId = url.searchParams.get('deviceId')?.trim() || '';

    const { results } = await env.DB.prepare(
      `SELECT device_id, player_name, level, coins, total_won, total_spins, tournament_points, species, color_id, updated_at
       FROM fair_coin_slots_scores
       ORDER BY total_won DESC, level DESC, coins DESC, updated_at ASC
       LIMIT ?`
    )
      .bind(limit)
      .all<FairSlotsRow>();

    const entries = results.map((r, idx) => ({
      rank: idx + 1,
      deviceId: r.device_id,
      playerName: r.player_name,
      level: r.level,
      coins: r.coins,
      totalWon: r.total_won,
      totalSpins: r.total_spins,
      tournamentPoints: r.tournament_points,
      species: r.species,
      colorId: r.color_id,
      updatedAt: r.updated_at,
    }));

    let player = null;
    if (deviceId) {
      const found = await env.DB.prepare(
        `SELECT * FROM fair_coin_slots_scores WHERE device_id = ?`
      )
        .bind(deviceId)
        .first<FairSlotsRow>();
      if (found) {
        const ahead = await env.DB.prepare(
          `SELECT COUNT(*) AS cnt FROM fair_coin_slots_scores WHERE total_won > ?`
        )
          .bind(found.total_won)
          .first<{ cnt: number }>();
        player = {
          rank: Number(ahead?.cnt ?? 0) + 1,
          deviceId: found.device_id,
          playerName: found.player_name,
          level: found.level,
          coins: found.coins,
          totalWon: found.total_won,
          totalSpins: found.total_spins,
          tournamentPoints: found.tournament_points,
          species: found.species,
          colorId: found.color_id,
          updatedAt: found.updated_at,
        };
      }
    }

    return jsonResponse({ ok: true, entries, player });
  }

  if (request.method === 'POST' && path === '/api/fair-slots/score') {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const deviceId = cleanDeviceId(body?.deviceId);
    if (!deviceId) {
      return jsonResponse({ ok: false, error: 'INVALID_DEVICE_ID' }, 400);
    }

    const playerName = cleanName(body?.playerName, 'Speler');
    const level = Math.max(1, Math.trunc(Number(body?.level ?? 1)));
    const coins = Math.max(0, Math.floor(Number(body?.coins ?? 0)));
    const totalWon = Math.max(0, Math.floor(Number(body?.totalWon ?? 0)));
    const totalSpins = Math.max(0, Math.trunc(Number(body?.totalSpins ?? 0)));
    const tournamentPoints = Math.max(0, Math.trunc(Number(body?.tournamentPoints ?? 0)));
    const species = cleanName(body?.species, 'piggy').slice(0, 16);
    const colorId = cleanName(body?.colorId, 'pink').slice(0, 20);
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO fair_coin_slots_scores (device_id, player_name, level, coins, total_won, total_spins, tournament_points, species, color_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(device_id) DO UPDATE SET
         player_name = excluded.player_name,
         level = MAX(fair_coin_slots_scores.level, excluded.level),
         coins = excluded.coins,
         total_won = MAX(fair_coin_slots_scores.total_won, excluded.total_won),
         total_spins = MAX(fair_coin_slots_scores.total_spins, excluded.total_spins),
         tournament_points = MAX(fair_coin_slots_scores.tournament_points, excluded.tournament_points),
         species = excluded.species,
         color_id = excluded.color_id,
         updated_at = excluded.updated_at`
    )
      .bind(deviceId, playerName, level, coins, totalWon, totalSpins, tournamentPoints, species, colorId, now)
      .run();

    const saved = await env.DB.prepare(
      `SELECT * FROM fair_coin_slots_scores WHERE device_id = ?`
    )
      .bind(deviceId)
      .first<FairSlotsRow>();

    const finalWon = saved?.total_won ?? totalWon;
    const ahead = await env.DB.prepare(
      `SELECT COUNT(*) AS cnt FROM fair_coin_slots_scores WHERE total_won > ?`
    )
      .bind(finalWon)
      .first<{ cnt: number }>();

    return jsonResponse({
      ok: true,
      entry: {
        rank: Number(ahead?.cnt ?? 0) + 1,
        deviceId,
        playerName: saved?.player_name ?? playerName,
        level: saved?.level ?? level,
        coins: saved?.coins ?? coins,
        totalWon: finalWon,
        totalSpins: saved?.total_spins ?? totalSpins,
        tournamentPoints: saved?.tournament_points ?? tournamentPoints,
        species: saved?.species ?? species,
        colorId: saved?.color_id ?? colorId,
        updatedAt: saved?.updated_at ?? now,
      },
    });
  }

  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/api/health')) {
      return jsonResponse({
        ok: true,
        service: 'arcade-highscores-worker',
        backend: 'cloudflare-d1',
        games: ['click-planet', 'cat-hanger', 'cat-climber', 'fair-coin-slots'],
      });
    }

    await ensureSchema(env.DB);

    const cp = await handleClickPlanet(request, url, env);
    if (cp) return cp;

    const ch = await handleCatHanger(request, url, env);
    if (ch) return ch;

    const cc = await handleCatClimber(request, url, env);
    if (cc) return cc;

    const fcs = await handleFairSlots(request, url, env);
    if (fcs) return fcs;

    return jsonResponse({ ok: false, error: 'NOT_FOUND' }, 404);
  },
};
