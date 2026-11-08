# Level 6: Statistical Tests

## Aktueller Stand — 2026-11-08, zweite Nutzerrevision (22 Punkte)

52 Folien, 16 Formeleinheiten mit vollständigen Same-Slide-Legenden, unabhängiges
Script mit zehn Kapiteln und sieben Charts; der englische Sprechertext hat
52 passende Abschnitte. Aktiver Pfad: `ex:l6s-p01` bis `ex:l6s-p52`.

- Ein Entscheidungsbaum mit Positiv/Negativ und vier Ausgängen; drei Seehypothesen
  und ein großflächiger Comic statt dichtem Zahlenreport.
- α-Regler mit festen H₀-/spezifizierten H₁-Verteilungen, beweglicher Grenze und
  Typ-I-/Typ-II-Flächen. ν durchgängig in aktiven Texten, Tabellen und Formeln.
- CI-Lehre, p-hacking-Folie, F-Übersicht und F-Tabelle aus der aktiven Lehre entfernt.
- Drei-Analyten-Schema; Experimentaufbau als tastaturbedienbare Erklärung unter
  der Unabhängigkeitsformel; wiederverwendbarer TriG-gesteuerter Paarvergleich.
- U-Labelpermutation und 32 Wilcoxon-Vorzeichenmuster erklärt; Cohen-d-Ergebnis
  anhand einer Referenztabelle interpretiert; Mehrfachausreißer/Generalized ESD.
- 29 kleine NIST-Fußnoten (zwölf unterschiedliche HTTPS-Ziele), neue Tabs erst
  nach Klick. Quellen und optionale Abbildungen bleiben Teil des Scripts.

Neue wiederverwendbare Mechanismen: `docs/adr/0028-pairwise-score-and-supporting-material.md`.
Dispositionen und Reviews: `chemometrics-level6-review.md` sowie
`chemometrics-level6-visual-review.md`. Frühere Nachweise unten sind historisch.
Keine vollständigen npm-Tests, kein Produktionsbuild, kein aktueller PDF-Nachweis,
kein Commit, Push oder Publizieren. Nutzerabnahme bleibt erforderlich.

## Vorheriger Stand — 2026-11-07, 41-Punkte-Revision

Die aktuelle Vorlesung umfasst **52 Folien und 16 Formeleinheiten** mit
vollständigen, strukturierten Symbollegenden. Das unabhängig gegliederte Script
hat **10 Kapitel und sechs Charts**. Der englische Sprechertext enthält 52
passende Abschnitte: `docs/chemometrics-level6-speaker-notes.md`.

Entscheidungsbäume, See-Rechenvergleich, t-/F-Trennfolien, neue Recovery-,
Oxidationsbatch- und NIR/HPLC-MS-Beispiele sowie einheitliche Formel/Versuchs-
und Diagramm/Report-Zweispalter ersetzen die vorherige Struktur. Reporttabellen
sind authored R-style mimics, keine behaupteten Live-Ausgaben. ANOVA, separater
Power-Abschnitt, R-Labore, Replikationsaufgabe, Abschlussbericht und separater
Grubbs-Ergebnisplot sind nicht im aktiven Pfad. Frühere Entwurfsressourcen bleiben
unselektiert erhalten.

Reviewverlauf und Zuordnung aller 41 Punkte:
`docs/chemometrics-level6-review.md`. Aktueller lokaler Prüfumfang: fokussierte
Inhalts-/Rechen- und Rendererprüfungen, Browseransicht in beiden Themes,
Tastaturbedienung und mobiles Script. Keine vollständigen npm-Tests, kein
Produktionsbuild, kein aktueller PDF-Nachweis, kein Commit/Push/Publizieren.
Die menschliche Folienabnahme steht aus.

Vollständiger Einzelbildreview nach Nutzerkritik, einschließlich Größen- und
Lesbarkeitskorrekturen: `docs/chemometrics-level6-visual-review.md`.

## Historischer Plan und Reviewverlauf (durch obigen Stand abgelöst)

Die folgenden Angaben mit 57 Folien, 19 Formeln, ANOVA, Power und R-Laboren
dokumentieren frühere Arbeitsstände. Sie sind **nicht** die aktuelle Auswahl
oder ein Nachweis für den jetzigen Stand.

Owner-requested local authoring, based on published Level 0–5 (`50d8996b`).
Branch: `work/level6-statistical-tests`. No publication or workflow-state changes
are part of this task. The historical dispatcher assignment is not claimed.

## Delivery and teaching contract

Region 3 is the existing `offering-section-chemometrics-similarity-analysis`.
English audience content; German review notes. Canonical content is authored in
named-graph TriG, with independent thematic Script chapters and the existing
HTML/LaTeX projections. Reuse the existing formula/legend, card, table, diagram,
chart, optional-R and exercise components. No scene-specific renderer exceptions.

Every displayed formula includes its complete authored same-slide symbol legend,
linked by `dct:hasPart`. Every Script material has its own caption and explicit
prose reference. Figure-specific findings belong to the caption, not duplicate
panels below it. G1–G7, F1–F6 and S0–S7 in
`teaching-authoring-rules-draft.md` are the editorial checklist.

## Narrative and complete requested scope

1. **An analytical question needs a sampling model.** Certified reference material,
   river monitoring and independent ecotoxicology vessels; hypothesis, H0/H1,
   experimental unit, prespecified direction and inference scope.
2. **Calibrate a decision before looking at the result.** Alpha, repeated-sampling
   type-I error, degrees of freedom, observed p-value, rejection and retention;
   compatibility and estimation rather than posterior probability of H0.
3. **Compare a mean with a reference.** Student t construction, reference tables,
   one-sample test, upper/lower/two-sided directions, worked CRM recovery example.
4. **Choose a design before comparing two means.** Independent pooled t, paired
   differences, Welch standard errors and fractional degrees of freedom; positive
   controls and independent vessels, unequal precision, site matching.
5. **A family of questions needs a family error rule.** Test cascades, why a
   variance pretest is a poor switch for pooled/Welch, Bonferroni, Holm, planned
   families and prespecified gatekeeping; a global test alone does not license
   unadjusted pairwise tests.
6. **F references compare variability explained and left over.** Numerator and
   denominator df, reference tables, independent Normal variance ratio, the
   one-sample-regression special case, nested models and global one-way ANOVA.
7. **Chi-square tests answer distinct questions.** Fixed-reference variance,
   Pearson goodness-of-fit and contingency-table independence; expected counts,
   fitted-parameter df, exact/Monte Carlo alternatives for sparse counts.
8. **Ranks preserve order while changing the target.** Independent Mann–Whitney U,
   ranks/ties, equal-distribution null versus a common-shape location model;
   paired Wilcoxon signed ranks, symmetric differences, zeros and ties; sign-test
   distinction. Detection-limit ties and censored concentrations require care.
9. **Power connects the planned effect with the design.** Beta and power for a
   specified alternative, sample size, variability, one/two-sided direction,
   experimental-unit replication; prospective planning rather than observed power.
10. **An effect needs a scale and uncertainty.** Native-unit differences, Cohen d
    versus paired dz, Hedges correction context, confidence intervals and Cliff's
    delta including ties and orientation. Ecological importance is contextual.
11. **Investigate a surprising result before exclusion.** Grubbs single-outlier
    Normal-model test, correct critical value, masking/swamping, no repeated
    unadjusted deletion; raw data, records and sensitivity analysis retained.
12. **Make and report a defensible choice.** Several analytic/environmental/
    ecotoxicological cases, worked interpretations, exercises with authored
    answers, reproducible optional R and a reporting checklist.

## Scientific conventions to verify

- Equality point null for a two-sided mean test; boundary calibration for
  H0: mean <= reference versus H1: mean > reference (and its lower-tail analogue).
- Welch is the ordinary independent-means choice when equal variances are not
  justified; pairing depends on design, not a post-hoc correlation threshold.
- Independent experimental units, not technical injections, determine n.
- Classical variance-ratio and ANOVA exact F references assume independent Normal
  errors; one-way ANOVA also uses a common within-group variance.
- Nested-model F uses a reduced model contained in the full model, the same
  observations, positive residual df, and a prespecified joint null.
- Signed-rank shift inference needs symmetric difference distributions; rank-sum
  median interpretation needs an additional common-shape/location-shift model.
- Power and p-values do not supply probabilities that either hypothesis is true.
- Grubbs assumes one suspect extreme among otherwise iid Normal observations;
  environmental high values retain their identity and may be scientifically real.
- Synthetic datasets, units, design, tails, alpha, approximation/exact convention
  and every displayed numerical result must be traceable and reproducible.

## Visual and verification plan

Use varied evidence: paired site lines, independent dot/box plots, null-reference
tail plots, decision-error tiles, t/F critical-value tables, ANOVA sums-of-squares
tables, contingency counts, rank allocations and a Cliff pair-comparison grid.
Coloured headers accompany visible labels; colour never carries meaning alone.
SVGs have title/description and passive local content. Captions state what is
drawn and which findings follow from the illustrative values.

Deterministic tests cover exact Region-3 binding and course order, complete topic
coverage, scientific calculations, all formula legends, Script resource coverage,
named-graph provenance and optional R. Generate the preview through the existing
offering/path pipeline. Capture **every** slide in light/dark desktop views and
check narrow reading mode, Script, PDF, keyboard disclosure, overflow and visual
density. Inspect screenshots rather than treating a zero-overflow count as an
editorial acceptance. Record corrections and outstanding limits here.

## Status — lokaler Reviewstand, 2026-11-06

### Aktuell: Durchsprech-Review in den Folien umgesetzt

Nach dem vollständigen Sprechertext wurden die festgestellten Brüche auf
ausdrücklichen Auftrag direkt in den Folien behoben, nicht nur im Vortrag erklärt.

- Recovery- und Pearson-Überschriften passen jetzt zu den ungerichteten Tests;
  auch der Algen-Einstieg fragt neutral nach Veränderung.
- Diclofenac upstream/downstream, generische Konzentration an denselben Orten
  zu zwei Zeiten und separater Assay in a.u. sind sichtbar getrennte Fälle.
  Die drei t-Designs sind bereits in ihren Überschriften erkennbar.
- df leiten zur p-Referenz über; ANOVA ist zunächst eine Vorschau. Holm zeigt
  die geordneten Vergleichsgrenzen und die Stoppregel. F-Tabelle und folgender
  Präzisionsfall unterscheiden ihre df ausdrücklich.
- Das erste Rangraster erklärt U ohne vorgezogenen Delta-Begriff. Beim späteren
  Rückgriff entsteht daraus die Effektgröße. Die Ausreißerfrage nennt bereits
  die sechs Nitratwerte, bevor Statistik und Cutoff erklärt werden.
- Ein durchgehendes Berichtsbeispiel zeigt die mittlere Abnahme 2.833 mg/L mit
  **95%-Konfidenzintervall 1.026 bis 4.641 mg/L**. Berechnet aus den unveränderten
  sechs Differenzen und dem t-Quantil für fünf df; zweiseitig, unadjustiert,
  ein geplanter Kontrast, unabhängige Normaldifferenzen. Der Bericht enthält
  Teststatistik, df, p, alpha und die Grenzen von Relevanz- und Kausalaussagen.
- R-Labore erhalten nur Orientierungskommentare; alle ausführbaren Anweisungen
  bleiben unverändert. Die Kommentare machen den Überspringpfad und den
  separaten t-Power-Plan sichtbar; dieser reproduziert nicht die z-Power-Grafik.
- Sprechertext unter `docs/chemometrics-level6-speaker-notes.md` und unabhängiges
  thematisches Script sind abgeglichen. Die erste Reviewdiagnose bleibt im
  Markdown als Verlauf markiert; eine Umsetzungstabelle beschreibt den neuen Stand.

Gezielte Nachweise: **18 Level-6-Tests bestanden**; erneut 57 Folien je Theme,
19 Legendenprüfungen je Theme, 13 Scriptkapitel und sieben Scriptcharts.
Die Browserprüfung erfasst nun zusätzlich inneren Inhaltsüberlauf in festen
Kompositionsregionen. Der erste Bildreview erkannte eine zu volle Abschlussfolie;
nach Kürzung sind die drei Berichtskarten in beiden Themes vollständig sichtbar.
Finaler Browserlauf ohne erfasste Regions-/Formelüberläufe, fehlgeschlagene
Antworten oder Browserfehler; Script bei 390 px ohne horizontalen Überlauf.
Bildnachweise: `%TEMP%/opencode/level6-transitions-r2/`.

Unverändert: 57 Folien, 19 Formeleinheiten mit vollständigen Legenden,
Beobachtungen, Methoden, interaktive alpha-/QC-Steuerung; keine Veröffentlichung.
Gesamttests, Produktionsbuild und neue PDF-Abnahme bleiben zurückgestellt.

### Aktuell: übrige Folien im Stil des Einstiegs überarbeitet

Auftrag: nicht nur kürzen, sondern Fragen aus Messsituationen entwickeln.
Die ersten zwölf Folien bleiben als Stilreferenz erhalten. Die übrigen
45 Folien wurden redaktionell durchgesehen: konkrete Überschriften,
kurze Handlungsschritte, wiederkehrende Beispiele und sichtbare Grenzen
der Schlussfolgerung statt abstrakter Fachwortketten.

#### Änderungen

- 17 spätere Formel-Lesehilfen haben jeweils zwei Karten mit drei kurzen
  Stichpunkten: Was wird verglichen? Was steht oben/unten? Wie lesen wir
  das Ergebnis? Alle 19 Formeln behalten ihre vollständigen Legenden.
- Zwölf neue lokale SVGs erklären Testplanung, zwei F-Fragen, SD/Varianz,
  Kalibrationsgewinn, drei Chi-Quadrat-Fragen, Partikelzahlen, Gefäßzahlen,
  Rangordnung, Vorzeichenränge, Effekt versus p, Ausreißerprüfung und
  unabhängige Gefäße. Zusammen mit Wiederverwendungen werden 15 spätere
  Folien mit zusätzlichem Bildmaterial ausgestattet.
- Bilder sind Erklärungen, keine dekorativen Stockbilder. Zahlenbilder
  verwenden die bestehenden synthetischen Beispiele; schematische Formen
  werden als solche benannt. Beobachtungen, R-Code, Formeln und Rechenmethoden
  sind unverändert. Partikelbalken verwenden eine gemeinsame Zählskala;
  SD-Längen und Varianzflächen stellen unterschiedliche Verhältnisse dar.
- Tabellen- und Ergebnisinterpretationen verwenden „do not reject“ statt
  einer vermeintlichen Bestätigung von H₀. Signifikanz wird nicht als Größe,
  Relevanz, Kausalität oder Nachweis einer Fehlerursache dargestellt.
- Power erhält eine konkrete Lesestelle: bekannte SD 0.5 µg/L, wahre
  Abweichung 0.25 µg/L; z-Test-Power bei n 5/10/20 etwa 20.1/35.3/60.9%.
  Die Abgrenzung zur t-Test-Power bleibt ausdrücklich bestehen.
- Das unabhängige Script erklärt die neuen Bilder in zusammenhängender
  Prosa mit expliziten Materialverweisen. Es bleibt bei 13 thematischen
  Kapiteln, nicht 57 ausgeschriebenen Folienkommentaren.

#### Review aus zwei Perspektiven

Dies sind redaktionelle Prüfperspektiven, keine Evaluation mit realen
Studierenden und kein Nachweis pädagogischer Wirksamkeit.

| Themenblock | Dozentensicht | Studierendenperspektive / konkrete Korrektur |
|---|---|---|
| t-Verfahren | Unabhängige Gruppen, Paarung und gemeinsame Varianz sauber trennen. | Gleiche Flussstellen zweimal → erst innerhalb des Ortes subtrahieren; größere Streuung → eigene Unsicherheit bei Welch. |
| Testfolgen / Bonferroni | Gesamte Teststrategie vor Ergebnissen festlegen, keine Varianz-Vortest-Automatik. | Drei benannte Fragen; durch drei teilen **oder** p mit drei multiplizieren, nicht beides. |
| F / Kalibration / ANOVA | Zwei geschätzte Varianzen versus Modellvergleich auseinanderhalten; Voraussetzungen sichtbar. | SD-Verhältnis 2 ist Varianzverhältnis 4; Fehlerbalken 12 → 5 erklären den Nutzen eines Zusatzterms. |
| Chi-Quadrat | Bekannte Varianz, fester Kategorienmix und Unabhängigkeit nicht vermengen. | 60 Partikel ergeben erwartete Zahlen 30/18/12; 22 von 40 betroffenen Gefäßen erklären 11/9 je Gruppe. |
| Rangverfahren | Verteilungsnull, Unabhängigkeit, Symmetrie und Tie-Konvention erhalten. | Ein X–Y-Vergleich zuerst; zwei gleiche Werte bleiben zwei Messungen. Wilcoxon zeigt Größe → Rang → Vorzeichen. |
| Power / Effekt | Prospektive Alternative, native Einheiten und Unsicherheit trennen. | Detektionschance versus „Wie viele mg/L?“; kleines p ist keine Effektgröße. |
| Grubbs | Ein-Ausreißer-Modell und Auswahl des Extremums erklären. | Wert behalten → Aufzeichnungen prüfen → Entscheidung begründen; Flag ist keine Löschanweisung. |
| Aufgabe / Bericht | Eigenständige Begründung verlangen und Ergebnis vollständig kommunizieren. | Die erste Gefäßgrafik verriet n ausdrücklich: korrigiert zur Denkhilfe mit Frage statt eingeblendeter Lösung. Script enthält die Auflösung. |

#### Bildreview und gezielte Nachweise

- Vorher-/Nachher-Kontaktbögen aller 57 Folien in beiden Themes;
  ausgewählte neue Bilder und textreichere Folien zusätzlich in voller Größe
  betrachtet. Bilder besitzen beschriftete helle Zeichenflächen für beide
  Themes, Alternativtexte und SVG-Titel/-Beschreibungen. Farbe allein trägt
  weder Gruppenidentität noch die Entscheidung.
- Aktueller Browserlauf: **114 Folienbilder**, 38 Tastaturprüfungen der
  vollständigen Formellegenden, keine erfassten Regions-/Formelüberläufe,
  keine fehlgeschlagenen Antworten oder Browserfehler. Script mit sieben
  Charts, 13 Kapiteln und bei 390 px ohne erfassten horizontalen Überlauf.
- **16 gezielte Level-6-Tests bestehen**. Neue Tests prüfen die kurzen
  Karten, ausgewählte Bildbindungen, zugängliche lokale SVGs, numerische
  Balkenverhältnisse und die nicht vorweggenommene Aufgabenlösung.
- Bildnachweise: `%TEMP%/opencode/level6-editorial-r1/`, `level6-editorial-r2/`;
  finaler Browserlauf nach Aufgaben-Korrektur: `level6-editorial-r3/`.
- Restgrenzen: lange Formeln und die optionalen R-Labore benötigen weiterhin
  bewusste Erklärung/Arbeitszeit. Die vollständigen Softwareglossare bleiben
  technisch; die R-Folien sind als optional markiert. Die Präsentation ist
  keine einzige kurze Sitzung ohne thematische Pausen.
- Keine vollständigen npm-Tests, kein Gesamtbuild, kein PDF-Neubau und keine
  Veröffentlichung. Frühere PDF-Nachweise sind nicht aktuell. Vor einer
  Veröffentlichung fehlen weiterhin die ausdrücklich zurückgestellten
  Gesamtprüfungen einschließlich Produktionsassets und PDF.

### See-/Hypothesenrevision — nach der Standby-Pause zur Durchsicht bereit

- Einführung: H₀ enthält den Gleichheitsfall (=, ≤, ≥), H₁ nicht (≠, >, <).
  Die Aussage bezieht sich ausdrücklich auf die hier behandelten klassischen
  Vergleiche, nicht auf sämtliche denkbaren statistischen Hypothesen.
- Separate See-Folie nach der Richtungsfolie; der Pfad hat nun 57 Schritte.
  Regel A verlangt Evidenz für Dicke oberhalb des Minimums vor dem Losgehen.
  Regel B geht bei Nicht-Ablehnung der Annahme „at or above minimum“ los.
  Beide Karten zeigen die jeweils anderen praktischen Typ-I-/Typ-II-Fehler
  und markieren, welchen Fehler Alpha begrenzt.
- Die anfangs unpräzise Formulierung „insufficient thickness“ ist korrigiert:
  Bei A ist Typ I ein Losgehen trotz Dicke nicht oberhalb des Minimums.
  Das Script erklärt den konservativen Gleichheitsfall und die Abgrenzung
  von „Dicke minus Minimum“ zu Dicke selbst.
- Eigene lokale See-Illustration und vier Flaschen-/Alarmbilder für die Matrix;
  beide sind mit Alternativtext, Caption und unabhängigem Script-Verweis
  eingebunden. Kein Tracking oder externe Bildquelle.
- Keine reale Eisfreigabe: weder sichere Mindestdicke noch reale Messdaten.
  Nicht-Ablehnung ist kein Sicherheitsnachweis; mittlere Dicke schließt lokale
  Schwachstellen nicht aus. Das Script erläutert die Grenzen des Modells.
- Nach Bildreview wurde die abgeschnittene Hinweisbox von der See-Folie entfernt;
  die Kernaussage bleibt in Caption/Karten, die Einzelheiten im Script.
- **14 gezielte Level-6-Tests bestehen.** Der begrenzte Browserlauf prüft zwölf
  Folien je Theme, Bildladung, Regionsgrenzen, Formellegenden per Tastatur,
  vier Slider und Reset. Beide neuen Bilder erscheinen auch im Script;
  bei 390 px wurde kein horizontaler Script-Überlauf erfasst. Keine Browserfehler.
  Geänderte Folien in beiden Themes in voller Größe angesehen.
  Aktuelle Bildnachweise: `%TEMP%/opencode/level6-intro-review-r5/`.
- Keine Gesamttests, kein Produktionsbuild und kein neues PDF durchgeführt.
  Die frühere PDF-Evidenz bleibt für die aktuelle Revision veraltet.
  Alles weiterhin lokal, ohne Commit, Push oder Veröffentlichung.

Implementiert sind **57 Folien**, 15 Konzepte, **19 Formeln mit vollständigen
Legenden** und ein unabhängig gegliedertes Script mit **13 Kapiteln und
beschrifteten Materialien**. Beobachtungsdiagramme und Lehr-SVGs,
farbige Tabellen/Karten, zwei ausführbare R-Beispiele und eine Aufgabe mit
Erwartungshorizont verwenden die gemeinsamen Komponenten. Level 6 ist die siebte
Kursplatzierung und die zweite Einheit in Region 3. Alle Fallbeispiele sind
synthetisch; es werden keine realen Umweltbefunde oder Wirksamkeiten behauptet.

### Aktuelle Einstiegsrevision bis zum Ein-Stichproben-t-Test

- Kurze englische Titel und Stichpunkte führen über QC (Sollwert 50 µg/L,
  Mittelwert 48.5 µg/L), Diclofenac vor/nach einem Industriepark und Algenwachstum
  zu Hypothesen und Entscheidungen. Richtungen sind komplementär; die vier
  Entscheidungsausgänge unterscheiden Fehler erster und zweiter Art.
- Ein Alpha-Schieberegler zeigt den Zielkonflikt am ausdrücklich illustrativen
  Amoxicillin-Grenzwert 1 µg/L. Bei unveränderten 4000 simulierten Studien beträgt
  Beta für Alpha 5%, 1% und 0.1% jeweils 25.12%, 56.27% und 87.55%.
- Drei QC-Schieberegler verändern Mittelwert, Stichproben-SD und n. Der Anfang
  (48.5 µg/L, 2 µg/L, n = 6) ergibt t = −1.8371, df = 5, p ≈ 0.1256.
  Die Nullkurve und die schattierten Enden verwenden dieselbe t-Dichte.
- Fehlermatrix und Alpha-Experiment sowie t-Formel und t-Experiment stehen jeweils
  auf getrennten Folien. Die frühe t-Endenformel und Referenztabelle sind nicht
  mehr ausgewählt; spätere Themen bleiben unverändert. Mit der See-Folie sind es
  jetzt 57 Folien.
  Die ersten drei unabhängigen Script-Kapitel sind entsprechend überarbeitet.
- Vor der See-Revision: zwölf Level-6-Python-Tests, vier t-Experiment-Tests
  und `npm run typecheck` bestehen. Der begrenzte Browsercheck prüft elf Folien je
  Theme, vier sichtbare Slider, Livewerte, Tastatursteuerung und Reset ohne
  Browserfehler. Kontaktbögen und ausgewählte Vollbilder wurden angesehen.
  Nachweise: `%TEMP%/opencode/level6-intro-review-r2/`.
- Auf ausdrücklichen Nutzerwunsch keine weiteren vollständigen `npm test`-Läufe
  während dieser redaktionellen Arbeit. Der eigene noch laufende Gesamtlauf wurde
  beendet. Gesamtvalidierung ist erst vor Veröffentlichung vorgesehen; gezielte
  Prüfungen sind keine Gesamtfreigabe. Es wurde nichts veröffentlicht.

### Frühere Sichtprüfung und Korrekturen (vor der Einstiegsrevision)

- Alle 56 Folien in beiden Themes aufgenommen und auf Kontaktbögen angesehen;
  problematische Formeln, Zählbeispiele und Grafiken zusätzlich in voller Größe.
  Review-Verzeichnis: `%TEMP%/opencode/level6-review-v4/`.
- Die zunächst abgeschnittene gepoolte t-Formel sowie die Welch-Einheit sind
  mehrzeilig gesetzt. Die Prüfung erfasst nun tatsächliche KaTeX-Grenzen.
- 19 Formel-Folien haben eigenständige Lese-/Entscheidungshilfen als gemeinsame
  Kartenkomposition erhalten. Die Gestaltung lässt Platz zum Erschließen der
  Formel und zum Öffnen der vollständigen Legende; sie ist kein Flächenfülltest.
  Kurze Übersichtsfolien bleiben bewusst kompakter als Daten- und Formel-Folien.
- Die Cliff-Matrix besitzt eine eigene helle Zeichenfläche, damit alle Achsen-
  und Zeilenbeschriftungen auch im Dark Theme lesbar sind.
- Eine prospektive Powergrafik ergänzt die Beobachtungsdiagramme. Ihr explizit
  bekannter-SD-Normalmodell-z-Test ist nicht mit t-/Welch-Power gleichgesetzt.
  Ein deterministischer Test prüft jeden gezeichneten Kurvenpunkt.
- Browserlauf v4: 112 Folienbilder, keine erfassten Formel-/Regionsüberläufe,
  keine Browserfehler oder fehlgeschlagenen Antworten. Script bei 390 px ohne
  horizontalen Überlauf, alle fünf Datencharts montiert.
- 38 Tastaturprüfungen in beiden Themes: `Symbols` lässt sich per Enter öffnen
  und schließen; die vollständige Legende bleibt auf derselben Folie sichtbar.
  Diese Prüfungen sind inzwischen in `scripts/check_level6_browser.cjs` integriert.
- PDF v4 mit 23 Seiten gerastert und vollständig über Kontaktbögen geprüft:
  kein Text außerhalb der Seite und keine Ersatzzeichen. Dabei wurde ein
  getrennter Formel-/Legendenumbruch entdeckt. Der gemeinsame LaTeX-Renderer
  hält gewöhnliche Formeleinheiten jetzt in einer unteilbaren Box zusammen;
  mehrstufige Herleitungen bleiben umbrechbar. PDF v5 besitzt weiterhin 23 Seiten;
  der zuvor getrennte Nested-F-Block ist auf Seite 10 vollständig zusammen.
  Die PDF-Textextraktion bestätigt für alle 19 Formeleinheiten, dass die
  Formelbeschriftung und das Ende ihrer vollständigen Legende auf derselben
  Seite stehen. Keine Seite enthält ein erfasstes Ersatzzeichen oder Text
  außerhalb ihrer Seitengrenzen.
  Raster: `%TEMP%/opencode/level6-pdf-review-v5/`.

### Frühere gezielte Prüfungen (vor der Einstiegsrevision)

- Elf Level-6-Tests: Kursbindung, Themen, Legenden, Script-Unabhängigkeit,
  Rohbeobachtungen, Testzahlen, Rang-Ties, exakte Vorzeichenenumeration und Power.
  Zusätzlich sind alle elf Quellen mit ihren unterstützten Ressourcen explizit
  rückverknüpft; auch der bestehende projektweite Quellen-Test besteht gezielt.
- 18 LaTeX-Renderer-Tests einschließlich der bisherigen Level-0–5-Projektionen,
  neuer Operator-/β-Unterstützung und unteilbarer gewöhnlicher Formeleinheiten.
- Vier Kursbundle-, 15 Static-Build-Vertrags- und drei Level-5-Overworld-Tests.
- Beide R-Quellen im lokal ausgelieferten, netzwerkabgeschotteten webR tatsächlich
  ausgeführt. CRM p = 0.01722; gepaart p = 0.01003; Welch p = 0.02089; globales
  F p = 0.001; Pearson p = 0.7575 bzw. 0.05653; signed rank p = 0.1875;
  Cliff −0.7777778; Grubbs 2.021923 gegenüber 1.887145. Der prospektive
  R-Zweistichproben-t-Aufruf gibt Power 0.5377573 bei 20 Einheiten je Gruppe.
  Protokoll: `%TEMP%/opencode/level6-r-results.json`.

### Noch offene Gesamtfreigabe

Die alten SHACL-Befunde sind keine aktuelle Erfolgsevidenz. Nach der Korrektur
von `cd:language` zu `cd:programmingLanguage` wurde zusätzlich der bestehende
DotPlot-Vertrag wirksam: ganzzahlige Messwerte müssen als `xsd:decimal` authored
sein. Alle 32 betroffenen neuen Messwerte sind numerisch unverändert als Dezimale
gesetzt; der fokussierte Test schützt diesen Vertrag. Gesamt-SHACL besteht für
den korrigierten Datensatz mit Fingerprint
`c64ddb9947d2c108016d7155567f7880a8a4c1750d1c61fcffcccebd54a73ee8`.
Vollständiges `npm test` und der siebenstufige lokale Produktionsbuild müssen
noch erfolgreich enden. Der erste Build auf dieser Quelle erzeugte fünf PDFs,
scheiterte dann jedoch an einem Edge-Timeout bei der SVG-Vektorkonvertierung.
Der Wiederholungslauf v3 erzeugte alle sechs bisherigen PDFs und deckte danach
die Produktions-Staging-Grenze auf: Neue öffentliche Grafikdateien werden nur
aus dem Git-Index kopiert. Ausschließlich die fünf neuen SVGs wurden deshalb
ohne Commit oder Push in den Index aufgenommen. Der nächste unveränderte
Buildläufe v4/v5 erreichten mit Edge bzw. normalem Chromium ebenfalls das
Browser-Prozesszeitlimit. Ein isolierter Test mit Playwrights gepinnter
Chromium-Headless-Shell konvertierte dagegen alle vier Level-6-Lehr-SVGs
erfolgreich. Für einen weiteren Buildversuch unter `dist/level6-local-review-v6`
wurde diese bereits unterstützte Einstellung verwendet:
`SCRIPT_PDF_BROWSER=C:/Users/PCUser/AppData/Local/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe`.
Es wurden weder Timeouts erhöht noch die Staging-/Validierungsregeln abgeschwächt.
Keiner dieser Buildversuche ist eine erfolgreiche Abnahme des aktuellen Stands.

Der erste vollständige `npm test`-Lauf endete mit 628 Python-Tests, drei Skips
und 19 Fehlern: 18 nutzten den vor der Dezimalkorrektur gestarteten SHACL-Snapshot;
einer deckte fehlende `supportsResource`-Quellenrückbezüge auf. Diese sind für alle
elf neuen Quellen ergänzt und durch den bisherigen sowie einen neuen Test
geprüft. Auch die anschließenden Versuche einschließlich
`dist/level6-local-review-v7` liefern keine vollständige aktuelle Abnahme.
Weitere Gesamtläufe sind nun bis vor Veröffentlichung zurückgestellt.

Der normale PDF-Knopf der Authoring-Vorschau benötigt ein passendes generiertes
Manifest. Das einzeln geprüfte PDF liegt vorerst unter
`.local/level6-script-pdf-v5/`; der vollständige lokale Kursbuild erzeugt sein
eigenes Sieben-Script-Manifest. Das PDF v5 und die oben genannten SHACL-/PDF-
Nachweise stammen von vor der Einstiegsrevision und belegen nicht deren aktuellen
Stand. Navigation und PDF-Zugang eines erfolgreichen Gesamtbuilds sind noch
separat zu prüfen. Es wurde nichts veröffentlicht, committed oder gepusht.

### Lokale Vorschau und Wiederholung

`npm run preview:level6:generate` erzeugt die Vorschau, `npm run preview:level6`
startet einen Server, falls Port 5173 frei ist. Bei laufendem Server:

<http://127.0.0.1:5173/authoring.html?preview=authoring-level6-statistical-tests&view=scroll&appearance-controls=hidden>

Für Browsernachweise `PLAYWRIGHT_MODULE` auf das installierte Playwright setzen
und `node scripts/check_level6_browser.cjs AUSGABEVERZEICHNIS` ausführen.
Für ausschließlich den aktuellen Einstieg stattdessen
`node scripts/check_level6_intro_browser.cjs AUSGABEVERZEICHNIS` verwenden.
Für ein einzelnes PDF einen frischen, eigenen Ausgabeordner angeben:

```text
node --experimental-strip-types scripts/build_script_pdf.mts --runtime apps/pitch/public/authoring-level6-statistical-tests-runtime.json --out-dir .local/level6-script-pdf-review
```

Frühe fehlgeschlagene PDF-Versuche unter `apps/pitch/public/script-pdf-level6/`
bleiben erhalten. Unbekannte Dateien werden nicht zum Wiederholen überschrieben.
