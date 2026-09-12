# Associazione — Frontend + Backend

Gestionale per un'associazione culturale. Due progetti separati che lavorano insieme:

- **`associazione/`** — frontend Angular 21 (questa cartella)
- **`associazione-be/`** — backend NestJS 11 (`../associazione-be/`)

---

## Stack

| | Frontend | Backend |
|---|---|---|
| Framework | Angular 21, standalone components | NestJS 11 |
| Stile | Tailwind CSS 4, Lucide Angular | — |
| ORM / DB | — | Prisma 7 + PostgreSQL |
| Auth | JWT via cookie httpOnly | JWT (access + refresh), bcryptjs |
| Storage file | — | Cloudflare R2 (`@aws-sdk/client-s3`) + `sharp` |
| Email | — | Resend (`resend`) |
| Test | Vitest | Jest |
| Linting | ESLint 9 + Prettier | ESLint 9 + Prettier |
| TypeScript | ~5.9 | ^5.7 |

---

## Comandi

### Frontend (`associazione/`)
```bash
npm start          # ng serve --host 0.0.0.0 → :4200
npm run build      # ng build → dist/
npm test           # vitest
```

### Backend (`../associazione-be/`)
```bash
npm run start:dev       # watch mode → :3000
npm run migrate:dev     # prisma migrate dev
npm run migrate:deploy  # prisma migrate deploy
npm run lint            # eslint --fix
npm test                # jest
npm run test:e2e        # jest e2e
```

---

## Struttura frontend

```
src/app/
├── core/
│   ├── guards/          # authGuard (protegge /dashboard)
│   ├── interceptors/    # auth.interceptor (aggiunge JWT alle richieste)
│   ├── models/          # interfacce TypeScript (Member, Event, Article…)
│   └── services/        # un servizio per dominio (auth, members, events…)
├── features/
│   ├── public/          # pagine pubbliche (lazy-loaded)
│   └── private/         # dashboard admin + area socio (lazy-loaded)
├── shared/
│   └── components/
│       ├── public/      # article, event, event-short, footer, navbar, member, product, project
│       └── private/     # sidebar, navbar, toolbar, metric-card, event-calendar, recents, messages
└── i18n/
    ├── translate.pipe.ts
    └── translation.service.ts
```

### Route principali

**Pubbliche** (nessuna guardia):
`/home`, `/about-us`, `/projects/:id`, `/news/:id`, `/events/:slug`, `/donations`, `/contacts`, `/documents`, `/membership`, `/boutique`, `/tessera-preview`, `/unisciti`

**Auth**:
`/login` → pannello admin | `/area-socio` → portale socio | `/register` → registrazione admin con token invito

**Dashboard** (protetta da `authGuard`):
`/dashboard/overview`, `/members`, `/members/socio/:id`, `/members/admin/:id`, `/events`, `/messages`, `/news`, `/projects`, `/donations`, `/settings`, `/activities`

---

## Struttura backend

```
src/
├── auth/              # login/refresh/logout AdminUser, registrazione via token invito
├── member-auth/       # login/OTP/set-password per i soci (portale socio)
├── members/           # CRUD soci, approvazione, cambio stato
├── registrations/     # nuove iscrizioni dal form pubblico
├── events/            # CRUD eventi, backfill slug automatico all'avvio
├── articles/          # CRUD articoli (blocchi JSON + cover)
├── projects/          # CRUD progetti
├── site-settings/     # configurazioni chiave-valore (SiteSetting)
├── contact/           # messaggi dal form contatti, risposta via email
├── activity/          # log attività admin
├── uploads/           # upload file con multer → R2
├── r2/                # R2Service (wrapper S3)
├── mail/              # MailService (Resend)
├── encryption/        # EncryptionService (cifratura codici fiscali)
├── prisma/            # PrismaService/Module
└── migration/         # script one-shot (encrypt-existing)
```

---

## Autenticazione

Il backend ha **due sistemi JWT separati**:

### Admin (`/auth/*`)
- Cookie httpOnly `acr_refresh` (7 giorni, `JWT_REFRESH_SECRET`)
- Access token di breve durata (`JWT_SECRET`) restituito nel body
- Ruoli: `SUPERADMIN`, `ADMIN`

### Socio (`/member-auth/*`)
- Flusso: `checkEmail` → se prima volta: `setPassword` → `login`
- Supporta OTP per recupero/reset password
- JWT separato con segreto proprio

---

## Modelli database (Prisma)

| Modello | Note |
|---|---|
| `Member` | Socio. Soft delete (`deletedAt`). Codice fiscale cifrato (`fiscalCodeHash`). Unicità su `(fiscalCodeHash, membershipYear)`. |
| `Guardian` | Tutore per soci minorenni, cascade delete da `Member`. |
| `AdminUser` | Utente admin. Può essere collegato a un `Member`. |
| `AdminInvite` | Token invito per registrazione admin (scade). |
| `OtpCode` | Codice OTP per reset password socio. |
| `Event` | Slug univoco, generato automaticamente al boot se mancante. |
| `Article` | Blocchi contenuto in JSON (`blocks: Json`). |
| `Project` | Categoria: `cultura \| tradizione \| sociale \| educazione`. |
| `Product` | Articoli boutique. |
| `Donation` | Collegabile opzionalmente a un `Member`. |
| `ContactMessage` | Messaggi form contatti, flag `read`. |
| `SiteSetting` | Configurazioni chiave-valore. |

**Enum importanti**: `MemberStatus` (`in_attesa_pagamento` → `pagamento_in_corso` → `attivo` / `rifiutato`), `MemberCategory` (`ordinario`, `under26`, `sostenitore`).

---

## Variabili d'ambiente backend (`.env`)

```
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
CORS_ORIGIN=http://localhost:4200
MAIL_FROM=noreply@tuodominio.com
RESEND_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=associazione
R2_PUBLIC_URL=https://pub-....r2.dev
NODE_ENV=development
PORT=3000
```

> Il file `.env` viene caricato da `import 'dotenv/config'` in `main.ts`. Non serve aggiungere nulla a `prisma.config.ts`.

---

## Note operative

- **Body limit**: 20 MB (configurato in `main.ts` per gestire upload immagini base64).
- **File statici**: la cartella `uploads/` è servita su `/uploads/*` direttamente da NestJS.
- **ValidationPipe globale**: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — i DTO devono essere completi e precisi.
- **i18n**: lingue supportate italiano (`it.json`) e rumeno (`ro.json`), gestite con `TranslationService` + `TranslatePipe`.
- **Icone**: centralizzate in `core/utils/icons.ts` (Lucide Angular).
- **Ambiente frontend**: `src/environments/environment.ts` punta a `http://localhost:3000` in sviluppo.
