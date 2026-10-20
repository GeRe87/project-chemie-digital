# Varianz und Unsicherheit des Mittelwerts: Review der sieben Korrekturen

## Tatsächlicher Stand

- Worktree: `C:\Users\PCUser\AppData\Local\Temp\opencode\variance-first-two-published`
- Branch: `agent/variance-first-two-published`
- Unveränderter HEAD: `05d8ff8091bbb3ec83e8dce1b6191637d1fad5c9`
- Aktiver LearningPath: **48 Szenen** statt zuletzt 46: zwei entfernt, vier ergänzt.
- Titel: **Variance and Uncertainty of the Mean**. Der Begriff der Freiheitsgrade
  ist aus den sichtbaren Inhalten dieses aktiven Pfads entfernt, einschließlich
  Titel und Tabellenbeschriftung. Die wiederverwendbaren Ressourcen bleiben für
  die spätere Einführung bei statistischen Tests erhalten.

## Umsetzung der sieben Punkte

1. **Calculation Rules for Expected Values**, Position 10:
   E[c], affine Erwartung, Addition und E[ΣYᵢ] = ΣE[Yᵢ] sind sichtbar. Zwei
   generische Formel-/Legendenspalten vermeiden zusätzliche überfüllte Karten.
   Die Langzeitinterpretation nennt ausdrücklich iid-Beobachtungen mit
   E[|X|] < ∞: der Stichprobenmittelwert konvergiert zum Erwartungswert. Der
   Erwartungswert ist eine Eigenschaft der Verteilung; ein endlicher
   Stichprobenmittelwert muss ihm nicht entsprechen. Linearität selbst braucht
   keine Unabhängigkeit.
2. **Variance Rules: Scaling and Covariance**, Position 11:
   Var(c) = 0 ergänzt; Kovarianz ist sichtbar als erwartetes Produkt zentrierter
   Abweichungen definiert. Die Varianz-Kovarianz-Identität und affine
   Varianzregel bleiben erhalten. Endliche zweite Momente und feste Skalare
   sind angegeben. Unabhängigkeit impliziert verschwindende Kovarianz, nicht
   allgemein umgekehrt.
3. **Degrees of Freedom: n−1 Free Residuals** ist unselektiert. Der mathematisch
   begründete Bessel-Nenner n−1 bleibt erhalten, ohne den Begriff vorwegzunehmen.
4. **The Influence of an Extreme Measurement**, Position 42:
   links eine strukturierte Szenario-Infobox, die farbcodierte Tabelle und die
   Schlussfolgerungsbox; rechts das unveränderte Diagramm. Die generische
   `data-visual`-Komposition wird wiederverwendet. Daten und Diagrammskalierung
   bleiben unverändert.
5. **Alle drei aktiven R-Übungen**, Positionen 27, 28 und 43:
   Zeitvorgaben entfernt; Aufgaben als echte Bulletlisten mit normalem
   Schriftgewicht, gezielter Fettschrift und Highlights strukturiert. Die
   drei R-Programme und ihre Daten sind unverändert. Hinweise zu Einheiten,
   Ausgabereihenfolge und dem nur illustrativen QC-Intervall bleiben erhalten.
6. **Analytical Decision Challenge** ist aus dem aktiven LearningPath entfernt.
7. **Vier neue Abschlussfolien** unmittelbar vor dem Rückblick:

| Position | Szene | Didaktische Aussage |
| --- | --- | --- |
| 44 | Return to the Variance of the Sample Mean | Derselbe Term erklärte zuvor den Bias des MSD; jetzt beschreibt er die Streuung des Mittelwertschätzers um μ. Die vollständige frühere Herleitung bleibt anklickbar. |
| 45 | From Measurement Spread to Uncertainty of the Mean | SD einzelner Messungen versus Standardfehler des Mittelwerts; theoretisch σ/√n, geschätzt s/√n. |
| 46 | Standard Error Decreases as 1/√n | Bei festem σ halbiert vierfaches n den SE; unter den genannten Annahmen geht er gegen null. Einzelmessungen werden dadurch nicht weniger streuend. |
| 47 | Report a Mean with Its Estimated Standard Error | Unverändertes QC-A-Beispiel: (10.00 ± 0.07) mg/L, n = 5, ausdrücklich Mittelwert ± ein geschätzter SE. |
| 48 | What Have We Learned? | Bisheriger Rückblick nach dem neuen Unsicherheitsabschnitt. |

## Fachliche Präzisierung

Var(X̄) = σ²/n ist eine **Varianz** und hat die quadrierte Einheit.
SE(X̄) = √Var(X̄) = σ/√n hat die ursprüngliche Messeinheit. Wenn σ unbekannt
ist, wird dieser SE durch s/√n geschätzt. Für die QC-A-Werte 9.8, 10.0, 10.1,
9.9 und 10.2 mg/L gilt exakt: Mittelwert 10 mg/L, Stichprobenvarianz 0.025
(mg/L)², s ≈ 0.1581139 mg/L und geschätzter SE ≈ 0.0707107 mg/L.

Die Formel beschreibt zufällige Stichprobenvariation unter geeigneten
Unabhängigkeits-/Momentannahmen. Sie ist keine Aussage über den bekannten
Fehler eines einzelnen Mittelwerts und keine vollständige metrologische
Messunsicherheit. Korrelation und systematische Effekte können weitere
Unsicherheitsbeiträge erzeugen, die durch einfaches Mitteln nicht verschwinden.
Eine Varianz kann deskriptiv die Streuung von Daten oder inferenziell die
Unsicherheit eines Schätzers beschreiben; s/√n ist jedoch keine universelle
Formel für beliebige Modellparameter.

Fehlerbalken müssen als SD, SE oder Konfidenzintervall bezeichnet werden.
Das Beispiel verwendet **einen geschätzten SE**, ausdrücklich nicht ein
95%-Konfidenzintervall. Ein Konfidenzintervall wird hier nicht vorweggenommen.

## Semantik und generische Darstellung

Alle neuen wissenschaftlichen Inhalte stehen in
`ontology/dataset/variance-standard-error-review.trig`. Die Pipeline bleibt
TriG → Canonical Compiler → SceneDocument → generische Renderer → Reveal.

- Neue gemeinsame Regeln: `ex:rule-expectation-finite-sum`,
  `ex:rule-variance-constant`, `ex:rule-covariance-definition`, im bestehenden
  gemeinsamen Mathematikgraphen mit festen IRIs und Voraussetzungen.
- Wiederverwendete Standardfehlerdefinitionen:
  `ex:sem-population-formula`, `ex:sem-estimated-formula`.
- Wiederverwendete Mittelwertvarianz und optionale vollständige Herleitung:
  `ex:cv-mean-result`, `ex:cv-mean-proof`.
- Neue Szenen: `ex:scene-se-return`, `ex:scene-se-sem`, `ex:scene-se-rate`,
  `ex:scene-se-example`.
- Die generische Evidenz-Komposition akzeptiert jetzt auch eine strukturierte
  Definitionskarte als Kontext vor Tabelle/Diagramm. Sie nutzt dieselbe
  vorhandene Geometrie und Tabellenfarbcodierung, ohne neue Speziallayouts.
- KeyPoint-Texte verwenden denselben sicheren Inline-Formatter für Fett- und
  Highlight-Markierungen wie vorhandene Infoboxen. HTML bleibt escaped.
- Bullettexte verwenden generisch Schriftgewicht 400; Hervorhebungen bleiben
  auf die ausgezeichneten Begriffe beschränkt.

Keine Entscheidungen anhand wissenschaftlicher IRIs, Folientitel oder Nummern;
keine wissenschaftlichen Inhalte in TypeScript oder CSS.

## Validierung

- SHACL: **Conforms: True**.
- Fingerprint:
  `15e4e4e5a85af09dcb9277dbd25e896aa1fcd54451d071688292d6edb579fef2`.
- Offering-Kursgenerierung und direkter Vite-Produktionsbuild erfolgreich.
- **102 gezielte Node-Tests** und **26 gezielte Python-Tests** erfolgreich.
  Enthalten: Regeln, Herleitungsauflösung, Pfadreihenfolge, keine sichtbaren
  Freiheitsgrade/Zeitvorgaben, exakte QC-/SE-Rechnung, abhängiges Gegenbeispiel
  für Linearität/Kovarianz und generische Kontextkarten-Komposition.
- **236 finale Szenenansichten**, Dark/Light, 1440×900 und 1280×720:
  keine erkannten Überläufe, unerwünschten Scrollbereiche, Regionsüberlappungen,
  KaTeX-Fehler, sichtbaren Em-Dashes oder rohen Markdown-Markierungen.
- **24 Ausführungen unveränderter R-Programme**: drei aktive Übungen × zwei
  Themes × zwei Viewports, jeweils in Entwicklung und Produktion. Ergebnisse,
  Bulletstruktur, Schriftgewicht, Hervorhebungen und Zweispaltengeometrie
  werden geprüft. Ein zunächst falscher SD-Erwartungswert im neuen Test wurde
  auf den tatsächlichen Wert der unveränderten QC-B-Daten korrigiert; die
  wissenschaftlichen Daten und Programme wurden dafür nicht verändert.
- Vollständige reale CDP-Mausradnavigation und Normalbewegungs-Tastaturtests
  prüfen die Vorlesung einschließlich schneller Eingaben, Richtungswechsel,
  Overlays und Neustart über die Oberwelt. Die Produktions-Mausradprüfung
  besteht ebenfalls; kein Klick-Ersatz auf einfachen Seiten.
- Die optionalen Herleitungsfenster bestehen ihre bestehenden 12 Fälle für
  beide Themes/Viewportgrößen, inklusive Escape, Fokus und Stage-Isolation.
- Introduction, Variables und Mean Values: wissenschaftliche SceneDocuments
  unverändert bis auf Provenienz; vollständige Tastaturnavigation und
  repräsentative visuelle Regression erfolgreich. Alle drei R-Codeblöcke und
  alle zehn bestehenden Diagrammpayloads der Varianzvorlesung sind unverändert.

Die detaillierten maschinenlesbaren Ergebnisse, Screenshots, Quellen und
Alt-/Neu-Listen liegen im neuen Reviewpaket. Frühere Pakete bleiben erhalten.

## Grenzen und Freigabe

Keine vollständige Testsuite; kein Test mit physischem Mausrad oder anderen
Browserengines. Lange Herleitungsdialoge dürfen absichtlich scrollen.
Die bekannte pauschale Unterpfadsperre des offiziellen Static-Build-Helpers
wurde nicht geändert; der separate lokale Vite-Build wurde unter
`/se-review/` mit echten Browseraufrufen geprüft. Große Bundle-Warnungen und
der vollständige gemeinsame RDF-Snapshot bleiben bekannte Grenzen.

Preview: `http://127.0.0.1:5194/`.
Produktionspreview: `http://127.0.0.1:5200/se-review/`.
Paket: `C:\Users\PCUser\AppData\Local\Temp\opencode\variance-se-review.zip`.

Alle bestehenden Dateien bleiben erhalten. Keine Commits, PRs, Pushes, Merges
oder Integration. Nach dem Reviewbericht stoppen und auf Freigabe warten.
