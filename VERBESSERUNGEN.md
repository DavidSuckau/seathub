# SeatHub / Agenten-Plattform – Was als Nächstes verbessern

Stand: Prototyp (LocalStorage). Zielbild: Betriebssystem mit Flows + KI-Agenten; SeatHub als erste Fachdomäne.
Prinzip: Agent plant & bereitet vor – Mensch entscheidet – Flow orchestriert.

---

## Erledigt (Session)

- [x] **1.1 Flow einstellbar** – Nodes hinzufügen/löschen/umbenennen, Verbindungen ziehen/löschen, Eigenschaften (Typ, Checkliste, Agent), Modus Auto↔Vorschlag, aktiv/inaktiv, Duplizieren
- [x] **1.2 Folgepfad** – Agent-/Lager-Nodes erzeugen Insights und laufen durch; Freigabe erzeugt Prüfauftrag; Flow-Ende erkenntbar; Seed-Kanten linear
- [x] **1.3 Modus Vorschlag** – pendingFollowUp am Auftrag, Annehmen/Ablehnen mit Historie + Insight
- [x] **1.4 Checkliste am Node** – im Editor als Zeilenliste editierbar
- [x] **Mini Flow-Fortschritt** am Auftragsdetail

---

## 1. Priorität hoch (weiter)

### 1.1 Flow-Editor – Rest
- [ ] Mehrere Nachfolger / Verzweigungen (Freigabe ja/nein mit benannten Kanten)
- [ ] Flow neu anlegen (nicht nur duplizieren)
- [ ] Validierung (Start vorhanden, keine toten Enden ohne „Ende“)

### 1.2 Folgeaufträge – Rest
- [ ] Agent-Node optional „warten auf Bestätigung“ bevor weiter
- [ ] Lager-Node an echte Materialdaten koppeln

### 1.4 Checklisten – Rest
- [ ] Pflichtfelder / Signatur bei Freigabe
- [ ] Abbruch / Zurück an vorherigen Schritt

---

## 2. Agenten (digitale Zwillinge)

### 2.1 Von Simulation zu nachvollziehbarer Logik
- [ ] Vorschläge immer mit Begründung und Datenbasis
- [ ] Agent greift in echte Screens ein (vorbefüllen)
- [ ] Guardrails: was nie ohne Bestätigung darf

### 2.2 Abdeckung der Agenten-Rollen
- [ ] Entwicklungs-Agent: ähnliche Bezüge aus Historie
- [ ] CAD-/Schnitt-Agent: Abhängigkeiten Profil ↔ Bezug
- [ ] Lager-Agent: echte Material-/Lagerdaten
- [ ] Termin-Agent: SOP, Kapazität, Standort
- [ ] Qualitäts-Agent: Freigabe-% und LOPs
- [ ] Wissens-Agent: Suche über Projekte / Chronik

### 2.3 Mensch-in-der-Schleife
- [ ] Überall Kennzeichnung Vorschlag vs. Entscheidung (teilweise vorhanden)

---

## 3. Domäne SeatHub

- [ ] Programm-Start / Muster / Freigabe als Standard-Flows
- [ ] LOP-Erzeugung aus Qualitäts-Node
- [ ] Freigabe-% durch Flow-Fortschritt aktualisieren
- [ ] Filter: nur Flow-Aufträge / wartet auf Mensch
- [ ] Durchgängiges Demo-Szenario + Reset inkl. Plattform

---

## 4. Präsentation

- [ ] 1-Klick „Demo starten“ mit fertigem Szenario
- [ ] Legende Node-Arten prominent
- [ ] Deep-Links für Drehbuch

---

## 5. Technik (später)

- [ ] Backend / Persistenz (z. B. Supabase)
- [ ] Mehrbenutzer, Auth, Audit serverseitig
- [ ] Flow-Engine als Domain-Events (testbar)
- [ ] Einheitliches Agent-API hinter der UI
- [ ] E2E-Smoke: Start → Checkliste → Folge / Vorschlag

---

## 6. Bewusst später

- Vollständiges BPMN
- Autonome Agenten ohne Mensch
- Mobile Native / volle ERP-Integration

---

## Empfohlene nächste Schritte

1. Verzweigungen (benannte Kanten ja/nein)
2. Flow neu anlegen + Validierung
3. 1-Klick-Demo-Drehbuch
4. Agent-Vorschläge stärker in Fachscreens
5. Persistenz / Mehrbenutzer
