# Pflegebox Konfigurator + Kundenanlage (Fertigprodukt)

Dieses Projekt ist ein **4‑Schritt Pflegebox‑Konfigurator** mit:
- ✅ Budget-Limit (42 €) inkl. Sperre bei Überschreitung
- ✅ Pflegegrad Pflicht (ohne Pflegegrad kein Weiter)
- ✅ Kundendaten Schritt
- ✅ **Automatisches Anlegen/Updaten von Kunden**
- ✅ **Speichern von Bestellungen + Positionen**
- ✅ Admin-Bereich (`/admin`) mit Kundenliste + Bestellungen

## 1) Lokaler Start

```bash
npm install
npm run dev
```

## 2) Supabase einrichten

1. In Supabase ein neues Projekt erstellen
2. In **SQL Editor** die Datei `supabase/schema.sql` ausführen
3. In **Project Settings → API** die Keys kopieren

### Benötigte Environment Variables (Vercel & lokal)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`  *(wichtig: Service Role nur serverseitig!)*
- `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET` *(beliebiger langer Random-String)*

**Lokal:** in `.env.local` eintragen.

## 3) Deployment auf Vercel

1. Repo zu GitHub pushen
2. In Vercel `New Project` → Repo auswählen
3. In **Project Settings → Environment Variables** die Variablen setzen
4. Deploy

## 4) Admin Login

- URL: `/admin`
- Passwort = `ADMIN_PASSWORD`

## 5) Anpassungen (Produkte/Preise)

Produkte kannst du in `lib/catalog.ts` bearbeiten.

---

Wenn du als nächstes willst:
- PDF „Originalformular 1:1“ automatisch befüllen
- Monatslogik (pro Kunde nur 1 Box pro Monat)
- Übergabe an Abrechnungszentrum (CSV/DTA/REST)

…kann man direkt als nächste Ausbaustufe ergänzen.
