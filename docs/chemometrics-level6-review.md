# Level 6 — redaktionelle Reviews

## Zweite Nutzerrevision — 2026-11-08, 22 Punkte

Aktuell: 52 Folien, 16 Formeleinheiten, zehn unabhängige Scriptkapitel,
sieben Charts und 52 englische Sprecherabschnitte. Die folgenden Rollenprüfungen
sind Perspektiven desselben Authoring-Reviews, keine unabhängigen Gutachten oder
Tests mit realen Studierenden. Menschliche Abnahme und PDF-/Buildprüfung bleiben offen.

### Dispositionen

| Punkt | Umsetzung / fachliche Grenze |
|---|---|
| 1 | Konkretes Populationsparameter-Beispiel, fette Schlüsselbegriffe, „Starting point“; redundante Caption/Schlusssätze entfernt. |
| 2 | Titel grammatisch „Tests never prove“; ein Baum mit Positiv = H₀ ablehnen, Negativ = nicht ablehnen; TP/FP/FN/TN samt Thumbnails. Hypothesen verwenden μ statt beobachtetem x. |
| 3 | ≥, ≤ und = als drei Anwendungen; Gleichheits-Nichtablehnung beweist keine exakte Gleichheit. |
| 4 | Zwei Comicpanels mit GO-Raten bei 10.3/9.7 cm und hervorgehobener Quintessenz. Raten betreffen Entscheidungen, keine Einbruchswahrscheinlichkeiten. Progressive Regeln brauchen einen expliziten akzeptablen Fehlerkosten-Kompromiss. |
| 5 | „α controls type I errors“; H₀ und spezifiziertes H₁ bleiben fest, α bewegt die Grenze. Zwei Fehlerflächen; numerische Dichte-/Flächentests. |
| 6 | ν im Titel; pro unabhängig gefittetem Koeffizienten ein residualer Freiheitsgrad weniger in den gezeigten vollrangigen Modellen. |
| 7 | Wiederholte p-Caption entfernt. |
| 8 | Gewünschte NIST-t-Tabelle als neuer-Tab-Fußnote. |
| 9 | Zweite Pooling-Lesehilfe entfernt; erste als hervorgehobene Bullets; Gewichte als Freiheitsgrade bezeichnet. |
| 10 | CI-/Konfidenzintervall-Lehre aus aktiven Folien und Script entfernt; Sprechertext entsprechend. |
| 11 | p-hacking-Folie aus aktivem Pfad entfernt. |
| 12 | Wasserprobe → sechs Präparationen → drei Analyten als großes Schema. |
| 13 | F-Fragenübersicht aus aktivem Pfad entfernt. |
| 14 | Aktive sichtbare Texte, Reports, Legenden und SVGs ohne df-Abkürzung; ν/ν₁/ν₂. Interne Variablennamen und frühere unselektierte Entwürfe bleiben erhalten. |
| 15 | F-Tabelle entfernt; Varianzvergleich über F und p. |
| 16 | Erklärung unter der Formel; gleicher-Slide-Overlay mit Versuchsgefäßen, Zeilen-/Spaltenzuordnung und Erwartungswertbeispiel; Enter/Escape/Fokusrückgabe, mobil scrollbar, Druck vollständig. |
| 17 | Generisches `pairwise-score`: authored Daten/Quellen/Schrittparameter, Next/Previous/Reset, Treffbewegung, Punkte und Konto, reduzierte Bewegung, vollständiges Ledger. |
| 18 | Zusätzliche U-Referenzfolie: 20 gleich wahrscheinliche Gruppenzuordnungen, sechs mindestens so extreme, p = 0.300; Bindungen behalten Identität. |
| 19 | „Difference“ und „rank of abs(diff)“; fünf binäre Vorzeichen erzeugen 32 Muster; zwei Ränder mit je drei Mustern, p = 0.1875. |
| 20 | Ergebnis −1.677 als Richtung und 1.68 gepoolte SDs; vier konventionelle Referenzbänder statt erneuter Rechnung. |
| 21 | Mehrfachausreißerfolie: Generalized ESD mit vorab gewähltem r, eigener sequenzieller Kalibrierung, Maskierung und NIST-n-Grenzen. Keine pauschale Empfehlung für wiederholtes Grubbs plus Bonferroni. |
| 22 | Zwölf NIST-Ziele recherchiert; 29 standardisierte Fußnoten an passenden Folien. Rank-sum-Seite als Hintergrund mit ausdrücklichem Hinweis auf unterschiedliche Statistik-/Tie-Konventionen. |

### Schleife A — Dozentensicht

Geprüft: Hypothese versus Statistik, Positiv-/Negativdefinition, Grenzen von
Nichtablehnung, See-Entscheidungsraten, feste H₁-Verteilung, residuale Freiheitsgrade,
richtige Testfamilie, exakte Permutationszählungen und Generalized-ESD-Anwendung.
Korrekturen: „Retain the starting claim“ im Baum durch „Evidence is insufficient“
ersetzt; eine Nichtablehnung soll nicht wie bewiesene Annahme erscheinen.
NIST-Rangseiten dienen als Hintergrund, nicht als Beleg für unsere Tie-Konvention.

### Schleife B — Studierendensicht

Geprüft: sichtbare Frage, konkretes Experiment, unabhängige Einheiten, Herkunft
von U/p/32 Mustern und Interpretation von d. Korrekturen: Comic vergrößert;
Hypothesenfluss zweizeilig statt randberührender Beschriftungen; Erklärung unter
die Formel gesetzt; Gefäße und Klassifikationsfluss zur Tabelle ergänzt;
im Paarvergleich bleibt die gerade abgeschlossene Gegenüberstellung sichtbar.
Unnötige Negationen vereinfacht; notwendige Aussagen wie „do not reject“ bleiben.

### Schleife C — Sprecherprobe und Script

Alle 52 Abschnitte folgen der neuen Reihenfolge und sprechen Übergänge aus.
Das Script bleibt in zehn Themenkapiteln unabhängig von der Folienreihenfolge.
Entfernte Materialien wurden aus seinen Verweisen entfernt, neue Abbildungen,
Paarvergleich, Referenztabelle und NIST-Links thematisch eingeordnet. Formeln
haben auch dort vollständige Legenden. Automatischer Abgleich prüft Titel,
Szenenidentität, Übergänge, Materialabdeckung und stabile thematische Reihenfolge.

### Lokale Prüfungen / Grenze

22 fokussierte Python-Tests einschließlich positiver/negativer additiver SHACL-
Prüfungen; 94 fokussierte TypeScript-Tests; `npm run typecheck`; erfolgreiche
Preview-Generierung. Browserprüfungen umfassen beide Themes, α-/QC-Regler,
Tastatur, reduzierten/normalen Bewegungsmodus, Reset während laufender Bewegung,
Erklärungs-Overlay, Druck-Sichtbarkeit und mobiles Script. Einzelbildbefunde und
abschließende Browserergebnisse sind im visuellen Review getrennt dokumentiert.
Kein `npm test`, Build, Publizieren, Commit oder Push; vorhandene PDFs sind veraltet.

## Historisch — Review der 41-Punkte-Revision

**Nachtrag zur Bildabnahme:** Der frühere Kontaktbogenreview genügte nicht
für die behauptete vollständige Größen-/Lesbarkeitsprüfung. Der auf erneuten
Nutzerauftrag durchgeführte vollständige Einzelbildreview mit Befund und
Disposition jeder Folie steht in `chemometrics-level6-visual-review.md`.
Sein Nachweisordner `level6-fullsize-final/` ersetzt die früheren Bildnachweise.

Stand: 2026-11-07. **Zur menschlichen Folienabnahme bereit, nicht veröffentlicht.**
52 Folien, 16 Formeleinheiten, unabhängiges Script mit zehn Kapiteln und sechs
Charts; englischer Sprechertext in `chemometrics-level6-speaker-notes.md`.

Die Dozenten- und Studierendenperspektiven sind redaktionelle Prüfrollen dieses
Authoring-Reviews, keine unabhängigen Gutachten und keine Untersuchung mit
realen Studierenden. Es wird keine pädagogische Wirksamkeit behauptet.

## Prüfmethode und Abbruchkriterium

Jeder Themenblock wird auf fachliche Aussage, Daten-/Versuchsidentität,
erklärbare Rechenschritte, Folienreihenfolge und zulässige Schlussfolgerungen
geprüft. Die Studierendenperspektive fragt: Was ist die Frage? Woher kommt die
Zahl? Was soll ich oben/unten bzw. links/rechts lesen? Welche Begriffe werden
vorausgesetzt? Der Sprechertext muss Übergänge aussprechen, darf aber keine
fehlende zentrale Voraussetzung oder widersprüchliche Folie verdecken.

Auf Befund folgt Korrektur in der jeweiligen TriG-Quelle bzw. im gemeinsamen
Renderer, dann erneute betroffene Inhalts-/Bildprüfung. Beendet wird die Schleife,
wenn keine bekannte blockierende Logik- oder Darstellungsabweichung im geprüften
lokalen Umfang bleibt. Das ersetzt weder die Nutzerabnahme noch PDF-/Buildprüfung.

## Schleife 1 — Struktur und wissenschaftliche Aussage

### Dozentensicht

- **Hypothese versus Statistik:** Die ursprüngliche Kritik hätte zu H₀ über
  den beobachteten Testwert führen können. Korrektur: H₀/H₁ beschreiben
  Population/Verteilung; die berechnete Statistik prüft die Behauptung. Die
  allgemeine Einführung zeigt keine vorgezogene μ-Grenzwertformel mehr.
- **See:** Hypothesen und praktische Aktion wurden gemeinsam geprüft. Unter A
  ist falsches GO unterhalb des Minimums Typ I, unter B Typ II. Die Rechnung
  vergleicht wiederholte Studien bei gleichem wahren Zustand, nicht reale
  Einbruchswahrscheinlichkeiten. Modell: vier unabhängige Normalwerte, bekannte
  SD 0.5 cm, SE 0.25 cm, einseitiges alpha 5%, Quantil 1.645. GO-Grenzen
  10.411/9.589 cm, Wahrscheinlichkeiten 0.22/67.18% bei wahr 9.7 und
  32.82/99.78% bei wahr 10.3 cm. Kurzer Modellhinweis bleibt im Bild erhalten.
- **Recovery:** „Mindestens 80%“ wird durch den konservativen Nachweis eines
  Populationsmittels strikt oberhalb 80% bearbeitet. Kein Versprechen über jeden
  Einzelwert. Rohwerte, einseitiges p und einseitige untere Konfidenzgrenze
  stimmen zusammen.
- **Paarung:** Oxidationsbatch vor/Ende liefert eine Differenz. Sechs unabhängige
  Batches sind sechs Einheiten. Beim Wilcoxon zuerst ursprüngliche Differenzen,
  danach absolute Beträge rangieren; getrenntes Sortieren wäre fachlich falsch.
- **Welch:** NIR/HPLC-MS verwenden unabhängige Präparationsgruppen aus homogenem
  Referenzmaterial. Dieselben Proben auf beiden Geräten wären gepaart. Die
  größere Streuung legitimiert keine nachträgliche Auswahl nach einem Varianz-p.
- **Multiplizität:** Drei einzelne Untergrenzen-Claims sind vom konjunktiven
  „alle bestehen“-Claim getrennt. 14.2625% gilt bei unabhängigen Tests mit allen
  Nullhypothesen an ihrer 5%-Grenze; Bonferroni benötigt keine Unabhängigkeit.
- **F:** Varianzverhältnis und Modellvergleich sind getrennte Konstruktionen.
  Statistik und Richtung stehen vor der F-Tabelle; die Tabelle verwendet jetzt
  denselben df-Fall (5,5) wie das Präzisionsbeispiel. p 0.07719 entspricht
  Nicht-Ablehnung bei F 4 < 5.050. Gleichheit dient als obere Nullgrenze für die
  gerichtete Frage. Kalibrationsbilder erfinden keine numerischen Rohstandards.
- **Chi-Quadrat:** Bekannte Varianz ist ein exakter Normalmodellvergleich;
  Partikelmix und Unabhängigkeit sind approximative Pearson-Referenzen.
  Erwartete Zellen allein waren als Statistikfolie unvollständig: der
  Unabhängigkeitsaufbau enthält nun auch die vollständige Pearson-Summe.
- **Ränge:** U=1 wird nicht allein gelassen. Explizite tie-aware
  Labelpermutation ergibt zweiseitig 6/20=0.300; Vorzeichenränge 6/32=0.1875.
  Keine unpassende exakte No-Tie-Tabelle und kein automatischer Median-Test.
- **Effekte/Grubbs:** d und Delta erhalten deklarierte Größenkonventionen,
  keine chemischen Akzeptanzgrenzen. Gepoolte deskriptive SD rechtfertigt
  keinen gepoolten t-Test. Grubbs vergleicht G=2.0219 mit 1.8871; Flaggen ist
  keine Feststellung der Fehlerursache und keine Löschberechtigung.

### Studierendenperspektive

Die wiederkehrende Frage → Aufbau/Formel → Diagramm/Report-Struktur macht
sichtbar, welche Werte in den Test eingehen. Zwei vertikale Bäume statt einer
Richtungstabelle, eine separate Vier-Ausgangs-Erklärung vor dem See und
illustrierte t-/F-Trennfolien reduzieren unvermittelte Themenwechsel. Nu wird
benannt, bevor es in den Testformeln verwendet wird. Die Versuchszeichnungen
unterscheiden unabhängige Flussstellen, einen Batch mit zwei Proben und zwei
unabhängige Messsystemgruppen. Kurze Bild-Bullets ersetzen die langen Captions.

Korrektur gegen reine Zahlentabellen: Jede Ergebnisfolie nennt Richtung,
Statistik/df/p, verwendete Einheiten und eine begrenzte Schlussfolgerung.
Mehrfachtests beginnen mit drei konkreten Analyten und einer Frage, nicht mit
der Korrekturformel. Beim Rangraster folgt eine Referenz und Interpretation;
die Größenkonventionen werden ausdrücklich nicht mit Signifikanz gleichgesetzt.

### Sprechertextreview

Alle 52 Titel/Szenen sind gegen den aktiven Pfad abgeglichen. Jeder Abschnitt
hat einen Übergang bzw. einen Abschluss. Der Text erklärt das Ablesen und
Regleraktionen, statt nur die Folie zu wiederholen. Kritische Übergänge:
Population → Statistik; zwei Fehlertypen → praktische See-Aktion; SD → SE;
Design → Testversion; einzelne Claims → Test-Familie; zwei Varianzen → zwei
Modelle derselben Standards; numerische Streuung → kategoriale Zählungen;
U-Befund → deskriptive Effektgröße; ungewöhnlicher Wert → begrenzte Testaussage.
Das Script bleibt eigenständig thematisch und ist kein zweites Folienmanuskript.

## Schleifen 2–4 — Bildreview und Nacharbeit

1. **r1:** Struktur kompiliert; Browserprüfung musste verschachtelte
   Definitionslisten korrekt adressieren. Die innere Liste ist gewollte
   strukturierte Symbolerklärung, kein Fließtext.
2. **r2:** Diagrammcontainer waren trotz Zweispalter noch 1120 px breit;
   Formel/Versuchs- und Diagramm/Report-Surfaces überlappten. Containerbreiten
   wurden strukturell auf ihre Spalten begrenzt, nicht per Szenen-ID.
   Lange Nested-F-/Grubbs-Formeln wurden umgebrochen.
3. **r3:** Verbleibende Überläufe bei Chi-Übersicht und Grubbs-Einstieg;
   Karten und Bildunterschriften gekürzt, Guide-Schrift und Abstände korrigiert.
4. **r4/r5:** Beide Themes ohne erfassten normalen Regions-/Formelüberlauf.
   Neue Pearson-Summe und See-Quantil ergänzt; Rechen-/Manuskriptprüfung erneut
   bestanden. Kontaktbögen und ausgewählte volle Bilder wurden betrachtet.

## Schleife 5 — offene Legenden statt nur geschlossener Geometrie

Eine stärkere Prüfung öffnet alle Legenden einer Folie gleichzeitig und macht
zusätzliche Screenshots. Sie fand trotz vorheriger Einzelkontrollen abgeschnittene
Erklärungen bei Pearson und in der Grubbs-/Rangdarstellung. Korrektur:

- Formel/Versuchsfolien und einzelne Formel-Decks öffnen eine breite Lesefläche
  unten auf **derselben Folie**. Sie überdeckt vorübergehend die Lesehilfe,
  nicht die Formel; das Symbols-Control bleibt zum Schließen erreichbar.
- Vergleichsfolien behalten getrennte Legenden je Formel. Beide Grubbs-Legenden
  sind gleichzeitig vollständig sichtbar; keine interne Scrollkürzung.
- Prüfung erfasst jetzt auch inneren Höhenüberlauf der geöffneten Legende.
  Vollbilder der geöffneten Pearson- und Grubbs-Erklärungen wurden nachgesehen.

Erneute fachliche/Sprecherprüfung: keine Änderung der Hypothesen, Zahlen oder
Übergänge durch diese Darstellungskorrekturen. Keine bekannte blockierende Lücke
im lokalen Reviewumfang; Lesbarkeit im tatsächlichen Hörsaal bleibt Nutzerurteil.

## Disposition aller 41 Punkte

Foliennummern beziehen sich auf die **neue** 52-Folien-Fassung.

| Punkt | Ergebnis / Fundstelle |
|---|---|
| 1 | Zwei vertikale Entscheidungsbäume nebeneinander, unverbundene Fehlerboxen; Folie 4. |
| 2 | Gedankenstrich und lange Sicherheitscaption entfernt; nur kurzer Modellhinweis im Bild; Folie 6. |
| 3 | Numerischer GO-Vergleich bei wahr 9.7/10.3 versus 10 cm; Folie 7; keine behauptete Einbruchswahrscheinlichkeit. |
| 4 | Vier Testausgänge vor See; Folie 5. |
| 5 | Alpha-Experiment: nur Typ I/II, eine Referenzkurve, Bullets, funktionierende Steuerung; Folie 8. |
| 6 | ν (nu) eingeführt; Folie 9. |
| 7 | Illustrierte t-/F-Trennfolien; 11 und 27. |
| 8 | Populationsbehauptung und beobachtete Statistik klar getrennt; Folie 3. |
| 9 | QC-Reglerbeschreibung als Bullets; Folie 14. |
| 10 | Recovery-Mindestmittel 80%, Diagramm plus einseitiger One-Sample-Report; Folie 15. |
| 11 | Alle 16 aktiven Formellegenden als Definitionslisten, vollständige gleiche-Folie-Erklärung. |
| 12 | Gepoolte df-gewichtete Varianz unterklammert, Begründung/Beispiele, Flussbild, Welch-Vorschau; Folie 17. |
| 13 | Paarung durch Oxidationsbatch vor/Ende, Formel und Reaktorzeichnung; Folie 18. |
| 14 | Batch-Differenzen und gepaarter Report; Folie 19. |
| 15 | Welch mit unabhängigen NIR/HPLC-MS-Präparationen und Zeichnung; Folie 20. |
| 16 | Welch-Diagramm und Report; Folie 21. |
| 17 | Hypothese → Experiment → Test → Schlussfolgerung; explizit kein p-hacking; Folie 22. |
| 18 | Chlorid/Bromat/Phosphat: Frage, Rechnung, Bonferroni; Folien 23–25. |
| 19 | Passende Below-Limit-Claims mit adjustierten p-Werten; Folie 26. |
| 20 | F-Übergang nennt Varianz- und Kalibrationsfragen konkret, Bezug Level 5; Folien 27–28. |
| 21 | F-Hypothese/Statistik vor der df-konsistenten Tabelle; Folien 29–30. |
| 22 | Präzisionsvergleich: Formel und Versuchsschema; Folie 29. |
| 23 | Präzisionsvergleich: Diagramm und p-Report; Folie 31. |
| 24 | Separate Kalibrationsabbildung konstantes Modell versus Steigung; Folie 32. |
| 25 | Nested-F-Formel und Aufbau, danach Report; Folien 33–34. |
| 26 | ANOVA nicht im aktiven Vortrag oder thematischen Ausbau. |
| 27 | Bekannte Varianz: Formel/Aufbau; Folie 36. |
| 28 | Bekannte Varianz: Diagramm und Report statt Ergebnisboxen; Folie 37. |
| 29 | Einheitliches Setup/Report-Muster für alle drei Chi-Quadrat-Fragen; Folien 36–41. |
| 30 | Mann–Whitney zählt Gewinne und halbe Ties; Folien 42–43. |
| 31 | Rangraster mit Nullzentrum, tie-aware Referenz-p und Interpretation; Folie 44. |
| 32 | Klarer Wilcoxon-Signed-Ranks-Titel, ursprüngliche Paare erhalten; Folien 45–46. |
| 33 | Power-Abschnitt und aktive Power-Themenmetadaten entfernt; Typ-II-Grundidee bleibt wie gewünscht. |
| 34 | Cohen-d-Formel, NIR/HPLC-MS-Wert und deklarierte Größenbänder; Folien 47–48. |
| 35 | Cliff-Delta-Größenbänder und Interpretation; Folien 49–50. |
| 36 | Grubbs-/Outlier-Test ausdrücklich im Titel; Folie 51. |
| 37 | G und kritischer Wert mit numerischem Vergleich auf einer zweispaltigen Folie 52. |
| 38 | Separater Grubbs-Ergebnisplot nicht ausgewählt. |
| 39 | Beide R-Labore nicht ausgewählt. |
| 40 | Replikationsaufgabe nicht ausgewählt; notwendige Unabhängigkeitsannahmen bleiben. |
| 41 | Separate finale Berichtsfolie nicht ausgewählt; mündlicher Abschluss im Manuskript. |

## Lokale Nachweise und Grenzen

- `python -m unittest discover -s tests -p test_level6_statistical_tests.py -v`:
  **18 bestanden**, einschließlich Zahlen, Pfad, lokaler Bilder, Formellegenden,
  Script-Materialabdeckung und exakter Manuskriptreihenfolge.
- Gezielte TS-Prüfung von t-Experiment, Symboldefinitionen und Kompositionspolicy:
  **73 bestanden**, darunter neue generische Zweispalter-Regressionen.
- `npm run typecheck`: bestanden.
- Voller fokussierter Browsercheck: **52 Folien je Theme, 16 Tastaturprüfungen
  je Theme**, zusätzliche vollständig geöffnete Legendenbilder; keine erfassten
  Überläufe, Browserfehler oder fehlgeschlagenen Antworten. Script zehn Kapitel,
  sechs Charts, bei 390 px ohne horizontalen Überlauf.
- Introcheck: erste 14 Folien je Theme, vier Regler, Keyboard und Reset bestanden.
  Bei alpha 5/1/0.1% ergeben dieselben Simulationen Typ-II-Raten 25.12/56.27/87.55%.
- Bilder/Berichte lokal unter `%TEMP%/opencode/level6-restructure-final/`;
  Introprüfung unter `level6-intro-final/`. Frühere r1–r5-Verzeichnisse sind
  Diagnosehistorie, nicht der finale Nachweis. Kontaktbögen zeigen geschlossene
  Ansichten; `*-symbols.png` die vollständigen Legenden.
- Keine vollständigen `npm test`, kein Produktionsbuild und kein neuer PDF-Test.
  Bestehende PDFs sind veraltet; insbesondere Druckumbrüche/Legenden sind nicht
  durch diesen Browsernachweis abgenommen. Neue ungetrackte SVGs müssen vor einem
  späteren indexbasierten Produktionsbuild vollständig aufgenommen werden.
- Keine Datenübertragung/Telemetrie hinzugefügt; Beispiele synthetisch, Assets
  lokal. Alternativtexte/Titel/Beschreibungen und sichtbare Labels bleiben erhalten.
- Kein Commit, Push, Release oder Deployment. Nutzerabnahme bleibt ausdrücklich offen.

## Owner-authorized publication preflight

The first full `npm test` on `e11fad44` failed: 641 Python tests ran,
20 failed and three were skipped; subsequent npm phases were not reached.
The failures trace to three orphaned occurrences left by the reviewed reduction:
`l6-guide14b`, `l6r-m4` and `l6r-m5`. Remove these unused declarations, not the
ownership constraints. Their removal leaves the selected 52 slides and compiled
ten-chapter Script unchanged. A focused regression now requires exactly one
owner for every Level-6 definition entry and Script material; all 23 focused
Level-6 tests pass. Complete corrected-head validation, production PDF/build,
browser verification and publication remain pending.

The corrected-head full run on `0c4e6a26` passes all 642 Python tests (three
skipped), then reaches Pitch: 296 of 298 tests pass. Two stale expectations still
assume six world thumbnails and CSS title capitalization. Update them to the
seven authored thumbnails and `text-transform: none`, preserving scientific
title spelling; no production CSS or course content changes are needed.

Production preflight confirms full SHACL conformance. The old SVG exporter can
write a PDF but time out waiting for Edge's CLI process to exit on Windows.
Use the already locked Playwright dependency to await the print protocol and
explicitly close the owned browser, retaining the Chromium sandbox, validated
local SVG inputs, blocked non-file page requests and PDF signature check.
The configured Edge integration test passes along with the three SVG safety
tests and TypeScript checking. A separately installed Chromium reports a Windows
sandbox executable-permission error; no ACL changes or sandbox disabling are
used for publication. Full corrected-head testing and production build remain
required.

The controlled exporter builds all six earlier Scripts successfully. Level 6
then exposes missing LaTeX support for authored HTTPS reading references:
render these as escaped, clickable links with visible URLs, not image assets.
Only actual image media enter SVG conversion/inventory; unsafe TeX-bearing URLs
are rejected. Focused tests cover link output, exclusion from image assets and
URL injection rejection. No web page is fetched during PDF production.
