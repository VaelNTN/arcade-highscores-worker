-- Click Planet (App 1)
CREATE TABLE IF NOT EXISTS click_planet_scores (
  device_id TEXT PRIMARY KEY,
  planet_name TEXT NOT NULL,
  name_lower TEXT NOT NULL UNIQUE,
  color_id INTEGER NOT NULL DEFAULT 0,
  mass_m REAL NOT NULL DEFAULT 1.0,
  mass_e INTEGER NOT NULL DEFAULT -2,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cp_mass ON click_planet_scores (mass_e DESC, mass_m DESC, updated_at ASC);

-- Cat Hanger (App 2)
CREATE TABLE IF NOT EXISTS cat_hanger_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  time_sec REAL NOT NULL DEFAULT 0,
  color_id INTEGER NOT NULL DEFAULT 0,
  eye_color TEXT NOT NULL DEFAULT 'amber',
  accessory TEXT NOT NULL DEFAULT 'none',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ch_time ON cat_hanger_scores (time_sec DESC, updated_at ASC);

-- Cat Climber (App 3)
CREATE TABLE IF NOT EXISTS cat_climber_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  meters REAL NOT NULL DEFAULT 0,
  color_id INTEGER NOT NULL DEFAULT 0,
  eye_color TEXT NOT NULL DEFAULT 'amber',
  accessory TEXT NOT NULL DEFAULT 'none',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_meters ON cat_climber_scores (meters DESC, updated_at ASC);

-- Fair Coin Slots (App 4)
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
);
CREATE INDEX IF NOT EXISTS idx_fcs_won ON fair_coin_slots_scores (total_won DESC, level DESC, updated_at ASC);
