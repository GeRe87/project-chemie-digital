# Level 4 – kuratiertes Storyboard zur fachlichen Freigabe

**Entscheidungsstand: CHANGES_REQUIRED; Planungsentwurf, keine Umsetzung.**
Datum: 2026-10-24. Verbindliche Eingabe:
`C:/Users/PCUser/Downloads/Level4_Vorlesung_Review_fuer_OpenCode.md`.
Die P0-/P1-Findings werden als Arbeitsauftrag akzeptiert, nicht als Behauptung,
dass die darunter vorgeschlagenen technischen Abnahmen bereits bestanden seien.

## 1. Vorschlag in einem Satz

**22 aktive wissenschaftliche Fragen statt 65 Katalogszenen:** bekannte
Kennzahlen reichen nicht → Ränge und Median → Quantile und ihre Konvention →
IQR → Schwellenwerte/ECDF → Boxplot als Verdichtung → robuste Ergänzungen →
ein Histogrammblick → Pause → Momente als Erweiterung der Varianz → Schiefe →
Kurtosis → kurzes Experiment und chemisch begründete Auswahl.

Das entspricht der konkreten Zeitdramaturgie in Abschnitt 5 des Reviews.
Die ECDF kommt **nach** dem Quantilproblem, nicht als vorgelagerte Pflichttechnik.
Ihre Einführung braucht keinen zuvor vollständig behandelten Histogrammkurs.

- **75 Minuten** bis zur Pause: S01–S13.
- **15 Minuten Pause:** Minute 75–90, keine Lernaktivität eingeplant.
- **45 Minuten** danach: S14–S22.
- Alle Zeiten enthalten Moderation, Vorhersage, Diskussion, Wechsel und ggf. R.
- Keine Hausaufgabe, kein optionaler Zustand und kein Runtime-Download wird
  stillschweigend auf die 120 Unterrichtsminuten aufgeschlagen.
- Kernumfang Histogramm: **eine Szene, sieben Minuten**; Breitenvariation darin
  optional. ECDF: **zwei Szenen, zwölf Minuten**. Momente/Transfer: **45 Minuten**.

Die [Coverage-Matrix](chemometrics-level4-curation-coverage.md) enthält jede alte
Scene-IRI genau einmal mit Entscheidung, Ziel, Begründung und gemeinsamem Budget.
Die beiden [Layout-Mockups](chemometrics-level4-curation-mockups.md) sind
schematische Planungsbilder, keine bereits funktionierenden neuen Folien.

## 2. Quellenstand, Schutzgrenze und überprüfte lokale Befunde

Arbeitsverzeichnis: `project-chemie-digital-level4-authoring`, Branch
`work/level4-authoring`, HEAD `811d09badfb6eb23e1dcb064d4a7e0f326d22a21`.
HEAD allein beschreibt **nicht** den erheblichen uncommitteten Bestand.
Lokale TriG-Dateien mit benannten Graphen sind deshalb die Inhaltsautorität;
kein CDAC-MCP-Abbild wurde als aktuell angenommen oder zur Begründung fehlender
Inhalte benutzt. Es gab keine externe Gesamtvalidierung und keine Regenerierung.

Read-only geprüft:

1. Das exakte Graph/Path-Paar der Coverage-Matrix wählt **65** Schritte mit
   eindeutigen Positionen 1–65 aus. Nicht gewählte frühere Schritte bleiben RDF.
2. Der bestehende Transport enthält dieselben 65 Szenen;
   `datasetFingerprint` =
   `sha256:fdee268043460d04de535da3df3dc182bf990e33e5df7b05aafe63ca0a4d4188`.
3. A/B mit fünf Werten, QC mit sieben Werten sowie Sortier-/Zähl-/ECDF-
   Interaktionen existieren bereits, sind aber nicht dieselben wissenschaftlichen
   Beispiele. Die derzeitige `ex:l4-gap-chart` ist auf das **Viererset** konfiguriert.
4. `ontology/dataset/level4-applied-moment-lab.trig:66` prüft tatsächlich nur
   die zuletzt gesetzte Schleifenvariable `x`. Das ist ein gezielter P1-3-
   Reparaturauftrag, in dieser Planungsphase **noch nicht geändert**.
5. Der Boxplot-Code enthält `requireNamespace`/`webr::install`; ein belastbarer
   Offline-Erststart ist daher aus dem bisherigen Screenshotbericht nicht ableitbar.
6. ADR-0016–0019 bzw. die einschlägigen bestehenden Chart-/Core-Verträge werden
   weiterverwendet. Insbesondere ist die Momentenansicht derzeit ein `moments`-
   View mit gewählter Metrik und drei Darstellungen; ein fokussierter Modus ist
   **noch zu bauen**, nicht schon durch Umordnung vorhanden.

**Schutzbestand:** Alle wissenschaftlichen Concept-/Definition-/MathExpression-/
Example-/Dataset-/Observation-/Source-IRIs, benannten Graphen und vorhandenen
Interaktionen bleiben erhalten. Bestehende lokale Änderungen werden weder
zurückgesetzt noch bereinigt. In dieser Lieferung werden nur neue Planungsdateien
angelegt; kein aktiver Pfad, wissenschaftlicher Quelltext oder Renderer geändert.

Vorher-/Nachher-Schutzfingerprint für 236 Dateien unter `ontology/dataset`,
`apps/pitch/src` und den Core-/D3-/Reveal-/Self-study-Quellverzeichnissen:
`2e2427e971c23d86c90adf82e9d179c6e39366b0fb1affc8ca71a7cbd6b0a345`.
Berechnung: lexikographisch sortierte relative POSIX-Pfade, je Datei
`Pfad + NUL + unveränderte Bytes + NUL`, darüber SHA-256.

## 3. Bewusste Datenregie statt wechselnder Beispiele

`ex:` steht im gesamten Entwurf für
`https://w3id.org/project-chemie-digital/resource/`.

| Kürzel | Bereits authored Daten / Referenzen | Einsatz und expliziter Übergang |
|---|---|---|
| A/B5 | `ex:l4-opening-example`, `ex:l4-opening-data-a`, `ex:l4-opening-data-b`; Serien `ex:l4-opening-series-a`, `ex:l4-opening-series-b` | **Einziger Einstieg**, S01–S06. A = 1,3,5,7,9; B = 2,3,4,6,10 mg/L, jeweils n=5. Gleicher Mittelwert 5 und s²=10, unterschiedliche Median-/Rangstruktur. Kein Fit, keine Populationsevidenz. |
| QC7 | `ex:l4-qc-example`, `ex:l4-qc-reference`, `ex:l4-qc-extreme`; `ex:l4-observation-reference`, `ex:l4-observation-modified` | Ab S07 ausdrücklich: „Für Bindungen und eine einzelne große Beobachtung verwenden wir jetzt einen zweiten Handrechenfall.“ Referenz 2,4,4,5,5,6,7; Variante ersetzt 7 durch 30 mg/L. S07–S09 und S11. Die Rückkehr nach S10 wird am Datensatznamen sichtbar. |
| F4 | `ex:l4-shapes-example`, `ex:l4-shapes-uniform`, `ex:l4-shapes-normal`, `ex:l4-shapes-skewed`, `ex:l4-shapes-bimodal`; entsprechende `ex:l4-shapes-…-series` | Erst S10: „Jetzt von Handbeispielen zu 100 Beobachtungen pro konstruierter Detektorantwort-Reihe.“ Viererset erstmals als **Vergleichsreservoir**, nicht als zweiter Einstieg. Gleiche empirische Mittelwerte 50 a.u. und s=10 a.u. |
| F3 | Teilmenge F4: uniform, normal-like, rechtsschief; gleiche Beobachtungs-IRIs wie F4 | S14–S21. Sichtbar: „3 aus dem Viererset; bimodal bleibt im Formvergleich/Detail.“ Begründung: kontrollierter Vergleich von symmetrisch/flach, symmetrisch/zentral und rechtsschief; nicht weil bimodal keine Momente hätte. F4 bleibt abrufbar, seine Momente werden vor späterer Anzeige numerisch geprüft. |
| Chemische Transferfälle | `ex:l4-large-repeat`, `ex:l4-large-river`, `ex:l4-large-control`, `ex:l4-large-biased`, `ex:l4-large-blank` | S22 eine kurze Auswahlfrage, vertiefende Rechnungen verlinkt. Replikate einer Präparation, unterschiedliche Umweltproben und modellierte Detektorantworten nicht vermischen. Alle hier verwendeten Daten sind synthetisch. |

**Keine automatische Gleichsetzung „zentrale Quartile = exakt 50 % der Punkte“.**
Bei A/B5 enthält das geschlossene Intervall von Q1 bis Q3 je drei von fünf
Beobachtungen. Quartilsniveau und tatsächlicher eingeschlossener Anteil werden
getrennt benannt; bei Ties erst recht. Das ist eine zusätzliche Prüfgrenze für
den Übergang S06 → S12, keine neue Definitionsfolie.

## 4. Revidierter aktiver LearningPath als 22-Zeilen-Storyboard

S01–S22 sind **Planungskennungen, noch keine neuen Scene-IRIs**. Jede Zeile hat
genau eine zentrale Frage. Zustände innerhalb einer Zeile sind keine weiteren
Folien. Die Ressourcenspalte nennt vorhandene kanonische Identitäten; neue
SceneItems/Chart-Konfigurationen werden erst nach Freigabe authored.

| Szene / Uhr / Dauer | Bekannte Aussage → offene wissenschaftliche Frage | Interaktion / eine Hauptvisualisierung | Erwartete neue Erkenntnis / Grenze | Verwendete kanonische RDF-Identitäten |
|---|---|---|---|---|
| S01 · 0–8 · 8 min | Mittelwert und SD sind bekannt → Bestimmen gleiche Kennzahlen dieselben Beobachtungen? | A/B5: erst Kennzahlkarten, Vorhersage, dann genau ein gemeinsamer Punktvergleich; Werte nicht gleichzeitig mit großer Tabelle vorwegnehmen. | Gleiche Mittelwerte/SD lassen verschiedene empirische Anordnungen zu; kein Schluss auf eine gemeinsame Population. | `ex:l4-gap-heading`, `ex:l4-opening-example`, `ex:l4-opening-data-a`, `ex:l4-opening-data-b`, `ex:l4-opening-mean`, `ex:l4-opening-variance` |
| S02 · 8–13 · 5 min | Unterschiedliche Anordnung ist sichtbar → Was ändert Sortieren an einer Beobachtung? | A/B5: eine ID auswählen, sortieren, ID verfolgen; Endpunkte/Range kurz ablesen, Reset zur Ausgangsanordnung. | Wert/ID bleiben, Rang wechselt; Display-Reihenfolge nicht als Zeitfolge ausgeben. | `ex:order-statistic`, `ex:l4-formula-order-statistic`, `ex:l4-order-chart` als Verhaltensvorbild, A/B5-Placements |
| S03 · 13–18 · 5 min | Ränge sind verfügbar → Welcher beobachtete Wert liegt in der Mitte? | Im selben Rangbild den mittleren Punkt von A/B markieren; Vorhersage 5 versus 4 mg/L auflösen. | Gleicher Mittelwert kann verschiedene Mediane verdecken; gerade n nur im optionalen Detail. | `ex:median`, `ex:l4-opening-median-a`, `ex:l4-opening-median-b`, `ex:sample-median-formula` |
| S04 · 18–23 · 5 min | Median beantwortet die mittlere Rangfrage → Wie beschreiben wir ein anderes Anteilsniveau? | A/B-Rangbild: Ziel p=0,4 setzen, angrenzende Ränge hervorheben, vor einer Regelentscheidung mögliche Positionen diskutieren. | Ein gewünschtes Niveau motiviert Quantile; finite Daten legen die interpolierende Konvention nicht allein fest. | `ex:sample-quantile`, `ex:l4-def-sample-quantile`, `ex:quantile-estimation-method` |
| S05 · 23–28 · 5 min | Das Zielniveau ist gewählt → Wie erzeugt Typ 7 einen reproduzierbaren Zwischenwert? | Dasselbe Bild: Interpolationsgewicht einstellen und h=2,6 für n=5,p=0,4 auflösen; Typ-7-Formel erst jetzt, mit Legende. | A ergibt 4,2, B 3,6 mg/L; Zwischenwerte müssen nicht beobachtet sein. Typ 1 erst in S08 funktional ableiten. | `ex:sample-quantile-type-7`, `ex:l4-formula-quantile-interpolation`, `ex:l4-formula-sample-quantile-type-7`, `ex:l4-source-r-quantile` |
| S06 · 28–33 · 5 min | Typ 7 ist deklariert → Wie wird aus zwei Quantilpositionen ein zentrales Breitenmaß? | A/B5 p=0,25/0,75 markieren, Segment dazwischen; kurze IQR-Berechnung, tatsächliche enthaltene Punkte mitzählen. | Quartile sind Niveaus, IQR ist eine Breite (A 4, B 3 mg/L); nicht Radius, nicht zwingend exakt 50 % eingeschlossene Beobachtungen. | `ex:l4-def-quartile`, `ex:l4-formula-interquartile-range`, `ex:l4-opening-q1`, `ex:l4-opening-q3-a`, `ex:l4-opening-q3-b`, `ex:l4-opening-iqr-a`, `ex:l4-opening-iqr-b` |
| S07 · 33–39 · 6 min | Rangfragen sind geklärt → Welcher Anteil liegt bei oder unter einer gegebenen Schwelle? | Angekündigter Wechsel QC7: x=3,9 → 4 → 4,1; dieselben Punkte werden gezählt und danach als Treppe gezeigt. | 1/7 → 3/7 → 3/7, Bindungen zählen einzeln; rechtsstetige, kumulative, binfreie Empirie ohne Bandbreite/Verteilungsfamilie. | `ex:l4-qc-reference`, `ex:l4-count-chart`, `ex:l4-ecdf-chart`, `ex:l4-formula-empirical-cdf` |
| S08 · 39–45 · 6 min | Die ECDF beantwortet eine Vorwärtsfrage → Liefert ihre Umkehrung dieselbe Zahl wie Typ 7? | Im selben QC7-Bild horizontal p=0,8 anlegen: erste erreichte Stufe versus interpolierte Position. | Typ-1-Inverse = 6 mg/L, Typ 7 = 5,8 mg/L. Beide klar benannte Konventionen, keine Behauptung numerischer Identität. | `ex:sample-quantile-type-1`, `ex:sample-quantile-type-7`, `ex:l4-ecdf-inverse`, `ex:l4-formula-sample-quantile-type-1` |
| S09 · 45–51 · 6 min | Quartile beschreiben zentrale Ränge → Wie verdichten wir sie, ohne Fences mit Beobachtungen zu verwechseln? | QC7-Box stufenweise bauen: Quartile/Median → Fences → beobachtete Whisker; Variante 30 als abrufbare Vorhersage. | Typ 7, Faktor 1,5; bei Variante obere Fence 7,75, Whisker 6 mg/L. Flag bleibt Beobachtung, kein automatischer Messfehler. | `ex:l4-order-boxes-one`, `ex:l4-order-boxes`, `ex:l4-formula-outlier-fence`, `ex:l4-interpretation-boxplot-whisker` |
| S10 · 51–57 · 6 min | Boxen verdichten Ränge → Welche Innenstruktur kann dabei verloren gehen? | Expliziter Wechsel F4; Hauptkontrast normal-like/bimodal. Boxen zunächst, dann Punkte einblenden; weitere zwei Formen nur abrufbar. | Lücke/Cluster können hinter einer Box verborgen sein; kein Normalitätsnachweis durch symmetrische Box, keine Behauptung gleicher Boxen. | `ex:l4-box-symmetric-chart`, `ex:l4-box-bimodal-chart`, `ex:l4-shapes-example`, `ex:l4-shapes-normal-series`, `ex:l4-shapes-bimodal-series` |
| S11 · 57–63 · 6 min | Median ist ein Zentrum → Wie beschreiben wir typische Abstände robust? | Zur angekündigten QC7-Reihe zurück: Median → absolute Abstände → Median; 7→30-Vorhersage als kurzer Reveal, kein voller Code. | Roh-MAD = 1 mg/L in beiden kleinen Beispielen; Roh-MAD ist nicht normal-skaliert. Robust bedeutet nicht generell unverändert; Null-MAD beweist keine Konstanz. | `ex:l4-formula-median-absolute-deviation`, `ex:l4-qc-reference`, `ex:l4-qc-extreme`, `ex:l4-interpretation-mad-consistency`, `ex:l4-source-r-mad` |
| S12 · 63–68 · 5 min | SD/IQR/MAD messen unterschiedliche Streuungsaspekte → Garantiert ein Skalenband einen bestimmten enthaltenen Anteil? | Wieder F4-Reservoir, benannter Normal-like/Rechtsschief-Schalter auf derselben Achse; nur ein Bandtyp gleichzeitig, Vorhersage und Zähl-Reveal. | Mittelwert ± Stichproben-SD enthält hier 68 beziehungsweise 85 von 100; weder universelle Abdeckung noch Konfidenzintervall. IQR/MAD als anwählbare Ergänzung. | `ex:l4-spread-normal-chart`, `ex:l4-spread-skewed-chart`, `ex:l4-spread-convention` |
| S13 · 68–75 · 7 min | Punkte zeigen Innenstruktur → Was gewinnt und verliert ihre Zusammenfassung in Klassen? | Aus S10 bekannte bimodale F4-Reihe: Punkte zu gemeinsamem Zählhistogramm; optional grobe/feine Breite, Reset. | Balken zählen Beobachtungen, Klassierung beeinflusst Sichtbarkeit, Daten bleiben gleich. Keine Regeln/adaptive Dichte/2D in der Pflicht. | `ex:l4-hist-bimodal-chart`, `ex:l4-hist-coarse-chart`, `ex:l4-hist-fine-chart`, `ex:l4-source-nist-histogram` |
| Pause · 75–90 · 15 min | — | Keine Pflichtaufgabe während der Pause. | — | — |
| S14 · 90–94 · 4 min | Lage/Varianz sind bekannt → In welchem Sinn sind sie erste beziehungsweise zweite Momente? | F3 als deklarierte Teilmenge: Zentren/Abweichungen auf einem Punktvergleich, Formelzustand mean ↔ variance, nicht beide Texttafeln. | Erstes rohes versus zweites zentrales Moment; Population E[ ] oberhalb empirischer Gegenstücke, m2 mit n nicht s² mit n−1. | `ex:l4-applied-mean-formula`, `ex:l4-applied-variance-formula`, `ex:l4-def-raw-moment`, `ex:l4-def-central-moment`, jeweilige Legenden |
| S15 · 94–99 · 5 min | Quadratische Abstände haben Einheiten → Wie vergleichen wir Form unabhängig von Lage und positiver Skalierung? | Gleicher F3-Punktvergleich: Abstände → standardisierte Abstände als klar benannter Achsenmodus. Einheitenwechsel sichtbar, Achse danach fixiert. | Roh/zentral/standardisiert sind verschiedene Begriffe; empirisch m2=99, s²=100 a.u.²; Nullstreuung verhindert Standardisierung. | `ex:l4-variance-matrix`, `ex:l4-def-standardized-central-moment`, `ex:l4-standardized-formula`, `ex:l4-interpretation-zero-dispersion` |
| S16 · 99–104 · 5 min | Standardisierte Abstände sind verfügbar → Was unterscheidet kubische von quadratischen Beiträgen? | Zunächst eine F3-Reihe, links/rechts Beiträge vorhersagen und dann signierte Kuben zeigen; Erwartungswertformel erst nach dem Muster. | Vorzeichen bleibt unter dritter Potenz erhalten; g1 ist ein normierter Summenbefund, kein Wert auf der Messachse. | `ex:l4-applied-skewness-formula`, `ex:l4-applied-skewness-legend`, `ex:l4-skewness-matrix` |
| S17 · 104–108 · 4 min | Kuben tragen vorzeichenbehaftet bei → Wie unterscheiden sie drei Reihen bei gleicher Varianz? | F3 nebeneinander in **einer** Darstellung, Standardansicht Punkte; optional Box/Histogramm wechseln, nicht neun Panels. | g1 ungefähr 0/0/1,759; Median-/Mean-Marken geben Kontext, keine vollständige Formbeschreibung und kein bias-korrigierter Schätzer. | `ex:l4-skewness-matrix`, `ex:l4-shapes-uniform-series`, `ex:l4-shapes-normal-series`, `ex:l4-shapes-skewed-series` |
| S18 · 108–112 · 4 min | g1 fasst signed balance zusammen → Erzwingt Null-Schiefe Symmetrie? | Vorhersage am vorhandenen exakten 50er-Gegenbeispiel, Häufigkeiten und kubische Summen enthüllen. | 5×(−3), 25×(−1), 20×2: Mittelwert und m3 null, m2 positiv, nicht spiegelsymmetrisch. Keine neue Verteilungsfamilie nötig. | `ex:l4-skew-zero`, `ex:l4-correction-zero-skew-symmetry`, `ex:l4-interpretation-shape-limits` |
| S19 · 112–117 · 5 min | Kuben betonen signierte große Abstände → Was macht die vierte Potenz mit ihrer Gewichtung? | F3-Fokus: denselben standardisierten Abstand mit Quadrat/vierter Potenz vergleichen; Beitragshervorhebung, anschließend κ-/K-Formel samt Legende. | Vierte Potenzen sind nichtnegativ und gewichten große standardisierte Abstände stark; positive Varianz/Existenzbedingungen beachten. | `ex:l4-applied-kurtosis-formula`, `ex:l4-applied-kurtosis-legend`, `ex:l4-kurtosis-matrix` |
| S20 · 117–125 · 8 min | Vierte Beiträge ergeben K → Welche Aussage über Form trägt K, welche nicht? | F3-Fokusvergleich mit K ↔ K−3 als beschrifteter Kennzahlumschaltung; ein Extrembeitrag wird vorhersagbar hervorgehoben. | K≈1,800/2,834/6,662; Exzess hat anderen Nullpunkt. Kein Peakmaß, Modenzähler oder eindeutige Tail-Wahrscheinlichkeit. Ein Plus/Minus-Skalenband ist nur eine Orientierung. | `ex:l4-kurtosis-matrix`, `ex:l4-formula-excess-kurtosis`, `ex:l4-interpretation-kurtosis-limits`, `ex:l4-correction-kurtosis-peak` |
| S21 · 125–131 · 6 min | Formmaße sollen skalierungsunabhängig sein → Was verändert eine affine Transformation wirklich? | Geführtes Kurz-R: Vorhersage, Faktor/Offset wählen, Ergebnis statt Vollcode; Startlauf, Faktor −1 und 0 als benannte Prüffälle; Runtime vorher bereit. | Positiver Faktor lässt g1/K invariant, negativer kehrt g1 um, Null macht beide undefiniert. Kein stiller Fallback auf alte Ausgabe. | `ex:l4-moment-code` als fachliche Vorlage, `ex:l4-moment-lab`, F3-Dataset-/Observation-IRIs; neue Kurz-Code-Ressource erst nach Freigabe |
| S22 · 131–135 · 4 min | Unterschiedliche Größen beantworten unterschiedliche Fragen → Welche Aussage passt zur chemischen Messaufgabe? | Eine Zuordnungs-/Exit-Frage: Replikate, Umweltproben oder Detektormodell; Maß, Einheit, Konvention und Grenze auswählen und begründen. | Kennzahlwahl folgt Fragestellung, nicht größtem Effekt; enger IQR ist nicht Richtigkeit, Blank-Quantil nicht Nachweisgrenze, Simulation nicht reale Evidenz. | `ex:l4-large-repeat`, `ex:l4-large-river`, `ex:l4-large-control`, `ex:l4-large-biased`, `ex:l4-large-blank`, `ex:l4-na-points`, `ex:l4-il-points` |

**Zeitprüfung:** 8+5+5+5+5+5+6+6+6+6+6+5+7 = 75;
4+5+5+4+4+5+8+6+4 = 45. Das sind 22 Szenen, 120 Minuten Arbeit,
135 Minuten Veranstaltungszeit. In S13 sind etwa 4 Minuten für Einführung/Lesen,
2 für optionale Breitenvariation, 1 für Sicherung vorgesehen. Entfällt der
optionale Zustand, wird diese Zeit zur Sicherung genutzt, nicht neu verplant.

**Nicht bloß Katalogteilung:** S02 fragt nach Identität, S03 nach einer zentralen
Beobachtung; S04 nach dem gewählten Anteilsniveau, S05 nach der Regel. S16/S19
erklären die Operation, S17/S20 prüfen die daraus zulässige Vergleichsaussage.
Die Darstellung selbst bleibt möglichst dieselbe; der Fragewechsel begründet
die Szene, nicht ein zusätzliches Bild. Fachlich zu ähnliche Entwürfe werden
bei der Freigabe zusammengelegt, nicht durch weitere Textfolien aufgefüllt.

## 5. Priorisierter Refactoringplan – erst nach Freigabe ausführen

| Stufe | Reviewbezug / Arbeit | Enger Schreibumfang nach Freigabe | Abnahme vor nächster Stufe |
|---|---|---|---|
| G0 | P0-1/2: dieses Storyboard, 65er-Coverage, Zeit/Datenentscheidungen freigeben | Nur diese Planungsdokumente | Fachliche Zustimmung zu 22 Fragen, Datensatzwechseln und Auslagerung. **Aktueller Haltepunkt.** |
| R1 | P0-1/4, P1-5: Erhaltung und getrennte Ausgaben modellieren | Neue quellenverknüpfte TriG-Pfad-/Selektionsressourcen; vorhandene wissenschaftliche Ressourcen nicht überschreiben | Alte 65er-Auswahl als Skript/Bestand erreichbar; aktive und nichtaktive Ressourcen vollständig nachgewiesen, Graphidentitäten stabil. |
| R2 | P0-2/3, P1-1: **nur erster Block S01–S06** | Neue SceneDefinitions/SceneItems/Chart-Konfiguration für bestehende A/B5-IRIs; generische Reveal-Steuerung nur falls fehlend | 33 Minuten, sechs Fragen, ein Einstieg; 1–2 repräsentative Browserbilder, Sortierung/Reset/Legenden und Zahlen lokal geprüft. Noch kein Umbau aller übrigen Folien. |
| R3 | P0-3, P1-4: S07–S13 kuratieren | Vorhandene QC-/ECDF-/Box-/Band-/Histogrammkomponenten und authored Selektoren | Zwei ECDF-Szenen, eine Histogrammszene; Beobachtungsidentität, Ties, Endpunkte, Whisker und kurze Warnungen passen. |
| R4 | P0-2/3, P1-1/3: S14–S20 fokussieren | Generischer Chart-Fokus-/Darstellungsmodus mit RDF-Konfiguration, Core bleibt Reveal-unabhängig | Keine scene-ID-Sonderlayouts; Hauptaussage ohne neun kleine Panels; Konventionen/Nullfälle und alle F3-Reihen getestet. |
| R5 | P1-2/3: S21/S22 und Tutorials | Neue kurze Code-/Aufgabenressourcen, kontrollierte Transporte, gezielte Reparatur `ex:l4-moment-code`; Runtime nur bei belegtem Bedarf | Alle Serien geprüft; offlinefähiges Basis-R erst nach realem Browsernachweis als verfügbar bezeichnen. Vollcode und bisherige Interaktionen bleiben erhalten. |
| R6 | P1-5: getrennte Druck-/Übungsausgaben und lokale QA | Gemeinsame Rendererprojektionen/Print-CSS, Querverweise und begrenzte Testanpassungen | Live 22, wissenschaftliches Skript vollständig, Tutorials ausführbar/lesbar; danach gezielte Screenshots/PDF, kein unangeforderter externer Vollvalidator. |

### R2 konkret: erster inhaltlicher Block, kein neuer Gesamtfoliensatz

1. **S01** aus bestehender Intro-Frage plus `ex:l4-opening-example` kuratieren.
   Die vorhandene Viererset-Grafik nicht umdeuten. Ein neuer Chartselektor für
   A/B5 darf bestehende Serien und Vergleichsbefunde referenzieren. Kennzahlen
   zuerst, Beobachtungen nach Vorhersage, ein knapper Erkenntnissatz zuletzt.
2. **S02/S03** verwenden dieselben A/B5-Beobachtungen. Sortieren kann eine
   ausdrücklich permutierte Darstellung haben, darf aber weder Dataset-Position
   noch Beobachtungs-ID ändern. Zwei gleiche Werte im selben Datensatz wären
   getrennte Beobachtungen; echte Ties werden erst mit QC7 bewusst eingeführt.
3. **S04/S05** fragen erst nach p, dann nach der Interpolation. Das n=5-Beispiel
   nutzt p=0,4, damit eine Zwischenposition entsteht. Typ 7 wird genannt, nicht
   als mathematisch einzig mögliche Definition ausgegeben. Typ 1 folgt in S08.
4. **S06** nimmt p=0,25/0,75 und IQR auf. Ergebnis und tatsächliche Anzahl im
   geschlossenen Intervall trennen. Range maximal eine Minute in S02;
   zusätzliche Range-/Quartil-Anwendungs-/Limits-Szenen werden nicht angehängt.
5. Die bisherige Fünfer-Nitratserie bleibt ein vollständig erhaltenes Detail;
   sie wird nicht parallel als zweiter Einstieg gezeigt. F4 wird **erst S10**
   zum reicheren Vergleich eingeführt; die Startthese wird dabei nicht erneut
   als zweite Intro-Szene inszeniert.
6. R2-Pilot umfasst eine Interaktionsfolge mit benannten Zuständen
   **„Kennzahlen“ → „Beobachtungen“ → „Ränge“ → „Quantilposition“**, soweit sie
   zur jeweiligen Frage gehören. Reset pro Szene ist fachlich eindeutig.
   Nach Formeleinblendung bleibt die vollständige Symbollegende sichtbar.

## 6. Semantics-first: vorhandene Beziehungen statt erfundener Ontologie

Lokal geprüft in `ontology/dataset/concepts.trig`, `interactive-code.trig`
und den Shapes:

| Vorhandene Beziehung | Geplanter zulässiger Gebrauch | Nicht zulässige Abkürzung |
|---|---|---|
| `cd:hasStep`, `cd:usesScene`, `cd:usesResource` | Explizite Auswahl des aktiven/ergänzenden Pfades, eindeutige Positionen und referenzierte Ressourcen | Alle im Graph beschriebenen alten Schritte als aktiv zählen; `usesResource` ohne passenden SceneItem-Selektor ändern. |
| `cd:hasSceneItem`, `cd:selectsResource` | Neue ruhige Projektion derselben Fakten, Rollen/selectionPath/language explizit | Wissenschaftliche Definition im Renderer-String neu erfinden. |
| `cd:derivedFromResource` | Herkunft einer tatsächlich abgeleiteten Lernressource | Ungeprüft auf beliebige Szenen anwenden, ohne Domain/Typ-Vertrag zu prüfen. |
| `dct:references`, `dct:hasPart` | Referenzen beziehungsweise Formel-Legenden-Zuordnung, vorhandene Verwendung und Compiler/Shapes vorher prüfen | `hasPart` nur zum optischen Gruppieren semantisch unzusammenhängender Inhalte verwenden. |
| `cd:showsResource` | Der bestehende Darstellungs-/Codevertrag kann gezeigte Ressourcen benennen | Eine optional zugängliche Navigation allein durch RDF-Kante als fertig implementiert behaupten. |
| `cd:supportsResource` | **Source → LearningResource**, wie deklariert | Szene → optionale Szene als vermeintlicher Support-Link; das wäre ein anderer Vertrag. |

`cd:optionalDetail`, `cd:teaches` und `cd:supports` sind lokal nicht deklariert
und werden **nicht** eingeführt. Die optionalen Ziele erhalten zunächst eigene
normale LearningPath-Auswahlen, Quellen-/Ressourcenreferenzen und passende
Renderer-Navigation auf Grundlage des geprüften Vokabulars. Welche existierende
Relation/SceneItem-Rolle Detailziele tatsächlich transportieren kann, wird in
R1 gegen Domain/Range, SHACL und Compiler geprüft; falls sie fehlt, ist das ein
kleiner expliziter Architekturentscheid, kein erfundenes Prädikat im Content.

Die Formulierung im Review „Symbollegenden ins Detailfenster“ ist nur für
**zusätzliche** Erläuterungen umsetzbar. Nach `AGENTS.md` gilt weiterhin:
**Jede angezeigte Formel mit sichtbarer authored Legende auf derselben Folie.**
Bei zu wenig Platz Formel und Legende gemeinsam aus dem Hauptzustand nehmen
oder ein kompaktes Formel-Legenden-Paar zeigen; niemals die Formel allein lassen.
Vorhandene Legenden und Existenzbedingungen werden nicht gelöscht.

## 7. Konventionen- und Provenienzmatrix / fachliche Prüfaufträge

Die folgende Matrix ist die verbindliche **Soll-/Auditliste**, keine Aussage,
dass alle vorhandenen R-Snippets bereits gegen jedes Feld erfolgreich liefen.
u bezeichnet die jeweilige Messeinheit: A/B/QC mg/L, F3/F4 a.u.; Recovery-Lage in
%, Differenzen dort in Prozentpunkten. n ist im Live-Kontext ausdrücklich sichtbar.

| Größe / Ziel und bestehende RDF-Identität | Empirische Definition / Divisor / Typ / Whisker | n / Einheit | Quellen-IRI und R-Referenzausdruck / Prüfauftrag |
|---|---|---|---|
| Beobachteter Bereich, `ex:l4-formula-range` | Maximum minus Minimum, kein Populationssupport | A/B 5, QC 7, optionale Anwendungen 50; u | `ex:l4-source-r-quantile` als bestehender Kontextbezug, Endpunktrechnung zusätzlich direkt prüfen; `diff(range(x))`. |
| Lage, `ex:l4-applied-mean-formula` | Gleichgewichtet `sum(x)/n`; Population μ=E[X] getrennt | 5/7/100; u | `ex:l4-source-nist-skew-kurt`; `mean(x)`; nicht empirischen Wert als bekannte μ ausgeben. |
| Median, `ex:sample-median-formula` | Mittlere Ordnung, bei geradem n Mittel der beiden mittleren Werte | 5/7/100; u | `ex:l4-source-r-quantile`; `median(x)`; Ties und gerades n testen. |
| Typ-7-Quantil, `ex:l4-formula-sample-quantile-type-7` / `ex:l4-formula-quantile-interpolation` | h=1+(n−1)p, lineare Interpolation; Endpunkte und n=1 explizit | 5/7/50/100; u | `ex:l4-source-r-quantile`; `quantile(x,p,type=7,names=FALSE)`. A/B p=0,4 → 4,2/3,6; alle Chart-/R-Transporte vergleichen. |
| Typ-1-Inverse, `ex:l4-formula-sample-quantile-type-1` | Kleinster beobachteter Wert mit ECDF≥p, 0<p≤1; p=0 separat als Endpunktkonvention | QC 7, optional River 50; u | `ex:l4-source-r-quantile`; `quantile(x,p,type=1,names=FALSE)`. QC p=0,8 → 6, Typ 7 → 5,8. River p=0,25 → 6,5 versus 6,625. |
| IQR, `ex:l4-formula-interquartile-range` | Q7(0,75)−Q7(0,25), kein Divisor/Whisker | 5/7/50/100; u | `ex:l4-source-r-iqr`, `ex:l4-source-r-quantile`; `IQR(x,type=7)`. Tatsächliche Intervallzählung von Quartilsniveau unterscheiden. |
| Roh-MAD, `ex:l4-formula-median-absolute-deviation` | Median absoluter Abweichungen vom Median; **constant=1**, kein Normalfaktor | QC7, Details 50, Bandvergleich 100; u | `ex:l4-source-r-mad`; `mad(x,center=median(x),constant=1)`. Standard-R-Default nicht stillschweigend übernehmen; gerundeter nichtkonstanter Nullfall. |
| Box/Fences, `ex:l4-order-boxes`, `ex:l4-formula-outlier-fence` | Typ-7-Q1/Q3, Fences ±1,5 IQR; Whisker sind äußerste **beobachtete** Werte innerhalb; Flag behalten | QC 7; Galerien 100, Übungen 50; u | `ex:l4-source-r-boxplot`, `ex:l4-source-ggplot-boxplot`; `quantile(...,type=7)` + explizite Fence/inside-Auswahl. `boxplot.stats`/Base-R-Hinges nicht als Referenzidentität behandeln; ggplot-Ausgabe für kleine n/Ties separat vergleichen. |
| Deskriptive Varianz / Stichprobenvarianz, `ex:l4-applied-variance-formula` | m2=`mean((x-mean(x))^2)` mit n; s²=`var(x)` mit n−1, n>1 | F3 je 100; u² | `ex:l4-source-nist-variance`; je Reihe m2≈99 und s²≈100 prüfen; Relation n/(n−1). E[(X−μ)²] ist Populationsgröße, nicht automatisch eines dieser Ergebnisse. |
| Skalenband, `ex:l4-spread-convention`, `ex:l4-variance-matrix` | SD-Band benutzt s, Momentenband √m2; IQR und Roh-MAD anders definiert; geschlossene Intervalle zählen | F4-Teilreihen je 100; Grenzen u, Anteil dimensionslos | `ex:l4-source-nist-variance`, `ex:l4-source-r-iqr`, `ex:l4-source-r-mad`; `sum(x>=lo & x<=hi)/length(x)`; s und √m2 nicht vertauschen, 68/85 nur dem passenden Band zuschreiben. |
| ECDF, `ex:l4-formula-empirical-cdf` | `sum(x<=t)/n`, alle Ties, rechtsstetig, keine Bins | QC 7, River 50, F4 100; t in u, F dimensionslos | `ex:l4-source-r-quantile` / bestehender ECDF-Definitionsbezug; `ecdf(x)(t)` und direkter Count unabhängig vergleichen. Unter Minimum 0, ab Maximum 1, 3,9/4/4,1 und offene/gefüllte Punkte prüfen. |
| Histogramm-Counts, `ex:l4-hist-bimodal-chart` | Gemeinsame explizite Kanten, links zu/rechts offen, letzte Oberkante eingeschlossen; Summe=n | Live 100, Tutorial je Datensatz; x u, y Anzahl | `ex:l4-source-nist-histogram`, `ex:l4-source-r-histogram`; `hist(x,breaks=edges,right=FALSE,include.lowest=TRUE,plot=FALSE)$counts`; Grenzwerte und Verschieben/Breite ohne Verlust testen. |
| Dichteflächen (nicht live), `ex:l4-hist-density-formula`, `ex:l4-unequal-chart` | Höhe=count/(n·Breite), Fläche=count/n; positive Breiten | Achtwertefall n=8, adaptiv n=100; Höhe u⁻¹ | `ex:l4-source-nist-histogram`, `ex:l4-source-r-histogram`; `counts/(n*diff(edges))`, Summe Höhe·Breite=1. Repeated edges/Ties nicht als Nullbreiten durchlassen. |
| Schiefe, `ex:l4-applied-skewness-formula` | g1=m3/m2^(3/2); mk=`mean((x-mean(x))^k)` mit n; keine Biasanpassung. Population γ1 separat | F3 je 100; dimensionslos; positive Streuung, endlicher dritter absoluter Populationsmoment | `ex:l4-source-nist-skew-kurt`; `mean(d^3)/mean(d^2)^1.5`. Referenz ≈0/0/1,75934 und Gegenbeispiel n=50 testen. |
| Kurtosis/Exzess, `ex:l4-applied-kurtosis-formula`, `ex:l4-formula-excess-kurtosis` | K=m4/m2²; g2=K−3, keine Biasanpassung. Population κ / κ−3 separat | F3 je 100; dimensionslos; m2>0, endlicher vierter Populationsmoment | `ex:l4-source-nist-skew-kurt`; `mean(d^4)/mean(d^2)^2`, danach −3. Referenz ≈1,79976/2,83416/6,66233. Normal-like-Sample nicht auf K=3 zwingen. |

### Gezielte numerische und technische Aufträge (P1-2/3/4)

1. **Alle R-Snippets inventarisieren**, nicht nur den finalen Lab: mindestens
   `ex:l4-box-code`, `ex:l4-hist-lab-code`, `ex:l4-moment-code` sowie erhaltene
   `ex:l4-code-quantile`, `ex:l4-code-qc`, `ex:l4-code-shape`. Diese sechs
   `l4-`-CodeExample-IRIs sind lokal vorhanden: Box-Code in
   `chemometrics-level4-order-statistics.trig`, Histogramm-Code in
   `chemometrics-level4-histograms.trig`, Moment-Code in
   `level4-applied-moment-lab.trig`, die übrigen drei in
   `chemometrics-level4-teaching.trig` (jeweils unter `ontology/dataset/`).
   Das ist eine Ressourceninventur, noch kein erfolgreicher Ausführungstest.
   Für jeden Input Daten-/Observation-IRIs,
   Größe, Reihenfolge, Einheit, Filter/NA-Regel, Quantil-/Whisker-Konvention und
   Output dokumentieren. Vorhandene `CodeExample`-Ressourcen nicht entfernen.
2. **Datenvertrag statt doppelte Listen:** Kurzlab erhält einen deterministischen
   generierten Transport aus RDF-Beobachtungen mit IDs/Provenienz. Die analytische
   qnorm/qexp-Konstruktion im vorhandenen Vollcode ist eine dokumentierte zweite
   Berechnung; ihre Übereinstimmung zu gespeicherten Dezimalwerten braucht eine
   Toleranzprüfung, keine behauptete Bitidentität. Keine wissenschaftlichen
   Zahlenlisten im TypeScript/UI als neue Autorität.
3. **Jede Reihe prüfen:** `lapply`/Schleife mit Assertions für n, Mittelwert, m2,
   s², g1, K und Box/Histogrammwerte; nicht das letzte `x`. Auswahl F3 aus F4
   ausdrücklich berichten. Skalen-/Extremwerttests nicht fälschlich weiterhin
   gegen die unveränderten Startwerte 50/99/100 prüfen.
4. **Affine Tests:** y=a+b·x; Mittelwert a+b·Mittelwert, mk wird b^k·mk,
   Varianz b²-mal. Für b>0 g1/K gleich, b<0 g1 vorzeichenverkehrt/K gleich,
   b=0 beide undefiniert. Zusätzlich Translation, n=1, konstante Daten, Ties,
   nichtendliche Eingaben und numerisch große Offsets. Vorhandene
   `packages/core/test/moments.test.ts` deckt positive affine Fälle/Nullstreuung
   ab; negative Skalierung muss gezielt ergänzt werden.
5. **R real lokal, nicht Screenshotbeweis:** vor dem Hörsaal Erststart/warm start,
   wiederholtes Ausführen, Reset, Parameterrücksetzung, echte Plotartefakte,
   Paketverfügbarkeit und Fehlermeldung bei blockiertem Netz prüfen. Basis-R
   erspart ggplot2, ist aber erst offline, wenn auch webR/WASM/Assets lokal
   verfügbar sind. Paketdownloads nicht im Pflichtfluss voraussetzen.
   Bei Ausfall ein klar als vorberechnetes Referenzergebnis beschriftetes
   Artefakt, niemals „erfolgreich ausgeführt“ vortäuschen.
6. **Warnungen am Aussageort:** synthetisch/n/Einheit/Datenart im Kontext;
   Fence≠Löschung S09, Null-MAD≠Konstanz S11, Skalenband≠CI S12/S15,
   g1=0≠Symmetrie S18, K≠Peakhöhe/Tailwahrscheinlichkeit S20,
   Blank-Quantil≠Nachweisgrenze S22. Quellen und vollständige Begründung im Skript.

## 8. Drei Ausgabeziele – eine wissenschaftliche Quelle

1. **L4-live:** 22 aktive Fragen mit ruhiger Projektion und fortschreitender
   Freigabe. Keine komplette Formgalerie oder Vollcodewand als Pfadzwang.
2. **L4-script:** wissenschaftliches Leseskript mit allen bisherigen Ressourcen,
   Formeln/Legenden, Quellen, ausführlichen Tabellen, großen Matrizen und
   Referenzen „gehört zu S…“. Aktive Position und Detailnummer nicht verwechseln.
   Die bisherige 65er-Version dient als unveränderte Referenz, nicht als
   vermeintlicher neuer Live-Export. PDF-Seitenzahl ist keine Live-Szenenzahl.
3. **L4-tutorial:** selbstständig bearbeitbare Aufgaben, kurze Startfassung,
   optionaler Vollcode, erwartete numerische Ergebnisse, Reset-/Fehlerhinweise.
   Level-5-Kandidaten bleiben bis zur dortigen Freigabe gekennzeichnete Vertiefung.

Jede aktive Szene benötigt nach Umsetzung einen tatsächlich navigierbaren
Verweis zu ihren Details/Übungen. Daten-/Formel-IRIs werden geteilt, nicht als
Textkopien pro Ausgabe neu authored. Printzustände müssen den Lerninhalt auch
ohne ausgeführte Interaktion vollständig und ehrlich darstellen.

## 9. Visuelles QA-Raster für den Pilot (keine Massenerzeugung jetzt)

| Prüfdimension | Lokale Abnahme nach Freigabe | Nachweis / Stopkriterium |
|---|---|---|
| Projektion | 1600×1000 (16:10) und 1600×900 (16:9), jeweils Light/Dark; normale Browser-Skalierung | S01 und ein Momentenfokus mit 100-%-Ansicht prüfen. Kernfrage, Achsen/Einheit und wichtigste Werte ohne Zoom lesbar; kein Clipping/scrollpflichtiger Kerninhalt. Ziel: Fließ-/UI-Kerntext ≥24 CSS-px, Achsen ≥20; bei Verkleinerung keine bloße mechanische Einhaltung als Projektionsbeweis. |
| Informationslast | Eine Hauptvisualisierung, eine Frage, ein kurzer Erkenntnissatz im jeweiligen Zustand | Keine gleichzeitig sichtbare komplette Szenariobox + Tabelle + Matrix + Limitsliste. Details dürfen nicht wesentliche Warnung oder Legende verstecken. |
| Progressive disclosure | Fachlich benannte Zustände, Vorhersage vor Ergebnis, keine neue Scene nur für Reveal | Tastatur/Touch, Fokusreihenfolge, Reduced Motion und Reset testen; kein unaufgeforderter nächster Zustand beim Scrollen. |
| Formeln | Formel und sichtbare vollständige authored Symbollegende als Einheit | Farben konsistent, Begriffe zusätzlich textlich; Operatoren/Indizes/Einheiten erklärt. Bei Überfüllung gemeinsam verlagern, nicht Legende verstecken. |
| Vergleich/Modus | Messachsen und Datensatz-/Beobachtungsidentitäten bleiben beim Darstellungswechsel konsistent | Punkte↔Box↔Histogramm mit denselben IDs/n und gemeinsamen Kanten; standardisierte Achse explizit umbenennen; Kennzahlkoeffizient nicht als Messachsenposition. |
| R-Interaktion | Hypothese/Parameter/Ergebnis sichtbar, kompletter Code optional | Status „läuft/Fehler/erfolgreich“ und echtes Plotartefakt prüfen; alte Ausgabe nach Fehler nicht als neue ausgeben; offline kalt/warm und Reset dokumentieren. |
| Dark/Light/A11y | Kontrast der drei Reihen, Auswahl, Reset, Fokus, Warnung und Legende | Farbe nicht einziges Merkmal; Texte/Strichmuster und zugängliche Datendarstellung erhalten. Keine vollständige Accessibility-Zertifizierung behaupten. |
| Skript/PDF | Eigenständige Überschriften/Querverweise, Formeln mit Legenden, keine versteckten Ergebnisse | Portrait/landscape separat prüfen; keine losen Matrixhälften, abgeschnittenen Formeln oder leeren Seiten; Druck-/Fokusrahmen aus, Bildschirm-Fokus an. |
| Erhaltung | Aktive und optionale Ausgaben adressieren denselben kanonischen Bestand | Coverage 65/65, Source-/Dataset-/Observation-IRIs stabil; keine still entfernte Szene/Interaktion oder alte lokale Änderung. |

**Pilot-Evidenz:** nur S01 und eine fokussierte Momentenansicht in beiden Formaten
und Themes, ergänzt durch ihre Zustands-/Resetprüfungen. Die zwei Mockups in der
Begleitdatei dienen jetzt der fachlichen Freigabe; sie sind keine Browser-QA.
Erst nach Umsetzung und Abnahme repräsentativer Blöcke neue Gesamtcaptures.

Bestehende gezielte Tests als Startpunkt: `tests/test_level4_ecdf_moments.py`,
`tests/test_level4_order_statistics.py`, `tests/test_level4_histograms.py`,
`apps/pitch/test/observation-projection.test.ts`, Core-/D3-Einzeltests sowie
`scripts/check_level4_order_statistics.cjs`. Alte 65er-Annahmen nicht global
auf 22 ersetzen: wissenschaftlichen Altbestand separat testen und neue aktive
Auswahl gezielt testen. `scripts/check_observation_preview.cjs` erwartet eine
historische Vier-Szenen-Vorschau, nicht den jetzigen 65er-Transport; diesen
Vertrag vor Wiederverwendung respektieren.

## 10. Fachliche Freigabe und Haltepunkt

### Lokale Planungsprüfung dieser Lieferung

Read-only mit Python/rdflib gegen den aktuellen Worktree geprüft:

- Coverage **65/65**, jede alte ausgewählte Scene-IRI genau einmal, Reihenfolge
  und Positionen exakt mit `cd:hasStep` abgeglichen. Primärentscheidungen:
  16 keep, 18 merge, 16 optional, 4 tutorial, 11 Level5. Diese Altentscheidungen
  sind keine Zählung der 22 neuen Fragen; Zusammenführungen/Teilfragen stehen
  ausdrücklich in der Zielspalte.
- Storyboard **22/22**: jedes Zeitintervall entspricht seiner Dauer; keine
  Lücke/Überlappung außer der geplanten Pause; Summen 75 und 45 Minuten.
- Sämtliche konkret zitierten `ex:`-IRIs existieren als Subjects im lokalen
  Dataset. Die ergänzend ausgeschriebenen RDF-Beziehungen sind keine neuen
  Vocabulary-Behauptungen; Domain-/Range-Grenzen stehen in Abschnitt 6.
- Lokale Dokumentverweise existieren. A/B-Kennzahlen, Typ-7-Zwischenwerte,
  IQR/Intervallzählung, QC-Ties, inverse Quantile, Roh-MAD und oberer
  Fence/Whisker wurden unabhängig direkt aus den RDF-Beobachtungen gerechnet.
- Der Schutzfingerprint der 236 wissenschaftlichen/Anwendungsquelldateien ist
  unverändert. Der bestehende 65er-Transport wählt weiterhin exakt dieselben
  RDF-Szenen aus. Keine funktionierende Interaktion wurde angefasst.

Das sind **Planungs-/Referenzprüfungen**, keine neuen Runtime-/Offline-Tests,
keine erneute SHACL-Gesamtvalidierung und kein Nachweis für noch nicht gebaute
22-Szenen-Ansichten.

Zur Freigabe stehen genau diese Entscheidungen:

1. **22 Fragen / 75+15+45 Minuten**, zwei ECDF-Szenen, eine Histogrammszene,
   volle zweite Hälfte für Momente und Transfer.
2. **A/B5 als einziger Einstieg**, QC7 gezielt für Ties/ECDF/Box/MAD,
   Viererset erst S10, deklarierte Dreiersubmenge für den Momentenvergleich.
3. **Auslagerung gemäß 65er-Coverage**, keine Löschung; Level-5-Ziele zunächst
   Kandidaten, vollständiges Skript und Tutorials getrennt vom Live-Pfad.
4. **Erster Implementierungspilot nur S01–S06**, mit zwei repräsentativen
   visuellen Nachweisen statt sofortiger Neuerstellung aller Folien.

**Hier stoppen.** Ohne fachliche Freigabe keine Umstellung von `cd:hasStep`,
keine neue aktive SceneDefinition, keine Refaktorierung der Renderer oder Labs.
Kein PR, Commit, Merge, Deployment und kein externer Gesamtvalidatorlauf.
