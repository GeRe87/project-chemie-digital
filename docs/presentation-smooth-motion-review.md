# Ruhigere Folien- und Hintergrundbewegung

## Änderung

- Folienbewegung: **720 ms statt 220 ms**, **48 px statt 28 vh**.
  Die Einblendung beginnt bei 98 % Deckkraft statt 65 %, um Blitzen zu vermeiden.
- Hintergrund: **1.100 ms statt 220 ms**, mit sanftem Beginn und Ende
  (Smootherstep, Geschwindigkeit und Beschleunigung an beiden Enden null).
- Die Hintergrundposition folgt dem Seitenindex mit 64 virtuellen Pixeln pro
  Seite, nicht mehr der tatsächlichen Scrollhöhe einer Reveal-Fragmentseite.
  Mit den vorhandenen Ebenengeschwindigkeiten bewegt sich der Eco-City-
  Hintergrund deshalb um **5,12 bis 46,08 px pro benachbarter Folie**.
  Eine lange Herleitung löst keinen größeren Sprung mehr aus als eine kurze Folie.

Die logische Navigationsposition bleibt sofort gesetzt; die längere Bewegung
blockiert keine Folgeeingaben. Neue Seitenkommandos ersetzen überholte visuelle
Animationen. Die Hintergrundbewegung setzt vom zuletzt dargestellten Stand fort.

Eine angenommene Fragmentnavigation beendet die kosmetische Folienbewegung,
bevor neue Herleitungskontrollen erscheinen. Auch Fokus innerhalb der Folie
beendet sie. Roh-Wheelereignisse unterhalb der Navigationsschwelle tun das
ausdrücklich nicht: Trackpad-Nachläufer dürfen die Bewegung nicht wiederholt
abbrechen. Reduced Motion bleibt ohne Bewegung.

## Prüfung

- 34 gezielte Node-Tests für Animation, Unterbrechungen, Hintergrundinterpolation,
  Themen und Navigation erfolgreich.
- Tatsächliche Animationsframes in Dark/Light bei 1440×900 und 1280×720,
  jeweils Entwicklung und direkter Vite-Produktionsbuild geprüft.
  Der Test kontrolliert Dauer, Bewegung nach 700 ms, begrenzte Weglänge,
  stabile Endposition sowie normalen, rückwärts gerichteten und Stage-Eintritt.
- Kleine Trackpad-Nachläufer lassen die Animation weiterlaufen; Reduced Motion
  bleibt statisch. Keine Browserfehler in diesen Prüfungen.
- Vollständige native CDP-Wheel-Traversierung einschließlich schneller Eingaben,
  Richtungswechseln, Overlays und Oberwelt-Neustart erfolgreich.
- Vollständige Normalbewegungs-Tastaturtraversierung erfolgreich. Ein erster
  Durchlauf zeigte die Notwendigkeit, bewegte Proof-Kontrollen bei angenommener
  Fragmentnavigation zu stabilisieren; nach der Korrektur besteht der Durchlauf.
- Vorhandene Presenter-Featureprüfung besteht ihre vier Theme-/Viewportfälle.
- Direkter Vite-Build `/smooth-review/` erfolgreich. Bekannte Bundle-Warnungen
  bleiben. Keine ganze Testsuite oder physische Hardware-/Framerate-Garantie.

## Erhalt

Keine semantischen Änderungen oder Regeneration notwendig. Die kanonische
Laufzeitdatei ist byteidentisch zum Zustand vor dieser Bewegungsanpassung.
Oberwelt, Narrationen, mathematische Inhalte, Daten und R-Code bleiben erhalten.
Alle vorherigen Dateien und Reviewpakete bleiben bestehen.

Branch `agent/variance-first-two-published`, HEAD unverändert
`05d8ff8091bbb3ec83e8dce1b6191637d1fad5c9`.
Keine Commits, PRs, Pushes oder Veröffentlichung.

Preview: http://127.0.0.1:5194/

Reviewvideo und Messdaten:
`C:\Users\PCUser\AppData\Local\Temp\opencode\smooth-motion-review\index.html`
