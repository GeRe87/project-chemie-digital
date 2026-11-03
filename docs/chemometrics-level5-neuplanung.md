# Level 5: neue Planungsgrundlage

## Aktuelle Zielklärung: vom Stichprobenergebnis zur Grundgesamtheit

Die jüngste Rückmeldung des Lehrenden präzisiert die vorlesungsweite Leitfrage:
Aus einer angemessen ausgewählten und analysierten Stichprobe eine begründete
Aussage über den definierten Untersuchungsgegenstand gewinnen, einschließlich
Schätzziel, Unsicherheit und Reichweite. Die Vorhersage der nächsten Messung ist
nicht die Hauptmotivation. Laborwiederholungen ersetzen keine Umweltstichprobe;
ein analytisches Intervall gilt nicht automatisch für einen Wasserkörper.

Die vollständige Prüfung der aktuellen 70 Haupt- und sechs Reservefolien steht in
`docs/chemometrics-level5-population-inference-review.md`. Sie benennt den
Überarbeitungsbedarf pro Folie; die semantische Neuorientierung ist damit noch
nicht als umgesetzt oder validiert ausgewiesen. Zahlenbeispiele und zugesagte
Themen werden nicht eigenmächtig entfernt. Die folgenden früheren Planungsstände
bleiben als Verlauf dokumentiert und sind unter dieser Zielklärung zu lesen.

Stand: 2026-10-30. Neue Planung; erster lokaler B01/B02-Prototyp zur visuellen Abnahme.

## Verbindliche Grundlage

Die bereitgestellte Datei
`C:/Users/PCUser/Downloads/Level5_Wahrscheinlichkeitsverteilungen_Vorlesungsblaupause_2026-10-30.md`
ersetzt die bisherige Level-5-Planung vollständig. Die bisherigen Pumpen- und
Glücksrad-Prototypen, ihre Lehrressourcen und ausschließlich dafür ergänzten
Laufzeitfunktionen werden nicht übernommen. Level 0 bis 4 und bestehende
Veröffentlichungen bleiben unverändert.

Die Blaupause beginnt unmittelbar mit PFAS-Befunden und entwickelt daraus
Bernoulli- und Binomialmodell. Es folgen Poisson, PMF/PDF/CDF, Normal- und
Lognormalverteilung, Stichprobenmittelwerte, zentraler Grenzwertsatz,
Standardfehler sowie Chi-Quadrat-, Student-t- und F-Verteilung.

Die im Dokument erwähnte narrative Hauptquelle `Eingefügtes Markdown.md`
wurde bisher im Downloads-Ordner nicht gefunden. Das ist als Quellenlücke
kenntlich zu halten, nicht durch eine behauptete Lektüre zu ersetzen.

## Verbindliche Ergänzung: Verteilungsanpassung testen

Nach den Verteilungen und vor dem Abschluss werden zwei Anpassungstests
eingeführt. Diese ausdrückliche Ergänzung des Lehrenden ersetzt die Aussage der
Blaupause, dass im Kernpfad noch gar kein vollständiger Hypothesentest vorkommt.
Tests über Mittelwerte und Varianzen bleiben davon getrennt und werden nicht
stillschweigend zusätzlich in diese Sitzung aufgenommen.

### G18: Kolmogorov-Smirnov-Anpassungstest

- Leitfrage: Ist der Abstand zwischen empirischer und angenommener theoretischer
  Verteilungsfunktion unter dem Modell ungewöhnlich groß?
- ECDF und Modell-CDF gemeinsam darstellen, den größten vertikalen Abstand
  zunächst gemeinsam suchen, dann Prüfgröße und Ergebnis aufdecken.
- Ausgangspunkt ist der Ein-Stichproben-Test für unabhängige Beobachtungen und
  eine vollständig spezifizierte stetige Nullverteilung.
- Aus denselben Daten geschätzte Parameter erlauben nicht die unveränderte
  Standardkalibrierung. Geeignete modellspezifische Verfahren oder ein korrekt
  durchgeführter parametrischer Bootstrap sind getrennt zu erklären.
- Bindungen, Rundung und diskrete Verteilungen erfordern besondere Behandlung;
  nicht einfach den stetigen Standardtest auf die Binomialdaten anwenden.

### G19: Pearson-Chi-Quadrat-Anpassungstest

- Leitfrage: Passen beobachtete Klassenhäufigkeiten zu den unter dem Modell
  erwarteten Häufigkeiten?
- Beobachtete und erwartete Anzahlen vergleichen; Beiträge der Klassen zur
  Prüfgröße schrittweise sichtbar machen.
- Erwartete Häufigkeiten aus Klassenwahrscheinlichkeiten bestimmen, nicht aus
  Dichtehöhen. Klassen einschließlich Randbereiche müssen die Möglichkeiten
  vollständig und überschneidungsfrei abdecken.
- Unabhängigkeit, geeignete Klassierung, ausreichend große erwartete Anzahlen,
  Parameterschätzung und Voraussetzungen der Freiheitsgradkorrektur behandeln.
- Die Chi-Quadrat-Verteilung als Referenzverteilung und der Pearson-Anpassungstest
  sind verschiedene fachliche Ressourcen. Nicht mit Kontingenz- oder Varianztests
  gleichsetzen.

### Gemeinsame Interpretation und Abschluss

Nullhypothese, Prüfgröße, Signifikanzniveau und p-Wert werden an der jeweiligen
Frage eingeführt, nicht vorausgesetzt. Nichtverwerfen beweist kein Modell;
ein p-Wert ist nicht die Wahrscheinlichkeit, dass das Modell wahr ist.
Grafische Diagnose, Stichprobengröße, Testvoraussetzungen und fachliche Relevanz
bleiben Teil der Entscheidung. Der bisherige Abschluss E18 wird hinter die
beiden Anpassungstests verschoben und erhält bei der Szenenzuordnung eine neue ID.

## Zeitbudget und Arbeitsweise

Die Blaupause verplant bereits 180 Minuten einschließlich zehn Minuten Pause.
Für die zwei zusätzlichen Tests existiert noch kein abgestimmtes Zeitbudget.
Weder wird eine längere Sitzung stillschweigend angenommen, noch werden andere
zugesagte Kerninhalte eigenmächtig gestrichen. Vor der fertigen Ablaufplanung
sind Dauer beziehungsweise Gewichtung ausdrücklich abzustimmen.

Weiterhin gilt: zuerst Bestandsaufnahme und Zuordnung zu vorhandenen semantischen
Ressourcen, dann kleine Themenpakete mit visueller Einzelabnahme. Lehrperson
bedient, Studierende sagen voraus, diskutieren und begründen ohne Gerätepflicht.
Wenige sichtbare Kernaussagen, ausführliche Erläuterungen ins Skript. Jede
sichtbare Formel benötigt die authored Symbollegende auf derselben Folie.
TriG bleibt die einzige authored semantische Quelle. Keine Veröffentlichung,
kein Deployment und kein PR sind durch diesen Planungsschritt beauftragt.

## Aktueller erster Umsetzungsschritt

Lehrsprache ist verbindlich Englisch, einschließlich Folientext, Bedienung,
Narration und statischer Alternativen. Die inhaltliche Richtung von B01/B02 wurde
positiv beurteilt; Standardlayout und minimale, zentralisierte CSS-Regeln bleiben
verbindliche Abnahmekriterien. Keine hardgecodeten Spezialfolien oder zusätzlichen
Themenpakete ohne Einzelabnahme.

B01/B02 sind als getrennte lokale Vorschau umgesetzt, noch nicht visuell
freigegeben. Bestandsaufnahme, Zuordnung der weiteren Stationen und Prüfauftrag:
`docs/chemometrics-level5-block1-review.md`. B03 bis B06 und die übrigen Themen
werden nicht ohne die vorgesehenen Einzelabnahmen vorab ausgebaut.
