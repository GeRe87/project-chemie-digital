# Level 4 – vollständige Szenen-Coverage vor der Freigabe

**Status: Vorschlag, nicht implementiert.** Grundlage:
`C:/Users/PCUser/Downloads/Level4_Vorlesung_Review_fuer_OpenCode.md`, insbesondere
P0-1–4 und Abschnitt 7. Begleitendes Storyboard und Prüfplan:
[Kuratierungsplan](chemometrics-level4-curation-plan.md).

## Leseschlüssel und Referenzgrenze

`ex:` = `https://w3id.org/project-chemie-digital/resource/`;
`cd:` = `https://w3id.org/project-chemie-digital/ontology/`.
Die Scene-IRIs sind die **authored RDF-Identitäten**. Im generierten Transport
steht zusätzlich `--scene`; das bezeichnet keine neue wissenschaftliche Ressource.

Alle 65 Zeilen wurden gegen die lokal zusammengeführten TriG-Dateien geprüft.
Autorität ist das benannte Graph/Path-Paar:

- Graph: `https://w3id.org/project-chemie-digital/graph/paths/chemometrics-level4-distribution-shape-lecture`
- LearningPath: `ex:path-chemometrics-level4-distribution-shape-lecture`

Nur die durch dessen `cd:hasStep` **tatsächlich ausgewählten** Schritte zählen.
Alte, noch beschriebene, aber nicht ausgewählte Schritte werden nicht versehentlich
mitgezählt. Aktuelle Pfaddefinitionen sind auf `chemometrics-level4-path.trig`,
`chemometrics-level4-analytical-scenes.trig`, `chemometrics-level4-revised-path.trig`
und `chemometrics-level4-applied-moments.trig` verteilt.

**Entscheidung bezieht sich auf die bisherige aktive Szene, nicht auf Löschung.**

- `keep`: didaktische Kernfrage bleibt; Projektion/Selektion darf nach Freigabe ruhiger werden.
- `merge`: Inhalte werden Zustände/Bestandteile einer Zielszene, keine zusätzliche Folie.
- `optional`: im wissenschaftlichen Begleitskript/Vertiefungsbereich auffindbar.
- `tutorial`: eigenständige geführte Übung, vollständiger Code dort erhalten.
- `Level5`: Kandidat für Level 5; noch keine Zuordnung zu dessen echtem Kurs-Pfad.

**Zielpfade sind hier Planungsnamen, keine behaupteten vorhandenen IRIs:**
`L4-live` = revidierte aktive Auswahl derselben LearningPath-Identität;
`L4-script` = vollständiges wissenschaftliches Begleitskript;
`L4-detail` = optionale Vertiefung; `L4-tutorial` = Übungs-/R-Material;
`L5-candidate` = freizugebender Kandidatenpool. Konkrete neue Pfad-IRIs und
deren Anbindung werden erst nach fachlicher Freigabe authored und geprüft.
Alle Altressourcen bleiben zusätzlich im vollständigen `L4-script` erreichbar.

Die Ressourcenspalte nennt die **wissenschaftlich/visuell maßgeblichen**
bestehenden IRIs, nicht jede Tabellenzelle oder Legendenzeile. Der vollständige
Bestand je Zeile bleibt durch `usesScene`, die SceneItems/`selectsResource`,
`usesResource`, Formelteile, Datensätze und Beobachtungsplacements referenziert.
Keine Umhängung oder Referenzbereinigung ist Teil dieser Lieferung.

**Zeitangaben sind gemeinsame Zielbudgets, nicht addierbare Altfolienzeiten.**
Steht bei drei Altzeilen S09/6, sind das zusammen sechs Minuten. Bei optionalen
und ausgelagerten Szenen: null Pflichtminuten; das genannte Selbstlernbudget
ist ein Vorschlag außerhalb der 120 Minuten. Verbindliche Zeitsumme: Storyboard.

## Coverage 01–65

| Alt | Alte Scene-IRI | Entscheidung | Bestehende maßgebliche RDF-Ressourcen | Ziel-LearningPath / Szene / Minuten | Begründung und Erhaltung |
|---:|---|---|---|---|---|
| 01 | `ex:l4-scene-summary-gap` | keep | `ex:l4-gap-heading`, `ex:l4-gap-chart`, `ex:l4-shapes-table`, `ex:l4-shapes-example` | L4-live S01/8; Viererset später S10/S12/S13 | Gleiche Kennzahlen motivieren die Frage; zunächst vorhandenes kleines A/B-Beispiel statt vierfacher Grafik plus Tabelle; große Darstellung bleibt Skript/Vergleich. |
| 02 | `ex:l4-scene-data-concept` | merge | `ex:l4-data-intro`, `ex:l4-data-formula`, `ex:l4-ac-repeat` | L4-live S02/5; L4-detail Datentypen | Identität/Einheit in Rangexploration aufnehmen; das eigenständige Fünfer-Nitratbeispiel nicht als dritten Einführungssatz aufzwingen. |
| 03 | `ex:l4-scene-order-notation-concept` | merge | `ex:l4-order-notation-formula`, `ex:l4-order-notation-legend`, `ex:order-statistic` | L4-live S02/5 und S03/5 | Index/Rang am Umsortieren erkennen, Median als neue Frage anschließen; keine Notationsfolie vor Beobachtung. |
| 04 | `ex:l4-scene-range-concept` | merge | `ex:l4-def-sample-range`, `ex:l4-formula-range` | L4-live S02/5, darin höchstens 1 Minute | Spannweite als Endpunktablesung, kein eigener Großblock. Formel nur mit sichtbarer Legende. |
| 05 | `ex:l4-scene-range-applications` | optional | `ex:l4-ra-chart`, `ex:l4-ra-table`, `ex:l4-large-repeat`, `ex:l4-large-river` | L4-detail D-range/4; live 0 | Replikate versus verschiedene Proben erhalten, nicht beide Fälle im Einstiegsfluss ausrechnen. |
| 06 | `ex:l4-scene-range-limits` | optional | `ex:l4-rl-chart`, `ex:l4-rl-table`, `ex:l4-ac-centre`, `ex:l4-ac-ends` | L4-detail D-range/3; live 0 | Gleiche Endpunkte verdecken Innenstruktur; ergänzendes Gegenbeispiel statt dritter Range-Folie. |
| 07 | `ex:l4-scene-quartiles-concept` | merge | `ex:l4-def-quartile`, `ex:l4-formula-quartile-positions` | L4-live S06/5 | Quartile erst als Spezialfälle bereits motivierter Quantile; kein vorgezogenes neues Verfahren. |
| 08 | `ex:l4-scene-quartiles-applications` | optional | `ex:l4-qa-chart`, `ex:l4-qa-table`, `ex:l4-large-river`, `ex:l4-large-effluent` | L4-detail D-quantile/5; live 0 | Zwei weitere Konzentrationsreihen nicht im selben Lernschritt wechseln. |
| 09 | `ex:l4-scene-quartiles-limits` | merge | `ex:l4-ql-chart`, `ex:l4-ql-points`, `ex:l4-large-tail` | L4-live S10/6 als kurzer Grenzhinweis; vollständiger Fall D-quantile/3 | Rangzusammenfassung kann Extremwerte verbergen; keine neue Limits-Folie. |
| 10 | `ex:l4-scene-quantiles-concept` | keep | `ex:l4-def-sample-quantile`, `ex:l4-formula-quantile-interpolation` | L4-live S04/5 und S05/5 | Zwei eigenständige Fragen: gewünschter Anteil und Berechnungsregel. Kein Zustandswechsel als künstliche Szene. |
| 11 | `ex:l4-scene-quantiles-applications` | optional | `ex:l4-na-chart`, `ex:l4-na-table`, `ex:l4-large-blank`, `ex:l4-large-river` | L4-detail D-tail/5; live 0 | Tail-Anwendung bleibt abrufbar; keine zusätzliche Datensatzfolge vor Methodenverständnis. |
| 12 | `ex:l4-scene-quantiles-limits` | optional | `ex:l4-nl-chart`, `ex:l4-nl-points`, `ex:l4-ac-blank`, `ex:l4-ac-blank-high` | L4-detail D-tail/4; live 0; Grenzsatz S22 | Kleines Blank-Quantil ist keine validierte Nachweisgrenze; Warnung bei Transfer, Rechnung im Detail. |
| 13 | `ex:l4-scene-iqr-concept` | keep | `ex:l4-def-interquartile-range`, `ex:l4-formula-interquartile-range` | L4-live S06/5 | Quartilpositionen zum zentralen Breitenmaß verbinden; dieselben kleinen Beobachtungen. |
| 14 | `ex:l4-scene-iqr-applications` | optional | `ex:l4-ia-chart`, `ex:l4-ia-table`, `ex:l4-large-extract-a`, `ex:l4-large-extract-b` | L4-detail D-recovery/5; live 0 | Recovery-Auswahl als Transferoption, nicht drei zusätzliche Serien in der IQR-Einführung. |
| 15 | `ex:l4-scene-iqr-limits` | optional | `ex:l4-il-chart`, `ex:l4-il-points`, `ex:l4-large-control`, `ex:l4-large-biased` | L4-detail D-recovery/4; live 0; Auswahlhinweis S22 | Enger IQR ist keine Richtigkeit; Medianverschiebung bleibt im Skript und bei Methodenwahl auffindbar. |
| 16 | `ex:l4-scene-mad-concept` | keep | `ex:l4-def-median-absolute-deviation`, `ex:l4-formula-median-absolute-deviation` | L4-live S11/6 | Median → absolute Abstände → Median, mit kurzer Extremwertvorhersage statt Definitionskatalog. |
| 17 | `ex:l4-scene-mad-applications` | optional | `ex:l4-ma-chart`, `ex:l4-ma-table`, `ex:l4-large-repeat`, `ex:l4-large-spike` | L4-detail D-robust/5; live 0 | Das 50er-Beispiel ergänzt die kleine QC-Interaktion, ersetzt sie nicht mitten in der Herleitung. |
| 18 | `ex:l4-scene-mad-limits` | optional | `ex:l4-ml-chart`, `ex:l4-ml-points`, `ex:l4-ml-context` | L4-detail D-robust/3; live 0; Grenzsatz S11 | Null-MAD trotz nichtkonstanter Werte erhalten; Detailvergleich auf Abruf, Warnung unmittelbar beim Maß. |
| 19 | `ex:l4-scene-spread-normal` | keep | `ex:l4-spread-normal-chart`, `ex:l4-spread-convention`, `ex:l4-spread-use` | L4-live S12/5 | Eine Vergleichsinteraktion fragt nach tatsächlich enthaltenem Anteil; SD/IQR/MAD nicht gleichsetzen. |
| 20 | `ex:l4-scene-spread-skewed` | merge | `ex:l4-spread-skewed-chart`, `ex:l4-spread-skewed-limit` | L4-live S12/5 | Normal-like/rechtsschief als benannte Zustände derselben Frage; 68 versus 85 ist Datensatzbefund, kein Gesetz. |
| 21 | `ex:l4-scene-box-construction` | keep | `ex:l4-order-boxes-one`, `ex:l4-box-construction-table`, `ex:l4-formula-outlier-fence` | L4-live S09/6 | Schrittweise Box, dann Fences/Whisker; Rechnungstabelle nicht dauerhaft neben gesamtem Text. |
| 22 | `ex:l4-scene-box-applications` | tutorial | `ex:l4-ba-chart`, `ex:l4-ba-table`, `ex:l4-ba-context` | L4-tutorial T-box/6; live 0 | Chemische Gruppenvergleiche mit Kontext als geführte Aufgabe. |
| 23 | `ex:l4-scene-box-limits` | merge | `ex:l4-bl-chart`, `ex:l4-bl-points`, `ex:l4-bl-table` | L4-live S10/6; Laufreihenfolgenbeispiel D-box/4 | Eine Zusammenfassung codiert weder Modalität noch Reihenfolge; keine separate dritte Folie. |
| 24 | `ex:l4-scene-box-extremes` | optional | `ex:l4-box-extremes-chart`, `ex:l4-box-extremes-reading-1`, `ex:l4-box-extremes-reading-2` | L4-detail D-box/4; live 0 | 90-mg/L-Fall bleibt optional; Flag-Regel bereits S09 am kleinen QC-Satz. |
| 25 | `ex:l4-scene-box-symmetric` | merge | `ex:l4-box-symmetric-chart`, `ex:l4-box-symmetric-intro` | L4-live S10/6 | Normal-like als Kontrast zur Zweicluster-Reihe; keine behauptete identische Box. |
| 26 | `ex:l4-scene-box-skewed` | optional | `ex:l4-box-skewed-chart`, `ex:l4-box-skewed-reading-1` | L4-detail D-gallery/3; live 0 | Weitere Form ist abrufbarer Zustand, keine obligatorische Galeriefolie. |
| 27 | `ex:l4-scene-box-bimodal` | keep | `ex:l4-box-bimodal-chart`, `ex:l4-box-bimodal-reading-1` | L4-live S10/6 | Neue Frage: Was verbirgt eine Box? Punkte enthüllen die Lücke, nicht weitere Boxdefinition. |
| 28 | `ex:l4-scene-box-uniform` | optional | `ex:l4-box-uniform-chart`, `ex:l4-box-uniform-intro` | L4-detail D-gallery/3; live 0 | Symmetrisch ist nicht normal; als Zusatzvergleich statt Pflichtgalerie. |
| 29 | `ex:l4-scene-box-lab` | tutorial | `ex:l4-box-task`, `ex:l4-box-code`, `ex:l4-box-functions` | L4-tutorial T-box/12 zusätzlich zu 22; live 0 | Vollcode erhalten, provisioning/offline und Hinges-Konvention vor Einsatz prüfen. |
| 30 | `ex:l4-scene-histogram-intro` | keep | `ex:l4-hist-normal-chart`, `ex:l4-histogram-intro-intro` | L4-live S13/7 | Eine Sicht auf empirische Form: von Punkten zu Häufigkeiten; nicht Start eines Histogrammkurses. |
| 31 | `ex:l4-scene-histogram-reading` | merge | `ex:l4-hist-normal-chart`, `ex:l4-histogram-reading-reading-1` | L4-live S13/7 | Lesen der Balken im selben Entdeckungszustand statt neuer Szene. |
| 32 | `ex:l4-scene-histogram-skewed` | optional | `ex:l4-hist-skewed-chart`, `ex:l4-histogram-skewed-reading-1` | L4-detail D-gallery/3; live 0 | Zusätzliche Form abrufbar, kein zusätzlicher Histogrammblock. |
| 33 | `ex:l4-scene-histogram-bimodal` | merge | `ex:l4-hist-bimodal-chart`, `ex:l4-histogram-bimodal-reading-1` | L4-live S13/7 | Die aus S10 bekannte Lücke wird über Klassen sichtbar gemacht. |
| 34 | `ex:l4-scene-histogram-2d-intro` | Level5 | `ex:l4-hist-2d-chart`, `ex:l4-histogram-2d-intro-intro` | L5-candidate H2D/5; live 0 | Paare/Rechteckzählung fachlich erhalten; nicht Pflichttechnik von Level 4. |
| 35 | `ex:l4-scene-histogram-2d-reading` | Level5 | `ex:l4-hist-2d-chart`, `ex:l4-histogram-2d-reading-reading-1` | L5-candidate H2D/5; live 0 | Gemeinsames Tutorial mit 34, kein vorgezogener Kalibrationskurs. |
| 36 | `ex:l4-scene-histogram-too-coarse` | merge | `ex:l4-hist-coarse-chart` | L4-live S13/7, optionaler Breitenzustand | Grob als Vorhersage/Revelation innerhalb derselben Interaktion; kein zusätzlicher Pfadschritt. |
| 37 | `ex:l4-scene-histogram-too-fine` | merge | `ex:l4-hist-fine-chart` | L4-live S13/7, optionaler Breitenzustand | Fein als zweiter Zustand; bei Zeitknappheit nicht verpflichtend durchlaufen. |
| 38 | `ex:l4-scene-histogram-sensible-width` | merge | `ex:l4-hist-bimodal-chart`, `ex:l4-histogram-sensible-width-reading-1` | L4-live S13/7 | Gemeinsam mit 30/33/36/37 dieselben Beobachtungen; kein universell optimales Raster behaupten. |
| 39 | `ex:l4-scene-histogram-origin` | Level5 | `ex:l4-hist-origin-chart` | L5-candidate H-bins/4; live 0 | Ursprungseinfluss vertiefend; im Kern nur ein kurzer Warnsatz zu Darstellungswahl. |
| 40 | `ex:l4-scene-histogram-rules` | Level5 | `ex:l4-hist-rules-formula`, `ex:l4-histogram-rules-points` | L5-candidate H-rules/6; live 0 | FD/Scott/Sturges samt Legende erhalten, keine drei Regeln im Live-Einstieg. |
| 41 | `ex:l4-scene-histogram-rule-example` | Level5 | `ex:l4-hist-adjustable-chart`, `ex:l4-histogram-rule-example-reading-1` | L5-candidate H-rules/6; live 0 | Generische Binsteuerung weiter nutzbar; Regelauswertung gehört zur Vertiefung. |
| 42 | `ex:l4-scene-histogram-variable-width` | Level5 | `ex:l4-hist-density-formula`, `ex:l4-histogram-variable-width-points` | L5-candidate H-density/5; live 0 | Vollständige Flächennormierung nicht zur Level-4-Pflicht machen. |
| 43 | `ex:l4-scene-unequal-sort` | Level5 | `ex:l4-unequal-sort` | L5-candidate H-density/3; live 0 | Achtwerte-Rechenweg unverändert als vertiefende Konstruktion. |
| 44 | `ex:l4-scene-unequal-interpolate` | Level5 | `ex:l4-unequal-interpolate` | L5-candidate H-density/5; live 0 | Interpolierte adaptive Grenzen mit Konvention erhalten. |
| 45 | `ex:l4-scene-unequal-density` | Level5 | `ex:l4-unequal-density`, `ex:l4-unequal-chart` | L5-candidate H-density/5; live 0 | Gleiche Flächen trotz verschiedener Höhen vollständig nachvollziehbar halten. |
| 46 | `ex:l4-scene-histogram-variable-construction` | Level5 | `ex:l4-hist-adaptive-chart` | L5-candidate H-adaptive/5; live 0 | 100er-Anwendung des Rechenkerns, kein weiterer Live-Block. |
| 47 | `ex:l4-scene-histogram-variable-use` | Level5 | `ex:l4-hist-adaptive-chart`, `ex:l4-histogram-variable-use-reading-1` | L5-candidate H-adaptive/3; live 0 | Nutzen/Kosten adaptiver Grenzen neben Konstruktion, Ressourcen erhalten. |
| 48 | `ex:l4-scene-histogram-lab` | tutorial | `ex:l4-hist-lab-task`, `ex:l4-hist-lab-code` | L4-tutorial T-hist/15; live 0 | Kurzer Einstieg plus Vollcode; Paketbezug nicht mitten im Hörsaal herunterladen. |
| 49 | `ex:l4-scene-ecdf-question` | merge | `ex:l4-ecdf-question` | L4-live S07/6 | ECDF durch Schwellenwertfrage motivieren, nicht durch noch unbekannte Binregeln. |
| 50 | `ex:l4-scene-ecdf-concept` | keep | `ex:l4-ecdf-concept`, `ex:l4-formula-empirical-cdf` | L4-live S07/6 | Zählen → kumulative Treppe, Formel erst nach Beobachtung; binfrei und empirisch. |
| 51 | `ex:l4-scene-ecdf-worked` | merge | `ex:l4-ecdf-worked`, `ex:l4-ecdf-small-chart`, `ex:l4-qc-reference` | L4-live S07/6 | Ties bei 4 durch bereits vorhandene interaktive `ex:l4-count-chart`/`ex:l4-ecdf-chart` erfahrbar machen; statische Variante bleibt. |
| 52 | `ex:l4-scene-ecdf-river` | optional | `ex:l4-ecdf-river-chart`, `ex:l4-ecdf-river`, `ex:l4-large-river` | L4-detail D-ecdf/5; live 0 | Chemische Übertragung und Intervallzählung erhalten, keine dritte ECDF-Pflichtszene. |
| 53 | `ex:l4-scene-ecdf-shapes` | optional | `ex:l4-ecdf-shapes-chart`, `ex:l4-ecdf-shapes` | L4-detail D-ecdf/4; live 0 | Vierkurvengalerie nicht vor quantitative Formbegriffe schieben. |
| 54 | `ex:l4-scene-ecdf-crossing` | optional | `ex:l4-ecdf-shapes-chart`, `ex:l4-ecdf-crossing` | L4-detail D-ecdf/4; live 0 | Kreuzung und schwellenabhängige Rangordnung abrufbar im selben Vergleich. |
| 55 | `ex:l4-scene-ecdf-inverse` | keep | `ex:l4-ecdf-inverse`, `ex:l4-ecdf-river-chart`, `ex:sample-quantile-type-1`, `ex:sample-quantile-type-7` | L4-live S08/6 | Eigene inverse Frage; Kernvergleich zunächst an QC7, vorhandene 50er-Rechnung als Detail erhalten. |
| 56 | `ex:l4-scene-applied-mean` | keep | `ex:l4-applied-mean`, `ex:l4-applied-mean-formula`, `ex:l4-applied-mean-legend` | L4-live S14/4 | Bekannte Lage als Erwartungswert andocken; keine Wiederholung eines ganzen Mean-Levels. |
| 57 | `ex:l4-scene-mean-matrix` | merge | `ex:l4-mean-matrix`, `ex:l4-mean-matrix-title` | L4-live S14/4 | Mittelwertmarkierung auf fokussiertem Vergleich; vollständige 3×3-Matrix bleibt Skript. |
| 58 | `ex:l4-scene-applied-variance` | merge | `ex:l4-applied-variance-formula`, `ex:l4-applied-variance-legend`, `ex:empirical-central-moment` | L4-live S14/4 und S15/5 | Zentralisieren/Divisor in Brücke integrieren, nicht weitere Varianzvorlesung. |
| 59 | `ex:l4-scene-variance-matrix` | keep | `ex:l4-variance-matrix`, `ex:l4-variance-matrix-title` | L4-live S15/5 | Frage nach Einheiten/Standardisierung und gleicher Streuung; drei Serien, eine Darstellung statt neun Panels. |
| 60 | `ex:l4-scene-applied-skewness` | keep | `ex:l4-applied-skewness-formula`, `ex:l4-applied-skewness-legend`, `ex:l4-applied-skewness` | L4-live S16/5 und S17/4 | Erst signierte Beiträge, dann dimensionslosen Vergleich erklären; E[ ]/empirisch getrennt. |
| 61 | `ex:l4-scene-skewness-matrix` | merge | `ex:l4-skewness-matrix`, `ex:l4-skewness-matrix-title` | L4-live S17/4 | Vergleich als Fokuszustand, nicht als statische 3×3-Code-/Beschriftungswand. |
| 62 | `ex:l4-scene-applied-kurtosis` | keep | `ex:l4-applied-kurtosis-formula`, `ex:l4-applied-kurtosis-legend`, `ex:l4-applied-kurtosis` | L4-live S19/5 | Neue Frage: Was geschieht mit großen standardisierten Abständen unter vierter Potenz? |
| 63 | `ex:l4-scene-kurtosis-matrix` | keep | `ex:l4-kurtosis-matrix`, `ex:l4-kurtosis-matrix-title` | L4-live S20/8 | Vergleich/Interpretation von K und Exzess nach Beitragsverständnis; Peak-/Tail-Kurzschluss explizit prüfen. |
| 64 | `ex:l4-scene-skew-zero` | keep | `ex:l4-skew-zero`, `ex:l4-correction-zero-skew-symmetry` | L4-live S18/4 | Eigenständige Vorhersage: Null-Schiefe erzwingt keine Spiegelsymmetrie. |
| 65 | `ex:l4-scene-moment-lab` | tutorial | `ex:l4-moment-code`, `ex:l4-moment-lab`, `ex:l4-moment-lab-title` | L4-tutorial T-moments/20; kurzer abgeleiteter Versuch L4-live S21/6, Synthese S22/4 | Vollcode nicht als Live-Folie; Kurzexperiment und Auswahlfrage unterscheiden. Letzter-Variable-Test vor Einsatz korrigieren und alle Serien prüfen. |

## Außerhalb der 65 aktiven Szenen schon vorhandene Wiederverwendungsquellen

Dies sind **keine zusätzlichen alten aktiven Szenen** und keine heimliche
Vergrößerung des Zielpfads:

| Ressource/Scene-IRI | Geplanter Gebrauch | Wichtige Grenze |
|---|---|---|
| `ex:l4-opening-example`, `ex:l4-opening-data-a`, `ex:l4-opening-data-b`, `ex:l4-opening-series-a`, `ex:l4-opening-series-b` | S01, danach S02–S06 mit jeweils deklarierter Auswahl | Vorhandene 5er-Werte und Platzierungen erhalten. Aktuelle `ex:l4-gap-chart` referenziert vier 100er-Serien; nicht global auf A/B umschreiben. Ein neuer, quellenverknüpfter Chartselektor wäre nach Freigabe nötig. |
| `ex:l4-scene-observation-order`, `ex:l4-order-chart` | Verhalten für S02 übernehmen | Bestehende Konfiguration verwendet QC7, nicht A/B5; generische Sortierfunktion wiederverwenden, Selektoren getrennt authoren. |
| `ex:l4-scene-observation-count`, `ex:l4-count-chart` | S07, Schwellenwertzählung | `ex:l4-qc-reference` mit sieben Werten und Ties, kein Umdeuten der A/B-Daten. |
| `ex:l4-scene-observation-ecdf`, `ex:l4-ecdf-chart` | S07/S08 | Vorhandene interaktive Treppenfunktion; die geprüften statischen Varianten bleiben erhalten. |
| `ex:l4-qc-reference`, `ex:l4-qc-extreme`, `ex:l4-order-boxes`, `ex:l4-quartiles-table`, `ex:l4-iqr-example-table` | S07–S09 und S11 | QC7 als zweiter ausdrücklich angekündigter Handrechenfall; Änderung 7 → 30 mg/L, keine reale Laborbeobachtung. |
| `ex:l4-def-raw-moment`, `ex:l4-def-central-moment`, `ex:l4-def-standardized-central-moment` | S14/S15 als begriffliche Verknüpfung | Keine Reaktivierung der kompletten früheren raw1–raw4-Folienserie. |

## Vollständigkeits- und Freigaberegel

Nach Freigabe muss jede der 65 alten Scene-IRIs entweder auf einen neuen aktiven
Block oder auf einen zugänglichen Detail-/Tutorial-/Kandidatenpfad verweisen.
„Nicht aktiv“ reicht nicht als Auffindbarkeitsnachweis. Die vollständige bisherige
65er-Auswahl soll als gesonderte Bestands-/Skriptprojektion erhalten bleiben,
bevor `cd:hasStep` des aktiven Pfads umgestellt wird. Die Tabellen oben sind
Planungsdokumentation, **noch keine implementierten RDF-Verknüpfungen**.
