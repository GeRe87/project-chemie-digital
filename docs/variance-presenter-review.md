# Presenter-Funktionen und Script-Modus: Review

## Stand und Governance

Worktree: `C:\Users\PCUser\AppData\Local\Temp\opencode\variance-first-two-published`.
Branch: `agent/variance-first-two-published`.
HEAD unverändert: `05d8ff8091bbb3ec83e8dce1b6191637d1fad5c9`.
Die Vorlesung hat weiterhin **48 aktive Szenen in derselben Reihenfolge**.
Alle bisherigen Dateien, Änderungen und älteren Reviewpakete bleiben erhalten.
Keine Commits, PRs, Pushes, Merges oder Veröffentlichung.

## Umsetzung der zehn Punkte

| Punkt | Ergebnis |
| --- | --- |
| 1 | „Back to Our Three-Observation Example“ verwendet jetzt dieselbe generische `data-visual`-Komposition: Kontext, Tabelle und Fazit links; unverändertes Diagramm rechts. |
| 2 | Alle drei aktiven R-Labs besitzen eine kanonisch definierte Funktionslegende unter Editor und Ausgabe in der rechten Spalte. Der vorhandene Compiler und die vorhandene Code-/Legendenkomposition werden verwendet. |
| 3 | Klick, Enter oder Leertaste auf eine R-Ausgabe öffnet die unveränderte Ausgabe vergrößert in einem Modal. X oben rechts und Escape schließen es. Fokus kehrt zur Ausgabe zurück; Navigation und Stages bleiben unverändert. |
| 4 | Die bereits vorhandene lokale Uhr ist standardmäßig aktiviert und klein mittig rechts sichtbar: zweistellige Stunde, zweistellige Minute, `a.m.`/`p.m.` auf getrennten Zeilen. |
| 5 | „Why Precision Alone Is Not Enough“ besitzt ebenfalls die linke Kontext-/Tabellen-/Fazitspalte und das unveränderte Diagramm rechts. |
| 6 | Die zwei Stichpunkte auf „RSD in Analytical Quality Control“ stehen nebeneinander, jeweils einer pro Spalte. Die Regel ist strukturell und nicht an diese Folie gebunden. |
| 7 | Ab „From Measurement Spread to Uncertainty of the Mean“ verwenden die betreffenden Formeln Ȳ; das abschließende Zahlenbeispiel entsprechend ȳ und geschätzten SE(Ȳ). Die Umbenennung derselben Messgröße wird explizit erklärt. Frühere X̄-Herleitungen und allgemeine Formeln bleiben wiederverwendbar erhalten. |
| 8 | Oben rechts schaltet die Glühbirne zwischen Dark und Light um. Im Light-Modus leuchtet sie; Zustand, bestehender Theme-Selektor, Shortcut und URL bleiben synchron. |
| 9 | Der Button darunter wechselt zwischen Präsentation und Script. Für alle 48 Szenen ist echter Fließtext in TriG verfasst. Das Script ist einspaltig und ersetzt die kurzen Präsentationslisten durch diese Absätze. |
| 10 | Normale Seitenwechsel besitzen wieder eine vertikale, 220 ms lange Animation. Neue Eingaben brechen überholte visuelle Animationen ab. Bei „reduced motion“ bleibt der Wechsel unmittelbar. |

## Architektur und wichtige Abgrenzungen

Die Wissensbasis bleibt TriG → Canonical Compiler → SceneDocument. Es gibt
keine Foliennummern-, Titel-, Formelstring- oder wissenschaftlichen IRI-Weichen
im Renderer und keine wissenschaftlichen Inhalte in TypeScript oder CSS.

### Script

Das bestehende `Scene.narration`-Feld wird über die additive RDF-Eigenschaft
`cd:narration` aus den kanonischen Szenen befüllt, einschließlich Provenienz.
SHACL prüft nichtleere, sprachmarkierte und je Sprache eindeutige Texte.
`ontology/dataset/variance-script-narration.trig` enthält die 48 eigenständig
verfassten Absätze. Es findet keine automatische Bullet-zu-Fließtext-Umschreibung
im Browser statt.

Der vorhandene Self-study-Renderer erzeugt das Script. Seine neue optionale
Narrativprojektion verwendet die Absätze und erhält Formeln, Herleitungen,
Tabellen, Code und unterstützende Legenden. Dot-Plots besitzen jetzt ebenfalls
eine generische Self-study-Darstellung mit Quellen, Referenzwerten und
aufklappbaren Beobachtungs-/Kurventabellen. Diagramme werden in dieser Lesesicht
als strukturierte Daten beziehungsweise vorhandene Text-/Tabellen-Fallbacks
bereitgestellt, nicht als zweite interaktive D3-Präsentation.

Das Script ist eine Lesesicht; R-Code wird dort kanonisch und schreibgeschützt
gezeigt. Die tatsächlichen Editoren und Ausgaben der Präsentation bleiben
montiert. Das Umschalten erhält ihre Inhalte und Ergebnisse. Bei Rückkehr aus
demselben Script-Abschnitt bleibt der Herleitungs-Stage erhalten; nach dem Lesen
eines anderen Abschnitts wird dessen Folie geöffnet. Auch ein direkter Link mit
`mode=script` und Szenenanker wird unterstützt.

Der Script-Button ist für Module ohne vollständig verfasste Narration deaktiviert
und erklärt dies im Tooltip. Der vollständige Script-Inhalt dieser Änderung
betrifft die aktuelle 48-Szenen-Varianzvorlesung; für Introduction, Variables und
Mean Values werden keine neuen Fließtexte erfunden.

### Modals, Uhr und Theme

Mathematische Erklärungen und vergrößerte Codeausgaben verwenden dieselbe
gemeinsame native Dialog-Lebenszykluskomponente. Sie bietet Tastatur-/Wheel-
Abschirmung, Tab-Fokusführung, Escape, Scrollen langer Inhalte und Fokus-Rückgabe.
Ausgabetext wird über `textContent` übernommen, nicht als HTML interpretiert.

Die Uhr und die Theme-Logik erweitern vorhandene Komponenten. Die schmalen
Screen-Controls liegen außerhalb des Reveal-Canvas und bleiben in beiden
Ansichten erreichbar. Die Desktop-Uhr übernimmt das bestehende responsive
Verhalten; physische Mobilgeräte wurden nicht geprüft.

### Animation und robuste Navigation

Der logische Seitenwechsel bleibt atomar mit `behavior: "instant"`. Die sichtbare
vertikale Bewegung wird anschließend als Compositor-Animation der bereits
gewählten Szene ausgeführt, nicht durch eine noch laufende native
Smooth-Scroll-Positionierung. Das ist eine bewusste technische Abgrenzung:
Schnelle Folgeeingaben können auf dem korrekten aktuellen Navigationszustand
weiterarbeiten. Ein neues Seitenkommando verwirft die alte Animation. Alte
Finish-Callbacks dürfen eine neuere Animation nicht mehr überschreiben.

Eine Reveal-Neukonfiguration beim Script-Wechsel hatte im Test die Fragment-
Stages zurückgesetzt. Sie wurde entfernt. Stattdessen schirmt die Script-Sicht
die Präsentationseingaben ab, ohne die Deck-Konfiguration neu anzuwenden.
Damit bleibt der bestehende Stage-Zustand erhalten.

## Prüfungen

- SHACL: **Conforms: True**; Offering-Kursgenerierung erfolgreich.
- Semantischer Fingerprint:
  `827051383f4870c04908bad43e434126e1db7e096e46caca95ab637cf8266093`.
- **141 gezielte Node-Tests**, einschließlich Clock-Grenzfällen, Animation-
  Abbruch/Race-Schutz, Script-Projektion, Dot-Plot-Self-study, vorhandenen
  Renderer-, Theme-, Code- und Navigationstests.
- **27 gezielte Python-Tests** für Sequenz, Narration/Provenienz, Funktions-
  legenden, Ȳ-Notation, mathematische Regeln und exakte numerische Ergebnisse.
- **236 finale Szenenansichten** in Dark/Light bei 1440×900 und 1280×720:
  keine erkannten Überläufe, ungewollten Slide-Scrollbereiche, direkten
  Regionsüberlappungen, KaTeX-Fehler oder sichtbaren Markup-Reste.
- Neue Browserprüfung in Entwicklung und Produktion für beide Themes und
  Viewports: Uhrformat, Theme-Umschaltung, tatsächlich laufende Animation,
  korrigierte Zweispaltenlayouts, RSD-Spalten, Funktionslegenden und
  vergrößerte Ausgaben. Insgesamt **24 Ausführungen der unveränderten
  Original-R-Programme** über diese beiden Umgebungen.
- Script-Prüfung: 48 Absätze/Abschnitte, keine Vorlesungs-Bulletlisten,
  einspaltige Struktur, Erhalt von Editor/Ausgabe und Stages, Rückkehr zur
  gelesenen Szene, Tastaturumschaltung und direkter Script-Link.
- Reduced-motion-Prüfung: keine laufende Seitenanimation.
- Vollständige native CDP-Wheel- und Normalbewegungs-Tastaturnavigation
  einschließlich Stages, schneller Eingaben, Richtungswechseln, Overlays und
  Neustart über die Oberwelt erfolgreich. Produktions-Wheel ebenfalls
  erfolgreich. Kein Klick-Fallback auf einfachen Seiten.
- Die vollständigen mathematischen Detaildialoge bestehen ihre 12 Fälle in
  beiden Themes/Viewports; die neue gemeinsame Modalbasis wird zusätzlich
  durch die Ausgabe-Dialogtests geprüft.
- Introduction, Variables und Mean Values: unveränderte wissenschaftliche
  SceneDocuments und vollständige Tastaturregression erfolgreich. Die drei
  R-Programme und alle zehn vorhandenen Diagramm-Datenpayloads der
  Varianzvorlesung bleiben unverändert, abgesehen von Darstellungsreihenfolge
  und Provenienz. Vorhandene Dateien wurden nicht entfernt.
- Direkter Vite-Produktionsbuild unter `/presenter-review/` und Prüfung der
  Lazy-Loading-/Direktlink-Grenzen erfolgreich. Große Bundle-Warnungen bleiben
  bekannt; das gemeinsame RDF-Snapshot-Format wurde nicht optimiert.

Eine Zwischenprüfung scheiterte unter paralleler Entwicklungsserver-/Buildlast
beim Laden der Oberwelt. Der finale erneute Feature-Durchlauf und der separate
Produktionsdurchlauf bestehen. Es wird kein durchgehend fehlerfreier
Entwicklungsverlauf behauptet.

Keine vollständige Suite und keine physische Hardware-/Browserengine-Matrix.
Lange Dialoge, Codeeditoren und das lange Script dürfen absichtlich scrollen.
Die bestehende Unterpfadsperre des offiziellen Static-Build-Helpers wurde nicht
geändert; der Produktionsnachweis ist der separate lokale Vite-Build mit
tatsächlichen Browseraufrufen, keine Freigabe zur Veröffentlichung.

## Review

Preview: `http://127.0.0.1:5194/`.
Produktionspreview: `http://127.0.0.1:5202/presenter-review/`.
Paket: `C:\Users\PCUser\AppData\Local\Temp\opencode\variance-ui-review.zip`.
Galerie/Prüfbericht liegen im gleichnamigen Ordner.

Nach dem Review stoppen und auf weitere Freigabe warten.
