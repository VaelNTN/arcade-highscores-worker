# 🌐 Arcade Highscores Worker (Cloudflare + Gratis D1 Database)

Eén centrale, gratis online highscore-server voor alle 4 de apps:
1. **Click Planet** (`/api/highscores`, `/api/player/:deviceId`, `/api/claim-name`, `/api/score`)
2. **Cat Hanger** (`/api/cat-hanger/highscores`, `/api/cat-hanger/score`)
3. **Cat Climber** (`/api/cat-climber/highscores`, `/api/cat-climber/score`)
4. **Fair Coin Slots** (`/api/fair-slots/highscores`, `/api/fair-slots/score`)

---

## Snelste manier om online te zetten (3 stappen, 100% gratis)

Vereist: een gratis Cloudflare-account + Node.js op je computer (of via GitHub Actions hieronder).

### Stap 1 — Installeer & log in bij Cloudflare
```bash
git clone https://github.com/VaelNTN/arcade-highscores-worker.git
cd arcade-highscores-worker
npm install
npx wrangler login
```

### Stap 2 — Maak de D1 database + zet de Worker direct live
Eén commando regelt alles automatisch (`d1 create`, `database_id` invullen, `schema.sql` uitvoeren en `wrangler deploy`):
```bash
npm run setup
```
*(Liever stap voor stap handmatig? Gebruik: `npx wrangler d1 create arcade-highscores-db` -> plak `database_id` in `wrangler.toml` -> `npx wrangler d1 execute arcade-highscores-db --remote --file=./schema.sql --yes` -> `npx wrangler deploy`)*

### Stap 3 — Koppel de live URL aan App 1, 2, 3 en 4
Na stap 2 verschijnt je live URL in beeld, bijvoorbeeld:
`https://arcade-highscores-api.<jouw-naam>.workers.dev`

Je hebt 2 manieren om hem te gebruiken:
- **Direct in de apps (zonder nieuwe APK):** open *Highscores* (of *Bonussen → Toernooi* in Fair Coin Slots), tik op **Server** en plak je `https://...workers.dev` URL.
- **Voor altijd in elke nieuwe APK/AAB:** zet op GitHub bij elk van de 4 repositories onder **Settings → Secrets and variables → Actions → Variables** de variabele **`VITE_API_URL`** op jouw `https://...workers.dev` URL.

---

## Alternatief: Deployen vanaf GitHub zonder eigen PC
1. Voeg in deze repo onder **Settings → Secrets and variables → Actions → Secrets** toe:
   - `CLOUDFLARE_API_TOKEN` (Cloudflare API token met template *Edit Cloudflare Workers* + *D1 Edit*)
   - `CLOUDFLARE_ACCOUNT_ID` (jouw Cloudflare Account ID uit het Cloudflare dashboard)
2. Ga naar **Actions → Deploy Shared Highscores Worker (Cloudflare) → Run workflow**.
3. Open de log van de laatste stap: daar staat je `https://arcade-highscores-api.<jouw-naam>.workers.dev` URL!
