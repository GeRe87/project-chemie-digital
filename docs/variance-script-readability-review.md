# Script: Mathematik und Leselayout

## Korrekturen

Der Script-Modus ist eine einspaltige Leseseite mit begrenzter Textbreite,
ruhiger Schrift, getrennten Absätzen, klarer Überschriftenhierarchie und
kompakten Symbolerklärungen. Formeln erhalten einen eigenen, dezent abgesetzten
Bereich; Tabellen und Code haben eine einheitliche Lesedarstellung.

Zwei Fehler im mathematischen Rendering wurden behoben:

1. Der Self-study-Adapter übernimmt nun `expression` und `symbol` aus den
   kanonischen DefinitionList-Einträgen. Symbol-Legenden verwenden dadurch
   dieselbe explizite mathematische Notation wie die Präsentation.
2. Mathematische Ausdrücke in der kanonischen Narration sind ausdrücklich mit
   `$…$` ausgezeichnet. Der generische Text-Renderer unterstützt diese sowie
   `\(…\)`, Code-Spans und selektive Hervorhebungen. Er errät keine Formeln aus
   Wörtern, Unicode-Zeichen, Titeln oder Ressourcen-IDs.

Display- und Inlineformeln verwenden KaTeX mit HTML **und** MathML. Rohes HTML
wird maskiert und KaTeX bleibt `trust: false`. Die vorhandenen zugänglichen
Formelquellen bleiben erhalten, aber visuell verborgen. Die eigenständige
Self-study-App lädt die zugehörigen KaTeX-Stile ebenfalls.

## Diagramme statt technischer Platzhalter

Die zehn vorhandenen Dot-Plots werden im Script über denselben generischen
D3-Renderer und dieselben ChartBlocks wie in der Präsentation angezeigt. Es
gibt keine zweite wissenschaftliche Diagrammimplementation und keine geänderten
Messwerte, Simulationsdaten oder Seeds.

„Observation table“ ist entfernt. Unter dem Diagramm erlaubt der ausdrücklich
beschriftete Eintrag „Show values for this figure“ die Einsicht in die Zahlen.
Diese native Detailansicht ist optional; das Diagramm selbst ist unmittelbar
sichtbar. Auch ohne Diagramm-Enhancement bleiben die Daten als HTML erhalten.
Die Chart-Komponenten werden beim ersten Öffnen erstellt, bei erneutem Öffnen
wiederverwendet und beim Verlassen der Anwendung aufgeräumt.

## Erhalt

48 Szenen und ihre Reihenfolge bleiben bestehen. Nur Narrationen wurden für
mathematische Auszeichnung, Absätze und klare Verweise auf die ausführbare
Präsentationsansicht redaktionell angepasst. Die wissenschaftlichen Blöcke aller
vier Module bleiben unverändert, einschließlich Formeln, Proof-Details,
Diagrammdaten, Tabellen und R-Programme. TriG bleibt die einzige autorisierte
Inhaltsquelle. Keine neuen wissenschaftlichen Inhalte in TypeScript oder CSS.

Die Präsentationsansicht, Hintergrundbewegung, R-Editorinhalte, Ausgaben und
Herleitungs-Stages bleiben beim Umschalten erhalten. Der Script-Modus ist
weiterhin eine Lesesicht; Code wird in der Präsentationsansicht ausgeführt.

## Prüfungen

- SHACL: `Conforms: True`; Kursgenerierung erfolgreich.
- Fingerprint:
  `4e19f809ed09efcb381d37401ba7c3e3b2d7428b34e6a30da2b3fc1bea8773d0`.
- 63 gezielte Node-Tests, darunter Textsicherheit, Inline-/Displaymathematik,
  Symbolnotation/Provenienz, Self-study, Code und Navigation.
- 27 gezielte Python-Tests für Sequenz und mathematische Ableitungen.
- Alle 48 Script-Abschnitte in Dark/Light bei 1440×900 und 1280×720 geprüft,
  sowohl Entwicklung als auch direkter Vite-Produktionsbuild: insgesamt 384
  Abschnittsprüfungen und 80 Chart-Instanzen mit überprüften Originalpunktzahlen.
- Keine erkannten KaTeX-Fehler, rohen Math-Delimiter in den Narrationen oder
  horizontalen Seitenüberläufe. Symbol-Legenden enthalten gerenderte Mathematik.
- Vollständige Proof-Ansichten, Theme-Wechsel, direktes Script-Öffnen,
  Wiedereintritt und Erhalt des ursprünglichen Herleitungs-Stages geprüft.
- Vorhandene Presenter-Featureprüfung erfolgreich: drei Original-R-Programme,
  Ausgabe-Dialoge, Editor-/Ausgabeerhalt beim Script-Wechsel, Theme, Uhr und
  Animation in vier Theme-/Viewportkombinationen.
- 236 Präsentationsansichten ohne erkannte Überläufe oder Browserfehler;
  vollständiger nativer CDP-Wheel-Durchlauf einschließlich Overlays und Neustart
  erfolgreich.
- Direkter Vite-Produktionsbuild erfolgreich. Bekannte Bundle-Warnungen bleiben.

Eine erste automatische Elementaufnahme blieb beim Scroll-/Stabilitätswarten
stehen. Die finale Prüfung verwendet Viewport-Aufnahmen nach expliziter
Abschnittspositionierung; die aufgezeichnete Abschnittsgeometrie ist stabil.
Es werden keine vollständig gescrollten Ganzabschnittsaufnahmen behauptet.
Keine vollständige Testsuite, physischen Geräte oder vollständige PDF-Paginierung
geprüft. Lange Inhalte dürfen im Script und in Detailansichten scrollen.

Branch `agent/variance-first-two-published`, HEAD unverändert
`05d8ff8091bbb3ec83e8dce1b6191637d1fad5c9`.
Keine Commits, PRs, Pushes oder Veröffentlichung.

Preview: http://127.0.0.1:5194/

Reviewordner:
`C:\Users\PCUser\AppData\Local\Temp\opencode\variance-script-review`
