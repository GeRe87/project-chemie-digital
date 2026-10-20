# Oberwelt als Inselkarte

## Ergebnis

Die vier verfügbaren Level sind jetzt kleine Inselstationen statt einer
geradlinigen Liste. Ein geschwungener, gestrichelter Weg verbindet ihre
Levelmarkierungen; die Stationen liegen auf unterschiedlichen Höhen. Hügellagen,
schwebende Plattformen und eine Tages-/Nachtpalette greifen die gewünschte
Jump-and-run-Oberwelt auf, ohne ein zusätzliches Spielsystem einzuführen.

Die vier original erstellten SVG-Thumbnails zeigen:

- Introduction: Einstiegslabor mit Kolben und Startflagge;
- Variables: Observatorium, Würfel und Probengefäße;
- Mean Values: Waage und Markierungen um einen Mittelpunkt;
- Variance and Dispersion: zwei schematische Gruppen mit unterschiedlicher
  Streuung.

Es sind illustrative Motive, keine Messdaten, Simulationsergebnisse oder neuen
numerischen Lehrbeispiele. Die fünf noch nicht verfügbaren Regionen bleiben
als „In preparation“ sichtbar. Es werden keine Erfolge, gespeicherten Fortschritte
oder neuen Zugangsvoraussetzungen erfunden.

## Semantik und generische Darstellung

`ontology/dataset/course-world-artwork.trig` verknüpft LearningUnits über die
additive Eigenschaft `cd:hasThumbnail` mit vorhandenen MediaAsset-Verträgen.
Bildpfad und Alternativtext sind kanonisch verfasst. Der Offering-Compiler
übernimmt die optionale Thumbnail-Metadatenstruktur samt Ressourcen- und
Named-Graph-Identität. Der Renderer entscheidet nicht anhand von Titel, IRI
oder Levelnummer, welches fachliche Motiv angezeigt wird.

Die Thumbnail-Transportstruktur ist additiv. Units ohne Artwork bleiben gültig;
ein neutraler Platzhalter steht zur Verfügung. Compiler und Core validieren
lokale SVG-Pfade, Herkunft und nichtleere Alternativtexte. Die vier SVGs enthalten
keine Skripte, externen Fonts oder Remote-Abhängigkeiten.

Die Weggeometrie folgt den tatsächlichen DOM-Levelmarkierungen. Eine gebündelte
ResizeObserver-Aktualisierung berechnet die Kurven nach Layoutänderungen; es
gibt keine Geometriemessungen im Wheel-/Scroll-Hotpath. Auf schmalen Ansichten
liegen die Karten versetzt untereinander. DOM- und Tastaturreihenfolge bleiben
die kanonische Levelreihenfolge.

Der Überspringen-Link führt auf der Oberwelt jetzt zur Kartenüberschrift statt
zur ausgeblendeten Präsentation. Der vorhandene „Course Overworld“-Button liegt
außerhalb des Reveal-Canvas und bleibt als kleines Bedienelement unten links
erreichbar. Sein Rückkehrverhalten selbst ist unverändert.

## Prüfungen

- SHACL: **Conforms: True**, Offering-Generierung erfolgreich.
- **98 gezielte Node-Tests**, **45 gezielte Python-Tests**: kanonische
  Laufzeitverträge, Thumbnail-Projektion und Sicherheit, generische Bildauswahl,
  Weggeometrie, vorhandene Navigation, Script- und mathematische Verträge.
- Dark/Light bei **1440×900, 1280×720, 768×1024 und 390×844**, jeweils
  Entwicklung und direkter Vite-Produktionsbuild: insgesamt 16 Kartenfälle.
  Keine erfassten Kartenüberschneidungen, horizontalen Überläufe oder
  Browserfehler; vier vollständig geladene SVGs und sieben korrekte Regionen.
- Alle vier Level per Startaktion geöffnet und über den sichtbaren
  Rückkehr-Button verlassen, sowohl Entwicklung als auch Produktion.
- Skip-Link, natürliche Tab-Reihenfolge, Enter-Levelstart, Scrollen der Karte,
  Live-Resize der Weggeometrie und Reduced Motion geprüft.
- Lazy-Loading- und Direktlinkprüfung erfolgreich: keine Vorlesungsdaten,
  Reveal-, KaTeX- oder webR-Laufzeit auf der unbetretenen Karte. Im lokalen
  Produktionsnachweis wurden neun Ressourcen mit zusammen **57.986 Bytes**
  erfasst; die vier SVGs umfassen zusammen **7.698 Bytes**. Das ist eine lokale
  Messung, keine allgemeine Ladezeitgarantie.
- Die 236 Präsentationsansichten bestehen weiterhin die visuelle Prüfung.
  Vollständiger nativer CDP-Wheel-Durchlauf einschließlich Overlayfällen und
  Rückkehr/Neustart über die Oberwelt erfolgreich.
- Wissenschaftliche SceneDocuments aller vier Module unverändert, abgesehen
  von Provenienz. Narrationen, 48-Szenen-Sequenz, Formeln, Tabellen, Diagramm-
  payloads und R-Programme bleiben erhalten.
- Direkter Vite-Unterpfadbuild `/overworld-review/` erfolgreich. Die bekannten
  großen Lecture-Bundles und die Unterpfadsperre des offiziellen Static-Build-
  Helpers wurden nicht geändert.

Die ersten Tastaturprüfungen deckten den alten Skip-Link und den außerhalb des
Viewports liegenden Rückkehr-Button auf; beide Probleme wurden korrigiert und
die finalen Durchläufe bestehen. Keine vollständige Suite, Screenreader-Sitzung,
physischen Mobilgeräte oder zusätzliche Browserengines geprüft.

## Erhalt und Review

Semantischer Fingerprint:
`057b46bc6a62d4837ca66d11dc7843be791ea2ad7fec3c83cb7a32f9bf032bc2`.

Branch `agent/variance-first-two-published`, HEAD unverändert
`05d8ff8091bbb3ec83e8dce1b6191637d1fad5c9`.
Alle bisherigen Änderungen, Dateien und Reviewpakete bleiben erhalten.
Keine Commits, PRs, Pushes, Merges oder Veröffentlichung.

Preview: http://127.0.0.1:5194/

Screenshots, Thumbnail-Galerie, Quellen und Prüfbericht:
`C:\Users\PCUser\AppData\Local\Temp\opencode\overworld-review\index.html`
