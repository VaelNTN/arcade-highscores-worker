# Google Play Store & Closed Testing Automatisering Gids

Alle 4 Android-apps (`click-planet`, `cat-hanger`, `cat-climber`, `fair-coin-slots`) zijn nu volledig voorbereid op **automatische release-signing + automatische Play Store Closed Testing (`alpha`) uploads** via GitHub Actions.

---

## Overzicht van alle 4 apps

| App | Package ID | Privacy Policy URL (voor Play Console) |
|---|---|---|
| **Click Planet** | `com.clickplanet.game` | `https://github.com/VaelNTN/click-planet/blob/main/PRIVACY_POLICY.md` |
| **Cat Hanger** | `com.cathanger.game` | `https://github.com/VaelNTN/cat-hanger/blob/main/PRIVACY_POLICY.md` |
| **Cat Climber** | `com.catclimber.game` | `https://github.com/VaelNTN/cat-climber/blob/main/PRIVACY_POLICY.md` |
| **Fair Coin Slots** | `com.faircoinslots.game` | `https://github.com/VaelNTN/fair-coin-slots/blob/main/PRIVACY_POLICY.md` |

> **Belangrijk voor Fair Coin Slots:** Kies in Google Play Console bij **App content -> Content rating** dat het spel **Simulated Gambling** is *zonder* echt-geld transacties (12+ / PEGI 12). Zet **Real-money gambling: No** en **In-app purchases: No**.

---

## Stap 1 — Maak 1 universele Upload Keystore (eenmalig, voor alle 4 apps)

Gebruik **één** keystore voor al je 4 apps en bewaar het bestand veilig (bijvoorbeeld in je wachtwoordmanager).

Draai dit in een terminal (op je PC of in Git Bash / Linux / macOS):

```bash
keytool -genkeypair -v \
  -keystore vaelntn-upload.jks \
  -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Converteer de keystore naar één regel Base64:
- **Linux / Git Bash:**
  ```bash
  base64 -w 0 vaelntn-upload.jks > keystore.b64.txt
  ```
- **macOS:**
  ```bash
  base64 -i vaelntn-upload.jks | tr -d '\n' > keystore.b64.txt
  ```

Zet in alle 4 GitHub-repo's (*Settings -> Secrets and variables -> Actions -> New repository secret*) deze 4 secrets:
1. `ANDROID_KEYSTORE_BASE64` -> inhoud van `keystore.b64.txt`
2. `ANDROID_KEYSTORE_PASSWORD` -> je keystore-wachtwoord
3. `ANDROID_KEY_ALIAS` -> `upload`
4. `ANDROID_KEY_PASSWORD` -> je key-wachtwoord

Vanaf dat moment is elke `app-release.aab` die GitHub Actions bouwt **officieel gesigneerd** en heeft hij elke build automatisch een hoger `versionCode` (`github.run_number`).

---

## Stap 2 — Optioneel: Automatische upload naar Google Play Closed Testing (`alpha`)

Wil je dat elke `git push` de nieuwe versie vanzelf doorzet naar je Play Console **Closed Testing (`alpha`)** track?

1. Ga naar [Google Cloud Console](https://console.cloud.google.com) -> maak of kies een project -> schakel de **Google Play Android Developer API** in.
2. Maak onder *IAM & Admin -> Service Accounts* een service account aan -> maak een **JSON key** en download die.
3. Ga in **Google Play Console** naar *Users and permissions -> Invite new users* -> plak het e-mailadres van je service account en geef rechten voor **Releases** (Testing / Production releases beheren).
4. Voeg de volledige inhoud van het JSON-bestand toe als 5e GitHub secret in elk van de 4 repo's:
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

> **Let op (Google Play API regel):** De **allereerste** `.aab` van een gloednieuwe app moet je 1 keer handmatig uploaden in de Play Console UI om de app aan te maken. Daarna doet GitHub Actions elke volgende release automatisch! (Je kunt in GitHub Actions onder *Run workflow* ook kiezen tussen `internal`, `alpha`, `beta` of `production`.)

---

## Stap 3 — 12 testers in 14 dagen automatiseren via 1 Google Group (legaal & zonder moeite)

Zo hoef je niemand handmatig per e-mail toe te voegen:

1. Ga naar **https://groups.google.com** -> klik **Create group** (bijv. `vaelntn-android-testers@googlegroups.com`).
2. Zet bij **Who can join group**: **Anyone on the web** (iedereen mag lid worden).
3. Zet in Google Play Console bij **alle 4 de apps**:
   - *Testing -> Closed testing -> Manage track -> Testers*
   - Kies **Google Groups** (i.p.v. e-maillijst) en plak `vaelntn-android-testers@googlegroups.com`.
4. Sla op en kopieer voor elke app de **Join on the web** link uit Play Console.

Wie eerst lid wordt van die ene Google Group kan meteen met 1 klik **alle 4 je apps tegelijk** testen!

---

## Stap 4 — Kant-en-klare post voor r/AndroidClosedTesting & Testers Community

Op **Reddit `r/AndroidClosedTesting`** en de Android-app **Testers Community** helpen solo-developers elkaar ("test-for-test"). Als je iemands app installeert, testen 15-25 developers jouw 4 apps terug binnen 1-2 dagen.

Pas alleen de `[GOOGLE_GROUP_LINK]` en de 4 `[PLAY_WEB_LINK_...]` links aan en plaats dit:

```markdown
Title: [4 Games] Need testers for 14-day closed test — I will install & keep yours for 14+ days too!

Hi everyone! I built 4 small free indie games (no ads, no pay-to-win, no real money) and I'm looking for closed testers.
Since all 4 apps use the same Google Group, joining once unlocks all 4!

1) Join the Google Group first:
https://groups.google.com/g/[JOUW-GROEP-NAAM]

2) Opt-in & download the apps:
- Click Planet: [PLAY_WEB_LINK_CLICK_PLANET]
- Cat Hanger: [PLAY_WEB_LINK_CAT_HANGER]
- Cat Climber: [PLAY_WEB_LINK_CAT_CLIMBER]
- Fair Coin Slots (100% free virtual coins, anti-gambling cartoon arcade): [PLAY_WEB_LINK_FAIR_COIN_SLOTS]

Leave a screenshot + your Google Group & Play link in the comments and I will install yours right away and keep them installed for 14+ days!
```

---

## Stap 5 — Antwoorden voor "Apply for Production" (na dag 14)

Na 14 dagen aaneengesloten Closed Testing met >=12 testers vraagt Google Play een korte vragenlijst. Deze antwoorden werken goed en zijn eerlijk:

- **How did you recruit testers?**  
  *"Recruited independent Android developers and players via closed testing communities using a public opt-in Google Group."*
- **How did testers engage with your app?**  
  *"Testers played across multiple sessions, tested core gameplay loops, UI scaling across different screen sizes, adaptive icons, and online leaderboard syncing."*
- **What did you change based on tester feedback?**  
  *"Refined adaptive launcher icon padding, improved touch responsiveness, added offline/local leaderboard fallback handling, and tuned progression pacing."*
