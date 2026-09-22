# SEATHUB – MASTER PROMPT FÜR UX, UI & PRODUKTENTWICKLUNG

> Verbindliche Produkt-DNA. Kurzfassung für Agenten: `.cursor/rules/seathub-ux.mdc`

## 1. Aufgabe

SeatHub ist keine klassische Enterprise-Software mit maximal sichtbaren Funktionen.

SeatHub soll sich wie ein **persönlicher digitaler Arbeitsplatz** anfühlen.

Technische Komplexität darf im Hintergrund hoch sein. Die Oberfläche muss extrem einfach, ruhig, verständlich und fokussiert sein.

> **Die Macht steckt im System. Die Oberfläche gehört dem Menschen.**

Jeder Nutzer sieht nur den Teil, den er für seine Arbeit braucht.

---

## 2. Psychologisches Ziel

Bei jeder UI-Entscheidung:

> **Was muss der Nutzer wissen, um seine nächste Aufgabe sicher und schnell zu erledigen?**

Nicht: Welche Daten können wir zeigen? Welche Features haben wir?

Innerhalb weniger Sekunden klar:

1. Wo bin ich?
2. Was muss ich tun?
3. Was ist als Nächstes?
4. Was ist erledigt?
5. Gibt es ein Problem?
6. Welche **eine** Aktion jetzt?

Sonst: zu komplex.

---

## 3. Apple-Prinzip

Komplexität existiert – sie wird **versteckt, bis sie benötigt wird**. Nutzer sehen Handlungen (Foto, Nachricht), nicht Architektur.

---

## 4. Kein Enterprise-Cockpit

Nicht gleichzeitig: Plattform, Flows, Agenten, Projekte, Org, Abteilung, Kalender, Aufträge, LOPs, Stats, viele Karten/Pills/Buttons.

> **Arbeit zuerst. System dahinter.**

---

## 5. Pro Screen eine Hauptaufgabe

| Screen | Frage |
|--------|--------|
| Mein Tag | Was muss ich heute machen? |
| Auftragsdetail | Was muss ich jetzt tun? |
| Zuweisung | Wem gebe ich das? |
| Prozess (Mitarbeiter) | Wie weit bin ich? |
| Flow-Editor | Wie konfiguriere ich den Prozess? |
| Management | Wo gibt es Probleme? |

---

## 6. Progressive Disclosure

Nicht weniger Funktionalität – weniger **gleichzeitig sichtbare**.

- **Ebene 1:** Sofort (Auftrag, Status, nächster Schritt, Primärbutton)
- **Ebene 2:** Fortschritt / Checkliste
- **Ebene 3:** Prozess, Historie, Dateien, Agenten, Technik (zugeklappt)

---

## 7. Eine Entscheidung zur Zeit

Ein Primärbutton. Sekundär/tertiär abgestuft. Nicht sechs gleichwertige CTAs.

---

## 8. Kompetenz vermitteln

„Ich habe alles unter Kontrolle“ – klare Sprache, vorhersehbare Nav, sichtbarer Fortschritt, wenig Angst vor Fehlern.

„SeatHub hilft mir“ – nicht „Ich bediene komplexe Software“.

---

## 9. Mein Tag

Persönlicher Arbeitsplatz, kein Dashboard-Zoo.

Begrüßung → Anzahl offen/kritisch → Aufgabenkarten mit nächstem Schritt + Öffnen → „SeatHub empfiehlt“.

---

## 10. Agenten

```text
SeatHub empfiehlt
… kann an CAD weitergegeben werden.
[ Übernehmen ]
```

Keine Confidence-/Node-/Agent-ID-Sprache im Alltag.

---

## 11. Flows

Mitarbeiter: Fortschrittspfad. Prozess-Owner: Flow-Editor im Studio.

---

## 12–13. Navigation & Rollen

**Mitarbeiter:** Mein Tag, Aufträge, LOPs, Kalender  
**Teamleitung:** Team, Warteschlange, Zuweisung, Kapazität, LOPs  
**Engineering:** Programme, Freigaben, Aufträge, LOPs  
**Management:** Übersicht, Engpässe, Standorte  
**Prozess-Owner / Studio:** Prozesse, Flows, Agenten, Automationen, Organisation  

---

## 14–16. Visuelle Ruhe, Farben, Buttons

Weißraum, Typo-Hierarchie, eine dominante Aktion. Farben funktional (Erfolg/Warnung/Kritisch/KI dezent). Primär / sekundär / tertiär.

---

## 17–19. Auftragsdetail, LOPs, Projekte

Auftragsdetail: nächster Schritt oben, Fortschritt, Details zugeklappt.  
LOPs rollenbasiert (meine Liste vs. Team-Überblick).  
Projekte: Mitarbeiter über Auftrag; PL über Programme-Nav.

---

## 20. Studio

Hier darf Komplexität sichtbar sein – nie in die Mitarbeiterwelt laufen.

---

## 21. Entwickler-Fragen (vor jeder Komponente)

1. Braucht die Rolle das?  
2. Braucht sie es jetzt?  
3. Entscheidung nötig?  
4. Hierarchie der Aktionen?  
5. Einfachere Darstellung möglich?

---

## 22. 10-Sekunden-Prinzip

Login → Mein Tag → nächste Aufgabe.

---

## 23–26. Nicht / Einfach / Modell / Apple-Gefühl

Nicht Features stapeln. Einfach = wenig mentale Arbeit. Kette: Wahrnehmen → Verstehen → Entscheiden → Handeln → Erfolg. Gefühl: „Das war einfach.“

---

## 27. Definition of Done (UX)

Richtige Rolle · falsche nicht · Primäraktion · Rest verborgen · Nutzersprache · nächster Schritt klar · Zustand klar · Fortschritt · nicht überladen.

---

## 28. Goldene Regel

> **Hide complexity. Not capability.**  
> Verstecke die Komplexität – nicht die Möglichkeiten.

SeatHub soll sich **kleiner anfühlen, als es technisch ist**.

---

## 29. Priorität

**P0:** Rollen-Nav, Mein Tag Home, Primäraktion, Auftragsdetail, Flows/Agenten aus Mitarbeiter-Nav, Empfehlungen statt Technik-Module  
**P1:** Progressive Disclosure, NextAction-Pattern, visuelle Ruhe, Status, Checklisten  
**P2:** Onboarding, Personalisierung, feinere Agenten-Erklärungen

---

## 30. Auftrag

Informationsarchitektur und Interaktionslogik überarbeiten – Funktionalität bewahren, Komplexität rollen- und ebenengerecht verschieben.

> **Ein Nutzer. Eine Rolle. Eine Aufgabe. Eine nächste Aktion.**
