# Lokaler Lernstand im Selbststudium

Der Selbststudiumsmodus kann seinen aktuellen Interaktionszustand ausdrücklich als `LearnerStateDocument 1.0` in eine lokale JSON-Datei exportieren und eine kompatible Datei später wieder importieren.

Der Export enthält den Fingerprint des aktiven kanonischen Datensatzes, stabile Dokument-/Szenen-/Block-Identitäten, eingegebene Antworten sowie den Zustand optionaler bzw. progressiver Offenlegungen. Er enthält keine Benutzer-, Konto- oder Profilkennung und keine Zeitstempel oder zufälligen Sitzungskennungen.

## Datenschutz

Exportierte Dateien können Freitextantworten und ausgewählte Antwortoptionen enthalten. Diese Inhalte können persönlich oder anderweitig sensibel sein. Die Datei wird nur an dem Ort gespeichert, den die lernende Person beim Download wählt. Die Anwendung überträgt den Lernstand nicht an einen Server und speichert ihn nicht automatisch im Browser. Ein normaler Reload beginnt daher weiterhin ohne wiederhergestellten Lernstand; eine Wiederherstellung erfolgt nur nach einem ausdrücklichen lokalen Import.

## Importgrenze

Ein Import wird vollständig geparst und gegen den aktuell geladenen kanonischen Laufzeitdatensatz validiert, bevor irgendein UI-Zustand geändert wird. Unter anderem führen eine andere Datensatzversion, unbekannte Dokumente/Szenen/Blöcke, ungeeignete State-Owner, unpassende Antwortmodi, nicht authorisierte Auswahlwerte oder doppelte Datensätze zum vollständigen Abbruch des Imports.

Learner-State ist kein semantischer Autoritätslayer: Der Import ändert weder RDF, `SceneDocument`, Pfadauflösung noch authored content oder Bewertungslogik.
