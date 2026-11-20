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

-- Dog Hanger (App 5)
CREATE TABLE IF NOT EXISTS dog_hanger_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  time_sec REAL NOT NULL DEFAULT 0,
  breed_id INTEGER NOT NULL DEFAULT 0,
  collar_color TEXT NOT NULL DEFAULT 'red',
  accessory TEXT NOT NULL DEFAULT 'none',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dh_time ON dog_hanger_scores (time_sec DESC, updated_at ASC);

-- Dog Climber (App 6)
CREATE TABLE IF NOT EXISTS dog_climber_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  meters REAL NOT NULL DEFAULT 0,
  breed_id INTEGER NOT NULL DEFAULT 0,
  collar_color TEXT NOT NULL DEFAULT 'red',
  accessory TEXT NOT NULL DEFAULT 'none',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dc_meters ON dog_climber_scores (meters DESC, updated_at ASC);

-- Frog Parkour (App 7)
CREATE TABLE IF NOT EXISTS frog_parkour_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  meters REAL NOT NULL DEFAULT 0,
  flies INTEGER NOT NULL DEFAULT 0,
  skin_id INTEGER NOT NULL DEFAULT 0,
  accessory TEXT NOT NULL DEFAULT 'none',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fp_score ON frog_parkour_scores (score DESC, meters DESC, updated_at ASC);

-- 1-Walk Fighter (App 8)
CREATE TABLE IF NOT EXISTS one_walk_fighter_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  kills INTEGER NOT NULL DEFAULT 0,
  max_combo INTEGER NOT NULL DEFAULT 0,
  fighter_skin INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_owf_score ON one_walk_fighter_scores (score DESC, kills DESC, updated_at ASC);

-- Pocket Tanks Duel (App 9)
CREATE TABLE IF NOT EXISTS pocket_tanks_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  tank_skin INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pt_score ON pocket_tanks_scores (score DESC, wins DESC, updated_at ASC);

-- Arcade 100+ Hub (App 10)
CREATE TABLE IF NOT EXISTS arcade_hub_overall (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  avatar_id INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ah_total ON arcade_hub_overall (total_score DESC, games_played DESC, updated_at ASC);

CREATE TABLE IF NOT EXISTS arcade_hub_game_scores (
  game_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (game_id, device_id)
);
CREATE INDEX IF NOT EXISTS idx_ahg_score ON arcade_hub_game_scores (game_id, score DESC, updated_at ASC);

-- Castle Bastion TD (App 11)
CREATE TABLE IF NOT EXISTS castle_bastion_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  wave INTEGER NOT NULL DEFAULT 1,
  kills INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cb_score ON castle_bastion_scores (score DESC, wave DESC, updated_at ASC);

-- Turbo Drift Racer (App 12)
CREATE TABLE IF NOT EXISTS turbo_drift_scores (
  track_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  best_time_ms INTEGER NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  car_id INTEGER NOT NULL DEFAULT 0,
  driver_id INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (track_id, device_id)
);
CREATE INDEX IF NOT EXISTS idx_tdr_time ON turbo_drift_scores (track_id, best_time_ms ASC, updated_at ASC);

CREATE TABLE IF NOT EXISTS turbo_drift_rooms (
  room_code TEXT NOT NULL,
  track_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  PRIMARY KEY (room_code, track_id, device_id)
);
CREATE INDEX IF NOT EXISTS idx_tdr_room ON turbo_drift_rooms (room_code, track_id, updated_at_ms DESC);

-- WorldMatch Chat (App 13)
CREATE TABLE IF NOT EXISTS world_chat_queue (
  device_id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  gender TEXT NOT NULL,
  country_name TEXT NOT NULL,
  country_flag TEXT NOT NULL,
  languages_json TEXT NOT NULL,
  allow_global INTEGER NOT NULL DEFAULT 1,
  room_id TEXT,
  partner_json TEXT,
  status TEXT NOT NULL DEFAULT 'searching',
  updated_at_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wc_queue ON world_chat_queue (status, gender, updated_at_ms DESC);

CREATE TABLE IF NOT EXISTS world_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en',
  created_at_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wc_msg ON world_chat_messages (room_id, created_at_ms ASC);

CREATE TABLE IF NOT EXISTS world_chat_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id TEXT NOT NULL,
  reported_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wc_rep ON world_chat_reports (reported_id, created_at_ms DESC);

-- Starforge Survivors (App 14 - Paid Flagship)
CREATE TABLE IF NOT EXISTS starforge_scores (
  mode TEXT NOT NULL,
  device_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  wave INTEGER NOT NULL DEFAULT 1,
  kills INTEGER NOT NULL DEFAULT 0,
  hero_id TEXT NOT NULL DEFAULT 'kael',
  ascension INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (mode, device_id)
);
CREATE INDEX IF NOT EXISTS idx_sf_score ON starforge_scores (mode, score DESC, wave DESC, updated_at ASC);

-- Fish Eater (App 15)
CREATE TABLE IF NOT EXISTS fish_eater_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  fish_eaten INTEGER NOT NULL DEFAULT 0,
  max_size_cm INTEGER NOT NULL DEFAULT 10,
  best_rank INTEGER NOT NULL DEFAULT 1,
  skin_id TEXT NOT NULL DEFAULT 'ruby',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fe_score ON fish_eater_scores (fish_eaten DESC, max_size_cm DESC, updated_at ASC);

-- Apex Underground (App 16)
CREATE TABLE IF NOT EXISTS apex_underground_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  best_mode TEXT NOT NULL DEFAULT 'sprint',
  car_name TEXT NOT NULL DEFAULT 'Starter',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_au_score ON apex_underground_scores (score DESC, updated_at ASC);

-- Critter Kart GP (App 17)
CREATE TABLE IF NOT EXISTS critter_kart_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  trophies INTEGER NOT NULL DEFAULT 0,
  driver_name TEXT NOT NULL DEFAULT 'Pip',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ck_score ON critter_kart_scores (score DESC, trophies DESC, updated_at ASC);

-- Dune Baja Rally (App 18)
CREATE TABLE IF NOT EXISTS dune_baja_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  best_meters INTEGER NOT NULL DEFAULT 0,
  total_flips INTEGER NOT NULL DEFAULT 0,
  vehicle_name TEXT NOT NULL DEFAULT 'Sandhopper',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_db_score ON dune_baja_scores (best_meters DESC, total_flips DESC, updated_at ASC);

-- SkyCommand 3D (App 19)
CREATE TABLE IF NOT EXISTS skycommand_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  best_fpm INTEGER NOT NULL DEFAULT 999,
  aircraft_name TEXT NOT NULL DEFAULT 'Talon X-22',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sc_score ON skycommand_scores (score DESC, best_fpm ASC, updated_at ASC);

-- AI VIRUSWORLD (App 20)
CREATE TABLE IF NOT EXISTS ai_virusworld_scores (
  device_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  turns INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  faction_name TEXT NOT NULL DEFAULT 'GeePeeTy',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_av_score ON ai_virusworld_scores (score DESC, turns ASC, updated_at ASC);
