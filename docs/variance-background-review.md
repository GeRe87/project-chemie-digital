# Replikationstabelle und Hintergrundbewegung

## Ergebnis

- „What Must We Replicate?“ verwendet die vorhandenen vier Tabellenfarben.
  Die beiden abschließenden Stichpunkte stehen jeweils in einer eigenen Spalte.
  Tabellenzellen behalten eine lesbare Schriftgröße statt doppelter Skalierung.
- Der Hintergrund interpoliert seine Ebenenpositionen beim Seitenwechsel über
  220 ms. Die logische Navigationsposition bleibt weiterhin sofort gesetzt.
  Eine neue Zielposition setzt die Bewegung vom zuletzt dargestellten Stand
  fort; identische Scrollmeldungen starten sie nicht neu.
- Der Eintritt in eine bereits Stage-gesperrte Szene aktualisiert den Hintergrund
  ausdrücklich. Fragmentwechsel innerhalb einer Seite bewegen ihn nicht weiter.
- Reduced Motion deaktiviert die Hintergrundbewegung wie bisher.

## Ursache

Die vorherige Seitenanimation animierte nur die Folienfläche. Die Hintergrund-
ebenen erhielten unmittelbar die neue Scrollposition. Die Vorher-Messung zeigte
lediglich zwei Ebenenzustände; die neue Browserprüfung verlangt mindestens vier
verschiedene Zustände während eines Wechsels und anschließend eine stabile
Endposition. Sie prüft einfachen Wechsel, Eintritt in eine Herleitung und
Rückwärtswechsel in Entwicklung und Produktion.

## Architektur und Erhalt

Die Änderungen betreffen generische Kompositions-CSS, BackgroundRuntime und
die Anbindung an Reveal-Seitenereignisse. Keine Titel-/Szenen-ID-Sonderregeln,
keine neuen wissenschaftlichen Inhalte in TypeScript/CSS. Die kanonischen
SceneDocuments, alle 48 Szenen, Daten, R-Programme und Narrationen sind gegenüber
dem vorigen Review unverändert. Das ältere Reviewpaket bleibt erhalten.

Branch `agent/variance-first-two-published`, HEAD unverändert
`05d8ff8091bbb3ec83e8dce1b6191637d1fad5c9`.
Keine Commits, PRs oder Veröffentlichung.

## Prüfungen

- Browserprüfung in Dark/Light bei 1440×900 und 1280×720, jeweils Entwicklung
  und direkter Vite-Produktionsbuild: echte Hintergrundbewegung, stabile
  Endposition, farbige Tabelle, nebeneinanderliegende Stichpunkte, kein erfasster
  Überlauf. Reduced-motion-Prüfung ebenfalls erfolgreich.
- Vollständiger nativer CDP-Wheel-Durchlauf mit Richtungswechseln, schnellen
  Eingaben, Overlays und Oberwelt-Neustart erfolgreich.
- Vollständige Normalbewegungs-Tastaturprüfung erfolgreich.
- 236 Szenenansichten: keine erkannten Überläufe oder Browserfehler.
- Gezielte Background-, Theme-, Tabellen- und Navigationstests erfolgreich.
- SHACL: Conforms True; semantischer Fingerprint unverändert:
  `827051383f4870c04908bad43e434126e1db7e096e46caca95ab637cf8266093`.
- Direkter Vite-Produktionsbuild erfolgreich; bekannte Bundle-Warnungen bleiben.
  Der offizielle Unterpfad-Build-Helper und physische Geräte wurden nicht geprüft.

Preview: http://127.0.0.1:5194/

Reviewordner:
`C:\Users\PCUser\AppData\Local\Temp\opencode\variance-background-review`

Die Animation wurde anhand tatsächlicher Ebenentransformationen geprüft,
nicht allein anhand eines Screenshots oder der Folienanimation.
