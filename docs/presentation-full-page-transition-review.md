# Vollständiger vertikaler Folienwechsel

Dieser Stand ersetzt den kleinen Einfahr-Effekt aus dem vorherigen Motion-Review.

## Sichtbares Verhalten

- Vorwärts: Die alte Folie fährt vollständig nach oben aus dem Bildschirm;
  gleichzeitig kommt die nächste von unten herein.
- Rückwärts: Die alte Folie fährt nach unten; die vorherige kommt von oben.
- Beide Flächen bewegen sich synchron über eine vollständige Bildschirmhöhe,
  ohne Ausblenden, über **800 ms** mit weichem Beginn und Ende.
- Der Hintergrund benötigt jetzt **900 statt 1.100 ms** für dieselbe begrenzte
  Wegstrecke: bei Eco City je Ebene rund 5–46 px pro benachbarter Folie.
  Er ist damit etwas schneller, bleibt aber unabhängig von Fragment-Seitenhöhen.

## Technische Abgrenzung

Die logische Navigation springt weiterhin atomar an die korrekte Position.
Unmittelbar davor erfasst die Darstellung eine inaktive DOM-Kopie der alten
sichtbaren Szene. Diese fährt anschließend aus, während der echte neue
`scroll-page-content`-Container einfährt. Beide Animationen teilen Startzeit,
Dauer und Kurve. Es werden keine wissenschaftlichen Inhalte in JavaScript
nachgebildet und keine neuen SceneDocuments oder Reveal-Navigationspositionen
erzeugt.

Die Kopie liegt außerhalb der aktiven Reveal-Instanz, ist `inert`, für
Hilfstechnologien verborgen und ohne Live-Szenen-/Chart-Bindungen. IDs und ihre
lokalen Verweise werden umbenannt; die Kopie besitzt keine Event-Listener.
Formularwerte und bestehende SVG-Darstellungen werden übernommen. Canvas und
Video nutzen nach Möglichkeit ein lokales Bild des aktuellen Frames, ohne
zweite Medien-/R-Laufzeit. Fremdherkunfts- oder noch nicht verfügbare Videoframes
können nur den vorhandenen Poster-/Fallbackzustand wiedergeben.

Nach Abschluss oder Unterbrechung wird die Kopie entfernt. Es bleibt höchstens
eine Übergangsebene bestehen. Schnelle Folgekommandos warten nicht auf ein
Animationsende und bauen keine Warteschlange auf. Fragmentkommandos, Fokus
und Script-Wechsel beenden die kosmetische Bewegung. Während des Einfahrens
sind bewegte Folienkontrollen kurz inaktiv; die separate Navigation bleibt
bedienbar. Ein Fragmentkommando stabilisiert die Folie vor dem nächsten Schritt.
Reduced Motion wechselt unmittelbar, ohne Übergangskopie.

## Nachweise

- 34 gezielte Node-Tests erfolgreich: vollständige Vorwärts-/Rückwärts-Keyframes,
  Abbruch und späte Callbacks, Hintergrund und bestehende Navigation.
- Neue Browserprüfung bei 1440×900 und 1280×720 in Dark/Light, jeweils
  Entwicklung und direkter Vite-Produktionsbuild. Sie hält beide Animationen bei
  halber Laufzeit an und prüft ihre tatsächlichen Positionen bei ±½ Bildschirmhöhe.
  Fotos bei 20, 50 und 80 Prozent dokumentieren, dass beide Folien sichtbar
  beteiligt sind, nicht nur eine kurze Einfahrbewegung.
- Prüfung von Vorwärts-, Rückwärts- und Stage-Eintritt, identischer Quellgeometrie,
  eindeutigen DOM-IDs, unveränderter Live-Szenenzahl, Aufräumen der Kopie,
  Wiederherstellung der Interaktivität und Reduced Motion erfolgreich.
- Schnelle Folgeeingaben, Fragmentunterbrechung und Script-Unterbrechung
  erfolgreich. Hintergrundprüfung bestätigt begrenzte Strecke und stabile
  Endposition in beiden Umgebungen. Keine Browserfehler in diesen Prüfungen.
- Vollständige native CDP-Wheel- und Normalbewegungs-Tastaturtraversierung,
  einschließlich Overlays, Richtungswechseln und Oberwelt-Neustart erfolgreich.
- Presenter-Featureprüfung besteht weiterhin die vier Theme-/Viewportfälle,
  einschließlich R-Ausgaben und Script-/Editor-Zuständen.
- Direkter Vite-Unterpfadbuild `/full-page-review/` erfolgreich; bekannte
  Bundle-Warnungen bleiben. Der Produktionsserver wurde für den Browsernachweis
  neu gestartet, nachdem der vorherige Prozess nicht mehr erreichbar war.

Die Videoaufnahme zeigt reale native Wheelwechsel im lokalen Produktionsbuild.
Keine vollständige Testsuite, physische Hardware-/Framerate-Garantie,
Screenreader-Sitzung oder weitere Browserengine-Matrix.

## Erhalt

Die kanonische Laufzeitdatei bleibt byteidentisch; keine semantische Änderung,
Regeneration, Datensatz-, Formel-, R-Code- oder Narrationsänderung.
Alle vorherigen Dateien und Reviewpakete bleiben erhalten.

Branch `agent/variance-first-two-published`, HEAD unverändert
`05d8ff8091bbb3ec83e8dce1b6191637d1fad5c9`.
Keine Commits, PRs, Pushes, Merges oder Veröffentlichung.

Preview: http://127.0.0.1:5194/

Video, Phasenbilder und Messdaten:
`C:\Users\PCUser\AppData\Local\Temp\opencode\full-page-motion-review\index.html`
