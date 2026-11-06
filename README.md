# Kinderprinz Miguel I. · Laura & Louisa – offizielle Webseite

One-Page-Webseite mit 35-sekündiger, MP3-synchroner Bühnenshow, scrollgesteuerten Vorstellungen,
interaktivem 3D-Prinzenszepter, Terminkalender, moderiertem Gästebuch und geschütztem Admin-Panel.

## Technik

| Bereich | Umsetzung |
|---|---|
| Frontend | React 18 + TypeScript, Vite, GSAP/ScrollTrigger, Three.js (3D-Zepter, lazy geladen), canvas-confetti |
| Hero-Show | SVG-Bühne; jede Bewegung ist eine Funktion der **Audio-Wiedergabezeit** (`src/hero/show.ts`) – Pause, Puffern, Ton an/aus bleiben synchron |
| Backend | Node.js 22 + Express 5, SQLite (`node:sqlite`, keine Zusatzdatenbank nötig) |
| Auth | scrypt-Passwort-Hash, HttpOnly/SameSite=Strict-Sitzungscookie (8 h), CSRF-Header, Login-Ratenbegrenzung |
| Uploads | Bilder werden neu kodiert (Metadaten/GPS entfernt), MP3/GLB per Dateisignatur geprüft |
| Datenschutz | Keine Tracker, keine externen Schriften/CDNs, `noindex` standardmäßig an, IP im Gästebuch nur gekürzt+gehasht, nach 30 Tagen gelöscht |

## Lokal starten

```bash
npm install
npm run create-admin -- admin "EinSicheresPasswort123"
npm run dev          # Server :3000 + Vite :5173 → http://localhost:5173
```

## Produktion

```bash
npm run build
NODE_ENV=production ADMIN_USER=admin ADMIN_PASSWORD="…mind. 12 Zeichen…" node server/index.js
```

oder mit Docker:

```bash
docker build -t prinzenteam .
docker run -d -p 3000:3000 -v prinzenteam-data:/data -e ADMIN_USER=admin -e ADMIN_PASSWORD="…" prinzenteam
```

**Voraussetzungen für den Livegang**
- Ein Server/Hoster mit Node.js 22 (z. B. VPS, Render, Railway, Fly.io) und **HTTPS** (Reverse-Proxy wie Caddy/nginx; dann `TRUST_PROXY=1` setzen).
- Persistenter Speicher für `DATA_DIR` (Datenbank + Uploads) und regelmäßige Backups dieses Ordners.
- Umgebungsvariablen: `PORT`, `DATA_DIR`, `TRUST_PROXY`, `COOKIE_SECURE` (Standard in Produktion: an), `ADMIN_USER`/`ADMIN_PASSWORD` (nur für den ersten Start).
- Ein reiner Static-Hoster (GitHub Pages, Netlify ohne Functions) reicht **nicht**, weil Admin, Gästebuch und Termine ein Backend brauchen.

## Admin-Panel

`/admin` – Startseite (Gruppenfoto, MP3, Texte, Autoplay, Zeitmarken der Show), Prinzenteam (Portraits, Namen, Motto, Texte, Infos),
Zepter (Referenzbild, optionales eigenes `.glb`-Modell, Motto, Session, Team-Kapitel), Termine, Gästebuch-Moderation, Finale & Recht, Passwort.

Wird eine **neue MP3** hochgeladen, die Zeitmarken unter „Animation“ anpassen – die gesamte Show verzieht sich automatisch auf die neuen Punkte.

## Vor der Veröffentlichung auszufüllen (bewusst als Platzhalter gekennzeichnet)

1. **Impressum** (Verein/verantwortliche Person, Anschrift, Kontakt) – Tab „Finale & Recht“.
2. **Datenschutzerklärung**: Verantwortlicher, Hoster, Log-Speicherdauer ergänzen; rechtlich prüfen lassen.
3. **Einwilligung der Erziehungsberechtigten** zur Veröffentlichung von Fotos und Vornamen einholen und im Admin bestätigen.
4. **Offizielles Sessionsmotto** – derzeit steht dort ein aus der Ansage abgeleiteter Vorschlag „Mit königlichem Glanz und ganz viel Herz“.
5. **Persönliche Mottos und Infos** der Kinder – derzeit nur rollenbezogene, neutrale Texte (keine privaten Angaben).
6. **Termine** – die vier Beispieltermine sind mit „[PLATZHALTER]“ markiert.
7. **Sessionsdaten** im Zepter-Kapitel II (11.11.2026, Weiberfastnacht 11.02.2027, Rosenmontag 15.02.2027) prüfen.

## Show-Zeitplan (aus der MP3 gemessen)

| Zeit | Ansage | Bühne |
|---|---|---|
| 0–1,5 s | Musik | Vorhang öffnet, Helfer bringen Leiter, Eimer, Lampe |
| 1,5 s | „Meine Damen und Herren …“ | Scheinwerfer geht flackernd an |
| 5,0 s | „große und kleine Jecken …“ | Maler auf der Leiter und Putzhilfe legen das Bild frei |
| 7,9 s | „drei ganz besondere Persönlichkeiten“ | Goldrahmen wird aus dem Schnürboden herabgelassen |
| 10,7 s | „Mit königlichem Glanz …“ | Rahmen wird poliert (Glanzlicht, Funkeln) |
| 14,3 s | „… die fünfte Jahreszeit“ | Helfer stolpert, Goldfarbe spritzt aufs Bild |
| 16,8 s | „Seid ihr bereit?“ | Alle winken ins Publikum |
| 18,0 s | „Bühne frei …“ | Deckenscheinwerfer, Lampe schwenkt auf die Gesichter |
| 21,4 s | „Kinderprinz Miguel der Erste“ | Miguel wird mit Goldring enthüllt, Namensschild |
| 26,6 / 27,3 s | „Laura und Louisa“ | Beide Paginnen werden enthüllt |
| 30,1 s | „Lasst das Konfetti fliegen …“ | Probeschuss der Konfettikanonen |
| 33,2 s | „Dreimal kräftig“ | Drei Fäuste in die Luft |
| 34,5 s | „Alaaf!“ | Kanonen feuern, Bild komplett, Applaus, Verbeugung |

## Zum 3D-Zepter

Das Zepter ist ein **prozedural modelliertes** Three.js-Objekt nach dem Referenzbild (gedrechselte Goldteile, facettierte Rubine/Brillanten,
Samtschaft mit juwelenbesetzter Goldspirale, Krone mit Bögen und Lilien, Narrenkappe mit Schellen, simulierte Satinbänder).
Nicht sichtbare Seiten wurden symmetrisch ergänzt. Für noch mehr Detailtreue kann ein professionell modelliertes `.glb`
(z. B. aus Blender, < 5 MB, Draco-frei) im Admin hochgeladen werden; es ersetzt dann das mitgelieferte Modell.
Ohne WebGL zeigt die Seite das Referenzfoto.
