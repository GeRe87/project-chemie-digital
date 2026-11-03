# Level 5: PFAS-Einstieg und Binomialstationen B01 bis B06

**Überholt für die Vorlesungsbedienung:** Die nachfolgende Button-/Reglerbeschreibung
dokumentiert den früheren interaktiven Prototyp. Die aktuelle klickergeführte
Vorlesung ist in [lecture-stages-review](chemometrics-level5-lecture-stages-review.md)
beschrieben und ersetzt diese Bedienung in allen sieben Szenen.

Stand: 2026-10-31. **Lokaler Prototyp, visuelle Abnahme offen.**
Nach B01/B02 folgt ein eigenes Abnahmepaket mit fünf weiteren Szenen.

## Bestandsaufnahme und Zuordnung der Blaupause

Vorhanden sind FlowDiagram mit geordneten Knoten/Kanten und Zuständen,
Versionierung, D3-Runtime-Port, Reveal-Lebenszyklus, Diagramm-/Chart-Dispatch,
Bar-/Liniencharts, Beobachtungs-/ECDF-Ansichten, Histogramme, authored Formeln
mit Legenden, Narration, Skriptansicht und isolierte Authoring-Vorschauen.
Es gab keine passende native Bernoulli-Simulation und keinen Core-Zufallsstrom.
Diese eine Lücke wird als Fähigkeit eines bestehenden FlowDiagram geschlossen.
Keine fest einprogrammierten Szenen-IDs oder eigene Layout-DSL.

| Station | Wiederverwendung und noch nötige Arbeit |
| --- | --- |
| B01 | FlowDiagram, neue binäre Entscheidungsfähigkeit, schrittweises Benennen |
| B02 | Gleiche Fähigkeit mit reproduzierbaren Serien und gesammelten Zählwerten |
| B03a/B03b | Spezifische Folge, verschiebbare Anordnungen und gemeinsame Formel-/Legendenansicht |
| B04 | Stabile Binomial-PMF, persistente Parameterregler, Erwartungswert und Streuung |
| B05 | Nullbefund, Vorhersage und Schätzung getrennt; Obergrenze bleibt optionale Vertiefung |
| B06 | Drei authored Laborfälle mit schrittweise aufgedeckter Begründung |
| P07 | Vorhandene Diagramm-/Balkenansicht; Poisson-Modell und Ereignissimulation ergänzen |
| D08 | ECDF-/Chart-/Formelkonventionen nutzbar; theoretische PMF/PDF/CDF nicht als ECDF ausgeben |
| N09 | Histogramme/Formeln vorhanden; Normalmodell und Parametersynchronisation ergänzen |
| N10 | Normal-Wahrscheinlichkeiten und Quantile sowie Standardisierung ergänzen |
| N11 | Vergleichs-/Histogrammansichten vorhanden; Datensätze und Modellkritik authoren |
| L12 | Beobachtungsressourcen vorhanden; dieselben Daten auf linearer/Log-Skala ergänzen |
| C13 | Getrennte Diagramme nutzbar; neue Stichproben und ein Mittelwert pro Wiederholung nötig |
| C14 | Gleiche Sampling-Pipeline, gemeinsame Skalen und theoretische Vergleichsstreuung nötig |
| S15 | Bestehende Streuungsressourcen/Formeln wiederverwenden, SD/SE und Bias trennen |
| T16 | Formel-/Legendenrendering vorhanden; χ²-/t-Referenzmodelle mit Voraussetzungen ergänzen |
| F17 | Formel-/Legendenrendering vorhanden; F-Modell und Varianzquotient ergänzen |
| G18/G19 | Neu vereinbarte K-S-/Pearson-Anpassungstests nach den Verteilungen; eigene Abnahme |
| Abschluss | Bisheriges E18 hinter G18/G19 verschieben; Zeitbudget noch offen |

Die Zuordnung ist ein Arbeitsplan, keine Behauptung bereits implementierter
Verteilungen oder freigegebener Szenen. Die externe Blaupause bleibt die
inhaltliche Grundlage. Die darin genannte zusätzliche Ausgangsdatei fehlt weiter.

## Vorschau und Abnahme

Start: `npm run preview:level5`.

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-b01-scene--scene>

Falls die Titelseite erscheint, einmal „Next“. Die erste inhaltliche Szene ist
unmittelbar B01, ohne Wiederholung vorheriger Levels. Die zweite Szene folgt
über „Next“. Folien, Bedienung und ausführliches Skript sind auf Englisch.
Helle Ansicht: `&theme=light` vor dem Hash ergänzen.

### B01, etwa fünf Minuten

1. Nur Probe, analytische Entscheidung und Leitfrage.
2. „Show outcomes“: positive und negative.
3. „Add outcome codes“: 1 und 0 als Codes, nicht Konzentrationen.
4. „Name the trial“: Bernoulli trial.

Sichtbar bleibt die Trennung zwischen Befund und wahrem Zustand. Es werden weder
ein gesetzlicher Grenzwert noch ein konkretes PFAS-Prävalenzniveau behauptet.

### B02, etwa sechs Minuten

Lehrannahme: zehn unabhängige Proben aus derselben Grundgesamtheit,
eine Entscheidung je Probe, konstante 20 Prozent Positivwahrscheinlichkeit.
Die zehn Karten sind keine technischen Replikate einer einzigen Umweltprobe.

1. Klasse vermutet eine Anzahl und diskutiert, ob sie garantiert ist.
2. „Run a series“ erzeugt zehn neue Befunde aus dem Modell.
3. Gemeinsam zählen, dann „Show count“.
4. „Collect count“ überträgt genau eine Anzahl in die Häufigkeitsdarstellung.
5. Nächste Serie. Frühere Zählwerte bleiben erhalten.

Die ersten fünf Serien haben beim dokumentierten Startseed 20261030 die Anzahlen
1, 3, 0, 2 und 0. Das ist eine reproduzierbare Demonstration, keine gezielt
zugeteilte Erfolgszahl oder gemessene Quote. Andere Serien dürfen denselben Wert
haben. Die Balken sind simulierte Serienhäufigkeiten, keine exakte PMF.
„Reset“ leert den Verlauf und beginnt denselben Zufallsstrom erneut.

Die Lehrperson bedient. Studierende benötigen keine Geräte und geben keine
personenbezogenen Antworten ab. Ein Einstieg über Formeln, PMF/PDF/CDF oder
ein R-Programm ist bewusst nicht enthalten. B03 beginnt später mit der Frage,
wie wahrscheinlich genau zwei positive Befunde sind.

## Prüfbefehle und Grenzen

- `npm run preview:level5:generate`: echter semantischer Compiler, sieben Szenen.
- `python -m unittest discover -s tests -p test_level5_binomial_opening.py -v`:
  Projektion, Isolation, SHACL und ungültige Konfigurationen.
- `node --experimental-strip-types --test packages/core/test/binary-experiment.test.ts packages/renderer-self-study/test/binary-experiment.test.ts`:
  Zufallsstrom, Modellgrenzen, Zustandsfolge, Reset und statische Adapter.
- `npm run check:semantics`: vollständige semantische Prüfung.
- `npm test`: maßgebliche vollständige Projektprüfung, nicht durch Einzeltests ersetzt.

Keine Veröffentlichung, kein PR, kein Merge und kein Deployment. Die akzeptierten
Level-0-bis-4-Lehrinhalte sowie Talks bleiben unverändert. Visuelle Abnahme und
Zeitbudget des Gesamtlevels bleiben eigenständige, offene Entscheidungen.

## Lokaler Prüfstand dieses Prototyps

- Sechs gezielte Python-Tests und sechs gezielte Node-Tests bestanden.
- Edge und Firefox: je heller/dunkler Modus bei 1440 × 900 und 390 × 844 geprüft.
  B01-Reihenfolge, B02-Zählwerte, genau einmaliges Sammeln, Verlauf, Reset,
  Tastatur und Skript funktionieren ohne Browserfehler. Die Bedienung und
  Ergebnisanzeige bleiben in diesen geprüften Ansichten ohne vertikales Scrollen
  erreichbar; die mobile Ergebnisanzeige endet oberhalb der Navigation.
- Vollständige semantische Prüfung und `npm test` wurden gestartet. Ihr Ergebnis
  ist erst nach Abschluss gültig; gezielte Erfolge sind kein Ersatz dafür.
- Screenshots und Browserprüfskript liegen lokal im genehmigten temporären
  OpenCode-Verzeichnis, nicht als neue authored Lehrquelle im Repository.

## Verbindliche Layout- und Sprachgrenze

- Lehrinhalte, Narration, Bedienelemente und statische Alternativen auf Englisch.
- Unveränderte Kompositionsinferenz: Überschrift plus FlowDiagram ergibt die
  vorhandene `visual-stage`, keine PFAS- oder Level-spezifische Folienart.
- `visual-stage-primitives.css`: gemeinsame Bühnen- und Host-Geometrie.
- `presentation-mobile.css`: zentraler mobiler Überschriftentoken, keine
  komponentenspezifischen Überschriftenkorrekturen.
- `interactive-primitives.css`: gemeinsame Typografie, Schaltflächen, Fokus und
  Mindestbediengröße für Binary Experiment und Observation Explorer.
- `binary-experiment.css`: nur Komponenteninneres. Von 53 auf 30 Zeilen reduziert;
  keine `.reveal`-/`section`-/`h2`-Selektoren, keine eigenen Hex-Farben oder
  `!important`-Korrekturen. Vorhandene Theme-Tokens bestimmen die Palette.
- Auto-fit statt fest einprogrammierter Zehn-/Fünfspaltenraster; keine Szenen-IDs
  oder PFAS-spezifischen Texte im Renderer. Fachlicher Inhalt bleibt in TriG.
- Drei Standardisierungstests und alle 236 Pitch-Tests bestehen. Nach der
  Umstellung wurden die acht Edge-/Firefox-/Theme-/Viewport-Kombinationen erneut
  mit englischer Bedienung, Reset und Skript geprüft. Der vollständige alte
  Testlauf galt noch für die deutsche Fassung und ersetzt keine neue Regression.

## Korrektur nach Screenshot-Review

Der Einstieg formuliert die vereinfachte Screening-Frage statt mit einer
Entscheidungsregel zu beginnen: „We simplify PFAS screening to a yes/no question:
does the sample contain a significant amount of the target PFAS?“ Der sichtbare
Hinweis „The screening result can be wrong“ trennt den Befund weiterhin vom
wahren Zustand. Im Skript bedeutet „significant“ oberhalb des für das Beispiel
gewählten Screening-Niveaus, nicht statistische Signifikanz oder ein gesetzlicher
Sicherheitsgrenzwert.

Der Überlauf wurde bei 1731 × 1006 reproduziert: viewportabhängige Schriftgröße
stieg auf 28 px, während die Reveal-Inhaltsbreite begrenzt blieb. Neun Karten
passten in die erste Zeile, die zehnte erzeugte eine zweite Zeile und verdrängte
die Bedienung. Der gemeinsame Schriftgrößentoken richtet sich bei interaktiven
Hosts nun nach ihrer Containerbreite (`cqw`), nicht nach dem Browserfenster.
Das Kartenraster verteilt die von CSS gemessene Kapazität mit
`balancedCardColumns` über möglichst wenige gleichmäßig belegte Zeilen und wird
bei Größenänderung neu gemessen. Keine feste Zehn-/Fünfspaltenregel und keine
szenenspezifische Layoutausnahme wurden eingeführt.

Erneut geprüft: Edge und Firefox, insgesamt 20 Theme-/Viewport-Kombinationen
einschließlich 1731 × 1006, 1920 × 1080, 1440 × 900, 1280 × 720, 700 × 1000,
640 × 960 und 390 × 844. Anfangszustand, aufgedeckte Befunde, fünf gesammelte
Serien, Reset, Skript und Tastatur bestehen. Prüfungen auf abgeschnittene
Überschriften, horizontales Überlaufen und Bedienelemente unter der Navigation
bestehen; beim Testen nach Größenänderungen wird die Zielseite erneut verankert.
Der Simulationszustand bleibt dabei erhalten. Sieben gezielte Python-Tests und
der neue deterministische Rastertest bestehen. Eine neue vollständige Regression
ist davon getrennt auszuführen.

## Neues Abnahmepaket: fünf Szenen nach B02

Direkte Vorschau:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-b03a-scene--scene>

| Szene | Ablauf der Lehrperson | Diskussionsfrage |
| --- | --- | --- |
| B03a | Faktoren, dann Folgenwahrscheinlichkeit aufdecken | Eine bestimmte Reihenfolge oder alle Folgen mit zwei Positiven? |
| B03b | Positive verschieben, 45 Anordnungen zählen, Binomialformel aufdecken | Warum addieren wir gleich wahrscheinliche Anordnungen? |
| B04 | Vorhersagen sammeln, einen Parameter verändern, Zentrum/Streuung aufdecken | Welche Veränderung erwarten wir bei n beziehungsweise p? |
| B05 | Nullbefund diskutieren, Modellwahrscheinlichkeit zeigen, Frage umkehren | Was ändert sich, wenn p unbekannt ist? |
| B06 | Fälle A/B/C auswählen, gemeinsam begründen, Erklärung aufdecken | Was ist die unabhängige Versuchseinheit? |

Die Ergebniswerte sind Modellrechnungen, keine neuen Messungen oder simulierten
Häufigkeiten: konkrete Folge 0.6711%, genau zwei Positive 30.199%, kein positives
Ergebnis 10.7374%. Bei zehn Versuchen und p = 0.2 sind Erwartungswert 2 und Varianz
1.6. B04 verwendet eine feste vertikale Skala 0 bis 100 Prozent und diskrete Balken;
es wird weder eine Dichtekurve noch eine ECDF vorgetäuscht. Die Regler bleiben
während der Bedienung dieselben DOM-Elemente. Änderungen verbergen Formeln und
Legenden erneut. Reset stellt die authored Parameter und den ersten Fall wieder her.

Jede Formel ist eine TriG-Ressource mit `dct:hasPart`-Legende und vollständigen
Symbol-, Operator- und Einheitenkonventionen. Die gemeinsame `visual-formula`-
Komposition stellt eine Visualisierung neben eine Formel-/Legendeneinheit, nicht
die Visualisierung in den knappen Vorspann eines Formeldecks. Auf schmalen
Bildschirmen ersetzt die aufgedeckte Einheit die markierten Interaktionsdetails;
Bedienung, Ergebnis und Reset bleiben sichtbar. Reset bringt die Details zurück.
Keine Folien-ID und kein PFAS-spezifischer CSS-Selektor bestimmt das Layout.

Gezielte Numeriktests prüfen Normalisierung und Randfälle bis n = 100, die
Beispielwahrscheinlichkeiten, Momente sowie 45 eindeutige Zweier-Anordnungen.
Semantiktests prüfen Szenenreihenfolge, Englisch, gemeinsame Reveal-Provenienz,
vollständige Legenden, ungültige Zielanzahlen und szenenfremde Trigger. Der
akzeptierte Kurs bleibt bei seinen fünf bestehenden Platzierungen.

Poisson und die späteren K-S-/Pearson-Anpassungstests sind nicht Teil dieses
Abnahmepakets. Die fehlende zusätzliche Ausgangsdatei und das Gesamtzeitbudget
bleiben offen. Keine personenbezogenen Daten, keine studentischen Geräte,
keine Veröffentlichung, kein Commit und kein Push.

### Browsernachweis des Fünferpakets

Edge und Firefox bestehen jeweils acht Theme-/Viewport-Kombinationen für jede
der fünf neuen Szenen, insgesamt 80 Szenenprüfungen: 1731 × 1006 hell,
1440 × 900 dunkel, 1280 × 720 hell, 1920 × 1080 hell, 700 × 1000 hell,
640 × 960 dunkel sowie 390 × 844 hell und dunkel. Geprüft wurden Anfangszustand,
Reihenfolge der Aufdeckungen, gemeinsame Sichtbarkeit von Formel und Legende,
unverfrühte Ergebnisse, stabile Regler, Parameterwechsel, alle drei Laborfälle,
Tastatur-Reset und sichtbare Inhalte oberhalb der Navigation. Keine Browserfehler.
Beispielbilder wurden zusätzlich visuell gelesen. Die bestehende B01/B02-
Regression besteht erneut in beiden Browsern mit ihren 20 Kombinationen,
einschließlich Größenwechsel und Skriptansicht. Temporäre Prüfskripte:
`check-level5-workshop.cjs` und `check-level5-binomial.cjs` im lokalen
OpenCode-Temp-Verzeichnis. Die vollständige Projektregression ist getrennte
Evidenz und wird erst nach ihrem Abschluss als bestanden gewertet.
