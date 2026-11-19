# INOX COMMUNITY

Piattaforma community di Inox Racing Puglia. PWA in Next.js 15 + Supabase, media su Cloudflare R2, hosting su Vercel.

## Cosa contiene questa versione (Milestone 1)

- Registrazione, accesso, conferma email, uscita
- Feed "Per te" e "Seguiti", con reazioni emoji (una per utente per post, tutte le emoji disponibili) e salvataggio
- Pubblicazione di post con foto (ridimensionate sul telefono a 2048 px in JPEG, caricate direttamente su R2)
- Garage pubblico `/garage/[username]` con auto, foto, follower e badge cliente verificato
- Forum con categorie, discussioni e risposte
- Raduni: elenco, partecipazione, indicazioni stradali
- Ricerca utenti, PWA installabile, service worker pronto per le notifiche push
- Contest e notifiche hanno già la loro pagina, ancora vuota

Arrivano nella Milestone 2: video da 20 secondi, mappa interattiva dei raduni, contest, punti, badge, classifiche mensili, notifiche push, dashboard `/admin`.

## Messa in funzione

### 1. Supabase
1. Crea il progetto (regione EU, per esempio Frankfurt).
2. SQL Editor: incolla ed esegui `supabase/migrations/0001_init.sql`.
3. Authentication > URL Configuration: imposta Site URL `https://community.inoxracingpuglia.it` e aggiungi `https://community.inoxracingpuglia.it/auth/callback` (più `http://localhost:3000/auth/callback` per lo sviluppo) tra i Redirect URL.
4. Dopo esserti registrato, rendi admin il tuo account dal SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where username = 'il_tuo_username';
   ```
5. Per assegnare il badge cliente verificato, finché non c'è la dashboard: `select set_verified_customer('<id utente>', true);` eseguito da un admin, oppure modifica la colonna dal Table Editor.

### 2. Cloudflare R2
1. Crea il bucket `inox-community-media`.
2. Collega un dominio pubblico al bucket (per esempio `media.inoxracingpuglia.it`).
3. Crea un token API R2 con permesso di lettura e scrittura solo su quel bucket.
4. Imposta la CORS policy del bucket, così il browser può caricare i file:
   ```json
   [
     {
       "AllowedOrigins": ["https://community.inoxracingpuglia.it", "http://localhost:3000"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

### 3. Vercel
1. Importa il repository.
2. Inserisci le variabili d'ambiente elencate in `.env.example` (mai nel codice).
3. Collega il dominio `community.inoxracingpuglia.it`.

### Sviluppo in locale
```bash
cp .env.example .env.local   # e compila i valori
npm install
npm run dev
```

## Note tecniche
- Il database è l'unica fonte dei dati. Il service worker non mette in cache contenuti.
- Ogni tabella ha Row Level Security attiva. Gli utenti non possono assegnarsi il badge di cliente verificato né il ruolo di admin: quelle colonne sono escluse dai permessi di modifica.
- Le chiavi R2 restano sul server: il browser riceve solo un URL firmato valido 5 minuti per un singolo file.
- Le versioni delle dipendenze sono fissate.
