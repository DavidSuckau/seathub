# UX-Bewertung SeatHub – Wie Nutzer gerne darin arbeiten

Ziel dieses Dokuments: ehrliche Bewertung des aktuellen Prototyps und ein klares Bild, wie die UX aussehen sollte, wenn **jeder Nutzer nur seinen Bereich** sieht – nicht das Gesamtunternehmen.

---

## 1. Kurzfazit

Der Prototyp ist **funktional und demofähig**, aber für den Alltag **zu breit und zu laut**.

- Die Navigation zeigt oft **10+ Einträge** (Mein Tag, Plattform, Flows, Agenten, Kalender, Aufträge, Abteilung, LOPs, Projekte, Organisation …).
- **Präsentations-Welt** (Plattform / Flows / Agenten) und **Arbeits-Welt** (mein Auftrag, meine Checkliste, meine LOPs) sind vermischt.
- Viele Screens wirken wie **Management-Cockpits** – auch für jemanden, der nur nähen, CAD machen oder zuweisen soll.
- Das Prinzip „Agent schlägt vor, Mensch entscheidet“ ist inhaltlich stark – in der UI aber noch **nicht der ruhige, klare Arbeitsplatz**, den man gerne öffnen würde.

**Kernproblem:** Wir zeigen das Betriebssystem der Firma, statt dem Nutzer **seinen Arbeitsplatz**.

---

## 2. Was Nutzer wirklich brauchen (Rollen)

| Rolle | Kerngedanke | Tägliche Frage |
|--------|-------------|----------------|
| Mitarbeiter (Näher, CAD, Zuschnitt …) | Mein Arbeitstag | Was muss ich **jetzt** tun? |
| Abteilungsleitung | Team + Warteschlange | Wen weise ich zu? Was stockt? |
| Engineering / Projekt | Programm & Freigaben | Welcher Stand, welche offenen Punkte? |
| Management | Überblick, Ausnahmen | Wo brennt es? |
| Extern | Nur freigegebene Arbeit | Was darf ich sehen / liefern? |
| Prozess-/Plattform-Owner (selten) | Flows & Agenten | Wie läuft der Prozess? |

Jeder braucht **3–5 Einstiege**, nicht 12. Alles andere ist Kontext hinter dem Auftrag – nicht gleichwertige Hauptnavigation.

---

## 3. Bewertung Ist-Zustand

### 3.1 Stark
- Klare Fachsprache (Aufträge, LOPs, Stände, Abteilungen)
- „Mein Tag“ als Idee ist richtig
- Checklisten + Flow-Fortschritt machen Prozess nachvollziehbar
- Rollen-Umschalter hilft der Demo – für echte UX später weg / nur Admin

### 3.2 Zu komplex / umständlich
1. **Nav überladen** – Plattform/Flows/Agenten stehen neben Alltag für alle Rollen.
2. **Startseite verkauft Vision**, statt sofort in die Arbeit zu führen (Mitarbeiter landet mental bei „Plattform präsentieren“).
3. **Zu viele Panels und Pills** auf Detailseiten – Status, Flow, Agent, Checkliste, Zuweisung, Historik gleichzeitig.
4. **Gleicher Informationsraum für alle** – Mitarbeiter sieht Organisations- und Generator-Themen, die er nicht steuern muss.
5. **Kognitive Last bei Flows** – Node-Editor ist mächtig, aber gehört in eine **eigene „Prozess“-Sicht**, nicht in den Alltagspfad.
6. **Doppelte Wege** – Aufträge, Mein Tag, Abteilung, Kalender überschneiden sich ohne klare Hierarchie.
7. **Visuell sachlich, aber dicht** – viel Rahmen, viele Chips, wenig „eine Sache im Fokus“.

### 3.3 Design-Eindruck
- Farben und Typo wirken professionell (hell, SAP-/Material-nah).
- Es fehlt **Ruhe**: eine dominante Aktion pro Screen, weniger parallele Module.
- Erste Viewport mancher Seiten liest sich wie Dashboard mit vielen Karten – nicht wie „Dein nächster Auftrag“.

---

## 4. Wie gute UX hier aussehen sollte

### 4.1 Leitprinzipien
1. **Rollenfilter zuerst** – UI zeigt nur, was diese Person darf und braucht.
2. **Ein Primärjob pro Screen** – z. B. „Auftrag erledigen“, nicht „System verstehen“.
3. **Arbeit vor Architektur** – Flows/Agenten sind Backend der Orchestrierung; Nutzer spüren sie als Vorschläge und Fortschritt, nicht als Generator-Tour.
4. **Progressive Disclosure** – Details (Historik, Org, voller Flow) erst aufklappen / zweite Ebene.
5. **Wenige, starke Einstiege** – max. 4–5 Nav-Punkte für Mitarbeiter.
6. **Sofortige Klarheit** – in 3 Sekunden: Was ist fällig? Was blockiert? Was schlägt der Agent vor?
7. **Angenehm arbeiten** = wenig Suchen, klare nächste Aktion, kurze Wege, sichtbarer Fortschritt, keine Angst vor falschem Klick.

### 4.2 Ziel-Navigation (Vorschlag)

**Mitarbeiter**
1. Mein Tag  
2. Aufträge  
3. LOPs (nur meine / Abteilung)  
4. Kalender (optional)  
5. Profil / Hilfe  

*Kein* Plattform, Flows, Agenten, Org in der Hauptnav.

**Abteilungsleitung**
1. Team-Warteschlange  
2. Zuweisen  
3. Kapazität  
4. LOPs Abteilung  
5. Programme (nur relevante)

**Engineering / PL**
1. Programme  
2. Freigaben  
3. LOPs  
4. Aufträge (übergreifend)

**Management**
1. Ampel-Übersicht  
2. Engpässe  
3. Standorte  

**Prozess-Owner / Demo**
1. Plattform  
2. Flows  
3. Agenten  

→ Präsentation und Alltag **trennen** (eigener Modus oder eigene Rolle).

### 4.3 Idealbild „Mein Tag“ (Mitarbeiter)
- Oben: Begrüßung + **eine** Hauptzahl („3 offen, 1 kritisch“)
- Liste: Nächste Aufträge – Titel, TN, Fälligkeit, **eine** Aktion „Öffnen“
- Agent nur als dezenter Hinweis: „Zuweisung empfohlen: …“ oder „Material: prüfen“
- Keine Flow-Canvas, keine Org-Karte, keine Plattform-Stats

### 4.4 Idealbild Auftragsdetail
**Oben (immer):** Was ist der Job? Status? Nächste Aktion (Erledigen / Zuweisen).  
**Mitte:** Checkliste (wenn Pflicht).  
**Unten / Accordion:** Flow-Pfad, Historik, Dateien, Agent-Begründung.  

Nicht alles gleichzeitig als gleichwertige Panels.

### 4.5 Wie Agenten & Flows „sich anfühlen“ sollen
- Nutzer sagt nicht: „Ich gehe zu den Agenten.“
- Nutzer sieht: „Vorschlag annehmen“ / „Nächster Schritt: CAD“ / „Lager warnt“.
- Flow-Editor nur für die, die Prozesse **bauen** – alle anderen sehen nur den Fortschrittsstreifen.

---

## 5. Was Firmen wie Apple gut machen – und warum sie beliebt sind

Nicht weil sie „schön“ sind, sondern weil die Produkte sich **einfach, verlässlich und menschlich** anfühlen. Das gilt für Consumer-Produkte – und lässt sich auf B2B-Werkzeuge wie SeatHub übertragen.

### 5.1 Die Kernrezepte (Apple & Co.)

| Prinzip | Was sie tun | Warum Menschen das lieben |
|---------|-------------|---------------------------|
| **Weniger, dafür klar** | Wenige Einstiege, eine dominante Aktion, kein Feature-Zoo auf dem Home-Screen | Das Gehirn muss nicht sortieren – man fühlt sich sofort handlungsfähig |
| **Komplexität verstecken** | Technik (Sync, KI, Hardware) arbeitet im Hintergrund; UI zeigt nur das Ergebnis | Nutzer fühlen sich kompetent, nicht wie Admin eines Systems |
| **Fokus auf den Job** | „Foto machen“, „Nachricht senden“ – nicht „Kamerasubsystem konfigurieren“ | Man erledigt Absicht, statt Software zu bedienen |
| **Konsistenz** | Gleiche Gesten, gleiche Hierarchie, gleiche Sprache überall | Lernen einmal – gilt überall; Vertrauen entsteht |
| **Progressive Disclosure** | Einstellungen und Power-Features sind da, aber nicht im Weg | Einsteiger und Profis teilen dasselbe Produkt, ohne sich zu stören |
| **Emotionale Ruhe** | Weißraum, Typo, eine klare Hierarchie, wenig visuelle Konkurrenz | Weniger Stress, längere Sessions, „das fühlt sich gut an“ |
| **Sofortiger Nutzen** | Erstes Öffnen liefert schon Wert – ohne Handbuch | Begeisterung statt Schulungsfrust |
| **Respekt vor Zeit** | Kurze Wege, wenige Klicks, keine unnötigen Dialoge | Das Produkt wirkt wie ein Assistent, nicht wie Bürokratie |
| **Vertrauen & Kontrolle** | Klare Defaults, Rückgängig, keine Angst vor Fehlern | Man experimentiert gerne – und bleibt |
| **Identität** | Produkt hat eine erkennbare Haltung („einfach“, „präzise“) | Man *will* dazugehören und es weiterempfehlen |

Ähnlich beliebt (aus verwandten Gründen): **Notion** (leere Seite + klarer Start), **Linear** (Geschwindigkeit + Fokus für den eigenen Job), **Stripe** (komplexe Zahlungen, aber der Entwickler sieht nur seinen Flow), **Slack** (Kanäle = mein Bereich, nicht die ganze Firma auf einmal).

Gemeinsamer Nenner: **Die Macht steckt im System – die Oberfläche gehört dem Menschen und seinem einen Job.**

### 5.2 Warum „beliebt“ mehr ist als „hübsche UI“

1. **Kompetenzgefühl** – Man fühlt sich klug, nicht überfordert.  
2. **Geringe Reibung** – Jeder unnötige Klick kostet Zuneigung.  
3. **Vorherseharkeit** – Gleicher Ort, gleiche Bedeutung, jedes Mal.  
4. **Stolz auf das Werkzeug** – Man zeigt es gerne (intern wie extern).  
5. **Alltagstauglichkeit** – Es hält Stress stand: morgens um 7, unter Zeitdruck, mit unterbrochenem Fokus.

Beliebtheit entsteht, wenn das Produkt die Frage beantwortet: *„Hilft mir das, ohne dass ich dafür leiden muss?“* – mit einem klaren Ja.

### 5.3 Was Apple bewusst *nicht* macht (Lernpunkte)

- Nicht jedes Feature gleich sichtbar machen („Feature-Parität auf dem Home-Screen“).
- Nicht alle Nutzerrollen denselben Maschinenraum zeigen.
- Nicht mit Fachjargon der internen Architektur sprechen (kein „Node-Orchestrator“ für Endnutzer).
- Nicht Komplexität als Kompetenz verkaufen – Kompetenz ist, wenn es **einfach wirkt**.

### 5.4 Übertragung auf SeatHub

| Apple-Logik | SeatHub-Übersetzung |
|-------------|---------------------|
| Home = wenige Apps, die ich brauche | Nav = nur Mein Tag / Aufträge / LOPs (je Rolle) |
| iPhone versteckt Funkprotokolle | Flows & Agenten orchestrieren hinten; vorne nur Vorschlag + Fortschritt |
| Eine große Aktion (z. B. „Aufnehmen“) | Pro Screen ein Primärbutton: Öffnen / Zuweisen / Erledigen |
| Einstellungen tief, aber erreichbar | Org, Flow-Editor, Agenten-Übersicht für Owner – nicht für Näher |
| „It just works“ | Auftrag starten → Checkliste → fertig → nächster Schritt, ohne Systemtour |
| Produkt hat Haltung | SeatHub = ruhiger Arbeitsplatz, nicht Enterprise-Cockpit für alle |

**Faustregel für uns:** Wenn ein Mitarbeiter die Software öffnet und in 10 Sekunden weiß, was als Nächstes dran ist – ohne Plattform, ohne Generator, ohne Org-Baum – sind wir auf dem Apple-Pfad. Wenn er erst „das System verstehen“ muss, sind wir auf dem Enterprise-Pfad, den niemand gerne öffnet.

### 5.5 Liebe zum Produkt im B2B

Auch in der Industrie gilt: Wer morgens gerne eincheckt, macht weniger Fehler, braucht weniger Schulung und verteidigt das Tool im Unternehmen.  
SeatHub wird nicht beliebt, weil es die meisten Module hat – sondern weil **jede Rolle ihr kleines, klares iPhone** bekommt, während die Plattform im Hintergrund wie das Apple-Ökosystem zusammenhält.

---

## 6. Was „gerne darin arbeiten“ konkret bedeutet

Menschen bleiben in Tools, wenn:
- der Einstieg **persönlich** ist („Deine 3 Dinge heute“),
- Entscheidungen **einfach** sind (1 Primärbutton),
- Erfolg **fühlbar** ist (Checkliste, Fortschritt, „Flow-Schritt erledigt“),
- Ablenkung fehlt (keine fremden Welten in der Nav),
- Sprache **ihre** Sprache ist (Nähen, Stand, Freigabe – nicht „Nodes“, „Insights“, „Plattform“ im Alltag),
- das Produkt sich anfühlt wie bei Apple & Co.: **ruhig, fokussiert, kompetent machend**.

SeatHub soll sich anfühlen wie ein **guter Meisterbriefing-Tisch**: klar, ruhig, auf mich zugeschnitten – und im Hintergrund orchestrieren Agenten und Flows, ohne dass ich den Maschinenraum betreten muss.

---

## 7. Empfohlene UX-Roadmap (nach Priorität)

| Prio | Maßnahme | Wirkung |
|------|----------|---------|
| P0 | Nav + Home **streng rollenbasiert** kürzen | Sofort weniger Überforderung |
| P0 | „Mein Tag“ als Default nach Login | Arbeit zuerst |
| P1 | Auftragsdetail entschlacken (Progressive Disclosure) | Schnelleres Erledigen |
| P1 | Plattform/Flows/Agenten nur Prozess-Owner / Demo-Rolle | Klare Trennung Alltag vs. Vision |
| P2 | Einheitliches „Nächste Aktion“-Muster auf Listen | Weniger Klickpfade |
| P2 | Visuelle Ruhe: weniger Pills, eine Fokus-Zone | Angenehmeres Arbeiten |
| P3 | Onboarding je Rolle (1 Satz + 1 CTA) | Weniger Erklärbedarf |

---

## 8. Abgrenzung

Dieses Dokument bewertet **UX und Informationsarchitektur**, nicht fehlende Features.  
Features (Flow-Editor, Agenten) bleiben wertvoll – aber sie gehören in die **richtige Schicht und Rolle**, sonst wirkt das Produkt kompliziert, obwohl die Idee stimmt.

Apple baut auch enorme Komplexität – sie **verkaufen sie nur nicht als Oberfläche**.

---

## 9. Nächster Schritt (wenn gewünscht)

UX umsetzen: Nav/Home nach Rollen schneiden, „Mein Tag“ zum Zentrum machen, Plattform-Welt in Demo-/Owner-Modus legen, Auftragsdetail beruhigen – mit dem Anspruch: **einfach wirken, mächtig bleiben**.

---

## 10. Adoptierte Zielstruktur (Kollege + Bewertung)

Umgesetzt als Leitbild im Prototyp:

```
SEATHUB
├── ARBEITSPLATZ          (Mitarbeiter sieht das)
│   ├── Mein Tag          ← Home nach Login
│   ├── Aufträge          ← Warteschlange, nicht Datenbank
│   ├── LOPs
│   └── Kalender
│
└── STUDIO                (Prozess-Owner / Manager / Engineering)
    ├── Studio-Hub
    ├── Flows
    ├── Agenten
    ├── Projekte
    └── Organisation
```

**Kernideen des Kollegen, die wir übernehmen:**
1. Zwei Welten: Arbeitsplatz vs. Studio  
2. Mitarbeiter-Nav max. 4 Punkte  
3. Mein Tag = „Was muss ich jetzt machen?“  
4. Aufträge = Warteschlange mit nächstem Schritt  
5. Auftragsdetail: Nächster Schritt oben, Details zugeklappt  
6. Flow als einfacher Fortschrittspfad für Mitarbeiter, Editor nur im Studio  
7. Agenten als „SeatHub empfiehlt“, nicht als Agenten-Galerie im Alltag  
8. Positionierung: **Digitaler Arbeitsplatz für die Produktion**

Siehe Implementierung: Sidebar-Nav, `/studio`, schlankes Mein Tag / Auftragsdetail.

**Master-Prompt (verbindlich):** `SEATHUB-UX-MASTER.md`  
**Cursor-Rule:** `.cursor/rules/seathub-ux.mdc` (alwaysApply)
