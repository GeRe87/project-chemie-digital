# Beschreibungsregeln für Folien und Script

Status: **Arbeitsentwurf v0.2, noch nicht insgesamt verabschiedet**.
Arbeitsbasis: `chemometrics` auf `a07792de` (einschließlich PR #302).
Erster Anwendungsfall nach Abstimmung: Level 5, Theoretical Distribution Models.

**Aktueller Arbeitsstand:** Auf Wunsch ist inzwischen eine lokale Anwendung auf
Level 5 sichtbar: zehn thematische Scriptkapitel, aussageorientierte Überschriften
und ein explizites Frage–Antwort-Paar. Der vorgeschlagene additive RDF-Vertrag und
die Grenzen dieser ersten Umsetzung stehen in [ADR-0027](adr/0027-thematic-script-and-teaching-questions.md).
Die nachfolgenden Entwurfsfragen bleiben Reviewpunkte; der Prototyp bedeutet keine
pauschale Abnahme des Regelwerks. Die lokale LaTeX-Ausgabe ist inzwischen umgesetzt;
es erfolgt weiterhin keine Veröffentlichung.

Festlegung aus der Abstimmung: Das Script erhält eine eigenständige thematische
Gliederung und ist nicht an die Folienfolge gebunden. Die zusätzlich beauftragte
LaTeX/PDF-Druckausgabe wird aus derselben Scriptquelle erzeugt; siehe
[lokaler LaTeX-Export](latex-script-export.md).

Dieses Dokument schlägt redaktionelle Regeln und ihre semantische Zuordnung vor.
Es ändert keine Lehrinhalte, RDF-Verträge, Renderer oder Prüfregeln. Insbesondere
sind die unten genannten neuen Relationsarten noch kein implementiertes Vokabular.

## 1. Ziel und Ebenentrennung

Folien und Script erklären denselben fachlichen Zusammenhang, erfüllen aber
unterschiedliche Aufgaben:

- **Folie:** Aufmerksamkeit führen, einen Gegenstand verständlich zeigen und
  eine Erkenntnis oder eine gezielte offene Frage festhalten.
- **Script:** Einen eigenständig lesbaren Gedankengang entwickeln, der auch ohne
  Vortrag verständlich bleibt. Es ist weder eine Stichwortsammlung noch eine
  ausgeschriebene Regieanweisung für die Präsentation.

Fachliche Aussagen, Bedingungen, Daten und Quellen müssen übereinstimmen.
Wortlaut, Satzlänge und Gliederung müssen nicht identisch sein. Zusammenhang
entsteht nicht allein durch zusätzliche Wörter wie „daher“ oder „anschließend“.

### G1 — Positiv beschreiben, was gilt

Für Folien und Script stehen Gegenstand, Zusammenhang und Erkenntnis im
Vordergrund. Wir erklären, **was etwas ist, wie es funktioniert und was daraus
folgt**. Routinemäßige Abgrenzungen darüber, was etwas alles nicht ist, nicht
leistet oder nicht erlaubt, entfallen. Das gilt besonders für Überschriften und
Quintessenzen, ebenso für wiederkehrende Warnsätze im Fließtext.

Die Regel gilt für **alle sichtbaren Texte**, einschließlich Diagramm-Captions,
zustandsabhängiger Bildunterschriften, Detailansichten und Bildalternativen.
Bildunterschriften erklären die dargestellten Größen und den erkennbaren
Zusammenhang. Interne Hinweise wie „initial browser and PDF state“ oder
„published counts as the extended lecture“ gehören zur technischen Dokumentation.
Reproduktionsinformationen wie ein Zufallsstartwert bleiben im zugänglichen
Code-/Methodenkontext erhalten; die Caption konzentriert sich auf das Gezeigte.

| Abgrenzende Formulierung | Aussageorientierte Formulierung |
| --- | --- |
| “Area, not height, gives interval probability.” | “Area under the density gives interval probability.” |
| “More results reveal the model, not a more precise method.” | “More results reveal the assumed distribution more clearly.” |
| “Q-Q plots expose departures, not proof of a model.” | “Q-Q plots compare observed and theoretical quantiles.” |

Fachlich notwendige Voraussetzungen werden als Geltungsbereich ausgedrückt,
beispielsweise „Under independent Normal sampling …“. Eine konkrete
Begriffsabgrenzung bleibt dort sinnvoll, wo sie selbst der erklärte Lerngegenstand
ist; sie wird dann anhand der beiden positiven Bedeutungen entwickelt. Ein
fachliches Ergebnis wie eine Wahrscheinlichkeit von null bleibt selbstverständlich
Bestandteil der Erklärung. Die Regel ist eine redaktionelle Vorgabe, kein bloßes
Verbot einzelner Wörter.

### G2 — Mathematische Begriffe mit ihren Symbolen schreiben

Sobald eine mathematische Größe oder Funktion gemeint ist, verwenden Folien und
Script ihre eingeführte Notation: beispielsweise $\varphi$, $\Phi$ und $z$.
Bezeichnungen wie „lowercase phi“ gehören zur Aussprachehilfe, während der
sichtbare Text das Symbol und seine Bedeutung verbindet: „$\varphi$ describes
the standard-Normal density.“ Neue Symbole werden bei ihrer Einführung erklärt.

Mathematik wird ausdrücklich mit `$...$` oder `\(...\)` ausgezeichnet. Der
Renderer verwendet denselben sicheren Inline-Mathe-Pfad in Überschriften,
Fließtext und Beschriftungen sowie in Web- und Druckansichten. Notation und
Glyphenvariante stimmen mit der zugehörigen Formel überein, insbesondere
`\varphi` gegenüber `\phi`. Die Aussprache wird durch MathML bzw. explizite
barrierefreie Formulierungen unterstützt.

Text- und Mathematikschriften müssen in Größe, Farbe und Grundlinie zusammenpassen.
Mathematik erhält eine zur Umgebung passende Schriftgröße; Formelglyphen behalten
ihre mathematische Typografie. Eine gemeinsame Schrift ist eine mögliche Lösung,
kein Selbstzweck. Ein erzwungener Textfont darf weder Symbole verlieren noch deren
Form oder Bedeutung verändern. Vollständige Symbollegenden bleiben erhalten.

### G3 — Layout folgt Inhaltsstruktur und Lesefläche

- Eine Illustration mit zwei bis drei kurzen Erklärkarten erhält eine breite
  Bildzeile und darunter eine Kartenzeile. Auf schmalen Bildschirmen folgen die
  Karten einzeln. Bild und Erklärung bilden eine einspaltige Inhaltsfolge.
- Die lokale automatische Regel erfasst Bildmedien und gewöhnliche Erklärkarten
  mit höchstens 420 Zeichen je Karte (Titel und Beschreibung zusammen).
  Umfangreichere Erklärungen behalten zunächst die vorhandene Zweispaltenregel;
  das Zeichenbudget ist eine prüfbare Heuristik, keine garantierte Geometrie.
- Farbig nummerierte Erklärkarten behalten diese Gestaltung in jeder Region.
  Symbollegenden und eingebettete Code-/Formelerläuterungen behalten ihre eigene
  Darstellung. Nummer und Titel ergänzen die Farbe als eindeutige Kennzeichnung.
- Die Layoutwahl hängt von Inhaltsarten und Umfang ab, nicht von Foliennummern
  oder Ressourcen-IDs. DOM-Lesereihenfolge und sichtbare Reihenfolge stimmen
  überein; die unabhängige Scriptstruktur bleibt erhalten.
- Freiraum wird zuerst durch ausreichend große Visualisierungen und lesbare
  Textbreiten verbessert. Zusätzlicher Lehrtext wird fachlich begründet verfasst.
  Desktop, Mobilansicht und Druck werden auf Überläufe und Vollständigkeit geprüft.

### G4 — Gemeinsam rechnen, gemeinsam ausrichten

Zusammengehörige Daten- und Rechenflächen beginnen auf derselben Oberkante.
Ihre Höhe folgt ihrem Inhalt; eine kurze Formel wird innerhalb ihrer Spalte oben
ausgerichtet. Auf schmalen Bildschirmen folgt die Rechnung unter den Daten.
Formel und vollständige Symbollegende bleiben eine gemeinsame Einheit.

### G5 — Diagrammboxen geben freien Platz an die Zeichenfläche

In ein- und zweispaltigen Ansichten erhält eine Diagrammbox die verfügbare
Inhaltshöhe unter Titel und gegebenenfalls Navigation. Unterer Sicherheitsabstand,
Themenzeile und ein verfasster Schluss bleiben reserviert. Eine benachbarte
Textspalte bleibt oben ausgerichtet und behält ihre natürliche Höhe.

Der innere Aufbau lautet: **Bedienelemente → flexible Zeichenfläche → Legende →
Ergebniswerte → Aktionen**. Bedienelemente und Texte erhalten ihre benötigte Höhe;
der verbleibende Platz vergrößert die tatsächliche Zeichenfläche. Der Renderer
berechnet Achsen und Koordinaten für diese Fläche neu. So bleiben Schrift,
Achsenverhältnis und Kurvengeometrie kontrolliert; bloßes Strecken eines SVG
ersetzt diese Berechnung nicht. Mehrere Plots teilen sich den verfügbaren Bereich.

Mobil und im Druck gelten eigene Höhenbudgets mit vollständig lesbaren Inhalten.
Übersteigt der feste Inhalt das Budget, wird die Anordnung angepasst oder die
Folie inhaltlich geteilt. Verdeckte Bedienelemente und abgeschnittene Legenden
erfüllen die Regel nicht. Die lokale Anwendung erweitert zunächst die vorhandene
Experiment-Zeichenflächenanpassung auf ein- und zweispaltige Experimentfolien.

### G6 — Flow-Schritte verwenden die gemeinsame Kartengestaltung

Gewöhnliche Flow-Schritte erhalten einen farbigen Kopf mit sichtbarer Nummer und
Titel sowie einen ruhig hinterlegten Erklärungstext. Die Nummer bezeichnet die
autorisierte Lesereihenfolge; Pfeile und Beschriftungen tragen die Beziehungen.
Farbe ergänzt Nummer und Titel und ersetzt diese Information nicht. Lineare
Kartenreihen haben gemeinsame Oberkanten und passende Kopf-/Textbudgets.
Zusammengesetzte Prozessknoten, Motive und Netzwerke behalten ihre spezialisierte
Darstellung, bis deren Anpassung separat geprüft ist.

Die Kopfzeile ordnet Nummer und linksbündigen Titel nebeneinander an; alle
Erklärungstexte einer Reihe beginnen auf einer gemeinsamen Höhe. Der Kopf erhält
ein eigenes Titelbudget, sodass der Nummernplatz nicht nachträglich in den Text
ragt. Übergangsbeschriftungen stehen bei ausreichend breiten Zwischenräumen an
ihrem Pfeil. Der Renderer reserviert diesen Zwischenraum aus dem Textumfang;
die Kollisionsprüfung bleibt maßgeblich. Ruhige Schrift, Rundungen und Farben
folgen den gewöhnlichen Erklärboxen statt einem zweiten Pixel-/Callout-Stil.

### G7 — Bildbezogene Beschreibung in die Caption, eigenständige Aussage in den Text

**Festlegung aus der Abstimmung; gilt gemeinsam für Folien und Script, einschließlich
HTML-, statischer und PDF-Ausgabe.** Entscheidend ist die Funktion der Aussage,
nicht ihre Länge oder der gerade verfügbare Platz:

- **Caption:** Die Aussage erschließt die konkrete Abbildung: Was ist dargestellt,
  welche Größen, Bedingungen oder Zustände werden verglichen, und welcher
  Zusammenhang ist darin erkennbar? Dazu gehören etwa die Stichprobengröße eines
  gezeigten Histogramms oder ein gemeinsamer Schwellenwert mehrerer Teilplots.
  Die Caption bildet mit der Abbildung eine unmittelbar zugeordnete Einheit.
- **Fließtext bzw. eigenständiger Folientext:** Die Aussage trägt den fachlichen
  Gedankengang auch ohne diese konkrete Abbildung. Sie erklärt, begründet oder
  folgert; die Abbildung unterstützt sie als Beispiel oder Beleg. Im Script wird
  dieser Bezug ausdrücklich durch einen semantischen Abbildungsverweis hergestellt.
- **Gemischte Aussage:** Bildbeschreibung und eigenständige Erklärung werden nach
  ihrer Funktion getrennt. Die Beschreibung steht in der Caption, die weiterführende
  Aussage im Text. Derselbe Inhalt wird nicht zusätzlich als Einzelzeile,
  Ergebniseintrag oder zweite Erklärung wiederholt.

**Entscheidungsfrage:** „Erklärt dieser Satz vor allem die konkrete Darstellung,
oder bleibt er als fachlicher Gedankenschritt auch ohne sie sinnvoll?“
Bildbezogene Sätze müssen grammatisch vollständig sein können; ein vollständiger
Satz gehört deshalb nicht automatisch in den Fließtext. Auch eine Interpretation
des konkret Gezeigten kann Teil der Caption sein.

**Ebenso zählen abbildungsspezifische Ergebniswerte zur Caption:** etwa Anzahl
simulierter Serien, aktuelle Stichprobengröße, empirische/theoretische Streuung
und die für diese Darstellung berechnete Wahrscheinlichkeit. Die didaktisch
relevanten Werte werden in zusammenhängenden Caption-Sätzen erläutert. Ein
automatisch erzeugter Katalog aus Kennwertname und Zahl steht weder frei unter
der Abbildung noch als Ersatz für eine verfasste Caption. Vollständige technische
und numerische Details bleiben separat zugänglich, beispielsweise in Details
oder im herunterladbaren Quellmaterial. Achsen- und Kurvenlegenden behalten ihre
eigene Aufgabe innerhalb der Grafik.

Beispiele:

| Aussage | Platzierung |
| --- | --- |
| „Beide Teilplots verwenden denselben Schwellenwert von 10,1 mg/L.“ | Gemeinsame Caption der Abbildung; einmal statt unter jedem Teilplot und nochmals als Ergebniswert. |
| „Das Histogramm zeigt die ersten 100 Ergebnisse derselben simulierten Folge.“ | Caption des jeweiligen Teilplots; keine zusätzliche Zeile „Results: 100“. |
| „Die kumulierte Wahrscheinlichkeit entspricht der Fläche unter der Dichte bis zum Schwellenwert.“ | Eigenständiger fachlicher Text; die Abbildung veranschaulicht diesen Zusammenhang. |

Achsenbeschriftungen, Kurvenlegenden, vollständige Symbollegenden und für die
Interaktion notwendige Bedienelemente behalten ihre Funktion. Eine Caption ersetzt
diese Bestandteile nicht. Zustandsabhängige Caption-Angaben folgen dem tatsächlich
gezeigten Zustand; bei statischen Ausgaben dem exportierten Zustand.

Die Zuordnung wird beim Authoring semantisch getroffen und redaktionell geprüft.
Renderer erhalten diese Funktion über die Ausgaben hinweg; sie entscheiden sie
nicht anhand von Schlüsselwörtern oder Satzlängen. Bereits vorhandene technische
Zusammenfassungen einzelner Ergebniswerte ersetzen diese redaktionelle Prüfung
nicht. Die Festlegung bedeutet noch keine vollständige Bestandsprüfung aller Folien.

## 2. Regeln für Folien

### F1 — Ein klarer Erkenntnisschritt

Für jede Inhaltsfolie lässt sich angeben, was Lernende hier verstehen, erkennen
oder entscheiden sollen. Das ist konkreter als ein Themenetikett. Eine Übersicht
darf mehrere Gegenstände enthalten, wenn deren Beziehung der Erkenntnisschritt ist.

### F2 — Den gezeigten Gegenstand erschließen

Die Folie macht verständlich, was dargestellt wird und wie es zu lesen ist:
betrachtete Größen, Vergleich, Transformation oder Experiment sowie die dafür
relevanten Bedingungen. Achsen und Legenden können einen Teil dieser Arbeit
übernehmen; ein zusätzlicher Absatz ist nicht grundsätzlich erforderlich.

Beschreibung und Interpretation bleiben unterscheidbar: „Die Kurve besitzt einen
langen rechten Ausläufer“ beschreibt etwas anderes als die daraus gezogene Folgerung.

### F3 — Eine begründete Quintessenz

Eine erklärende Folie enthält eine auffindbare Kernaussage: Was folgt aus dem
Gezeigten, und unter welchen Bedingungen? Die Kernaussage wiederholt nicht bloß
den Titel und behauptet nicht mehr, als Darstellung und Fachgrundlage tragen.
Ein einzelner Simulationslauf beweist keine allgemeine Verteilungsaussage.

Die Aussage darf etwa im Titel oder in einem kurzen Schluss stehen. Diese Regel
fordert keine zusätzliche „Quintessenz“-Box auf jeder Folie.

### F4 — Fragen werden bewusst eröffnet und aufgelöst

Für eine **Rechenfolie** wird die bereits verlangte Kernaussage konkret geprüft:
Eine erkennbare Fragestellung führt über Daten und Rechenweg zu einer sichtbaren
Antwort in Worten, einschließlich Einheit und Vergleichsbasis. Die Rechnung
allein ersetzt diese Antwort nicht. Die Interpretation unterscheidet beobachtete
Größe und statistische Bewertung. Ein größerer Stichprobenwert beschreibt zuerst
die vorliegenden Daten; seine Auffälligkeit wird mit dem dafür angegebenen Modell
bewertet. Eine offenbleibende Bewertungsfrage erhält einen benannten Anschluss.
Das Vorhandensein dieser Bestandteile ist strukturell testbar; ihre fachliche
Schlüssigkeit bleibt eine ausdrückliche redaktionelle Prüfung.

Eine Fragefolie darf ihre Antwort zunächst offenlassen. Dann ist ihre Funktion
die präzise Frage samt nötigem Kontext, nicht eine vorweggenommene Quintessenz.
Die Auflösung bezieht sich ausdrücklich auf dieselbe Frage und beantwortet sie
mit Begründung statt mit einem bloßen Themenwechsel.

Bei einem deklarierten **Frage–Antwort-Paar** folgt die Antwort unmittelbar im
gewählten Lernpfad. Eine längere Untersuchung ist ein anderes Muster: Sie benötigt
einen ausdrücklich benannten späteren Auflösungsschritt. Reihenfolge allein
belegt keine Antwortbeziehung; eine offenbleibende Reflexionsfrage muss als solche
kenntlich sein. Nicht jede Frage ist eine bewertete Übung oder benötigt eine Musterlösung.

### F5 — Sprachliche Eindeutigkeit vor maximaler Kürze

Kurze, konkrete Formulierungen; Stichpunkte nur für tatsächliche Aufzählungen.
Keine Satzfragmente, wenn dabei die fachliche Beziehung verlorengeht. Begriffe
und Bezeichnungen bleiben über aufeinanderfolgende Folien stabil. Unvermeidliche
Voraussetzungen werden bei ihrer Verwendung erklärt, nicht beiläufig versteckt.

### F6 — Interaktion verändert die Form der Aussage

Bei veränderlichen Parametern muss klar sein, was aktuell beobachtet wird und was
allgemein gilt. Eine fest formulierte Quintessenz darf nicht durch einen erlaubten
Experimentzustand falsch werden. Zustandsabhängige Aussagen benötigen explizite
Bedingungen oder eine nachvollziehbare Bindung an das Ergebnis.

Diese Regel gilt auch für Titel, Fragen und Antworten: Allgemeine Aussage,
gekennzeichnetes Referenzbeispiel und aktueller Experimentzustand dürfen nicht
verwechselt werden. Ein fester Prozentwert im Text beschreibt nicht automatisch
den aktuell ausgewählten Wert im Diagramm.

## 3. Wiederverwendbare didaktische Muster

Diese Muster beschreiben Beziehungen, keine Layouts oder obligatorischen Textboxen.

| Muster | Gedankengang | Abschluss |
| --- | --- | --- |
| Erklären | Gegenstand → relevante Eigenschaft → Bedeutung | Kernaussage mit Geltungsbereich |
| Vergleichen | gemeinsame Vergleichsbasis → Unterschied/Gemeinsamkeit → Bedeutung | begründete Unterscheidung |
| Frage–Antwort | konkrete Frage → Antwort im nächsten Pfadschritt → Begründung | Frage erkennbar beantwortet |
| Untersuchen | Frage → Beobachtung/Variation → Auswertung | Antwort am ausdrücklich zugeordneten Auflösungsschritt |
| Herleiten | Ausgangspunkt und Bedingungen → begründete Schritte → Ergebnis | Bedeutung und Gültigkeit des Ergebnisses |
| Anwenden | Problem → begründete Modell-/Methodenwahl → Ergebnis | Interpretation im ursprünglichen Problem |

Eine Folie kann einen Teil eines mehrteiligen Musters übernehmen. Die Zuordnung
gilt für die jeweilige Verwendung im Pfad, nicht zwangsläufig für jede Verwendung
derselben wiederverwendbaren Ressource. Titel-, Übergangs- und Abschlussfolien
werden nach ihrer Funktion geprüft, nicht künstlich zu Ergebnisfolien gemacht.

## 4. Regeln für den Fließtext im Script

### S0 — Beschriftete Materialien und explizite Querverweise

Jede Abbildung, Tabelle und vollständige Formeleinheit erhält eine verfasste,
fachlich beschreibende Beschriftung an ihrer konkreten Verwendung im Script.
Der Text verweist ausdrücklich darauf und erklärt, was daraus abgelesen,
berechnet oder gefolgert werden kann. Eine isolierte Materialsammlung ersetzt
diese Verbindung nicht. Optionale Codebeispiele erhalten entsprechend Listings.

Die Verwendung ist eine `cd:ScriptMaterial`-Ressource mit `dct:title` und
`cd:scriptResource` zur gemeinsam genutzten wissenschaftlichen Ressource.
Ein Kapitel verknüpft sie mit `dct:references`; der Marker
`[[ref:ex:l5-sm-growth]]` im Text benennt diese stabile Verwendung. Die Verbindung
wird vor der Ausgabe aufgelöst und geprüft. Fehlende Beschriftungen, nicht
verknüpfte Marker, fremde Ziele und unreferenzierte wissenschaftliche Materialien
werden als Fehler gemeldet.

Figuren-, Tabellen-, Gleichungs- und Listingnummern entstehen getrennt aus der
Reihenfolge im vollständigen ausgewählten Script. Nummern werden weder in den
TriG-Text noch in Ressourcen-IDs geschrieben. Nach Umstellungen ändern sich die
Nummern gemeinsam mit allen Textverweisen; Identität und Beschriftung bleiben
erhalten. Eine mehrzeilige, gemeinsam erklärte Formeleinheit erhält eine Nummer.

HTML-Verweise führen per Tastatur zum beschrifteten Ziel und verändern den
Folien-Navigationszustand nicht. In Druckansichten bleiben Nummer und vollständige
Beschriftung sichtbar. Die lokale LaTeX-Ausgabe verwendet dieselben semantischen
Ziele für `\label`/`\ref`. Der Script-PDF-Knopf öffnet das dazu erzeugte PDF nur,
wenn es zum aktuellen Scriptinhalt und zur exakten Pfad-/Graphbindung passt.

### S1 — Ein Absatz entwickelt einen Gedanken

Ein Absatz eröffnet einen fachlichen Gedanken, erläutert ihn und führt zu einer
Folgerung oder einer begründeten Anschlussfrage. Nicht jeder Absatz braucht drei
Sätze; diese Funktionen dürfen sich auch auf mehrere Absätze verteilen.

### S2 — Beziehungen werden ausgesprochen

Der Text erläutert, warum ein Schritt folgt: Ursache, Voraussetzung, Gegensatz,
Beispiel, Einschränkung oder Folgerung. „Daher“ darf nur dort stehen, wo wirklich
eine Folgerung besteht. Eine bloße Reihenfolge von richtigen Einzelsätzen genügt nicht.

### S3 — Anschluss über fachliche Gegenstände

Neue Abschnitte knüpfen an einen benannten Gegenstand oder ein offenes Problem an.
Bezüge wie „dies“, „dabei“ oder „diese Verteilung“ müssen eindeutig sein. Es soll
ohne Zurückblättern verständlich sein, welche Größe oder Annahme gemeint ist.
„Auf der nächsten Folie“ ersetzt keinen fachlichen Übergang.

### S4 — Eigenständig lesen, Abbildungen gezielt nutzen

Der Text erklärt Bedeutung und Argumentation, statt bloß „die Grafik zeigt“ zu
wiederholen. Nötige Abbildungen und Formeln bleiben eindeutig referenziert und
im Script verfügbar. Eigenständige Lesbarkeit verlangt nicht, jede Abbildung in
Worten vollständig zu duplizieren.

### S5 — Zusammenhängend statt künstlich kurz

Satzlängen dürfen variieren. Zusammengehörige Aussagen werden verbunden, ohne
lange Schachtelsätze oder Fülltext zu erzeugen. Ein pauschales Wortlimit pro Szene
ist kein Qualitätsmaß für den Lesefluss. Die bisherige Kürzung von Level 5 ist
daher keine verbindliche sprachliche Vorlage für diese Überarbeitung.

### S6 — Fragen werden im Lesetext aufgegriffen

Frage und Antwort bleiben fachlich verbunden. Das Script muss die künstliche
Wartezeit einer Präsentation nicht nachbilden. Es darf die Frage unmittelbar
entwickeln und auflösen, solange Zuordnung, Begründung und gegebenenfalls der
Charakter einer offenen Reflexion erhalten bleiben.

### S7 — Themenstruktur statt Folienabschrift

Kapitel und Abschnitte folgen fachlichen Zusammenhängen und einer begründeten
Lesereihenfolge. Weder Abschnittsgrenzen noch Reihenfolge werden aus den Folien
abgeleitet. Ein Abschnitt darf Material mehrerer Folien verbinden; eine Folie
kann umgekehrt mehrere Scriptstellen berühren. Absätze werden nicht lediglich
pro Folie verlängert und anschließend aneinandergereiht.

Für den Wechsel zwischen Ansichten dienen explizite inhaltliche Zuordnungen zu
Themen oder Ressourcen als Orientierung. Sie sind keine eins-zu-eins-Abbildung:
Bei mehreren passenden Stellen muss das Ziel nachvollziehbar gewählt oder eine
Auswahl angeboten werden. Die Rückkehr zur zuvor geöffneten Folie bleibt eine
separate Navigationsfunktion und kein Teil des fachlichen Wissensmodells.

## 5. Abbildung auf Knowledge Graph und TriG

### Bestehende Grundlage

Level 5 trennt bereits Wissen/Daten, Szenen und Pfadauswahl. `cd:SceneItem`
verweist über `cd:selectsResource` und `cd:selectionPath` auf Inhalte und besitzt
eine `cd:communicativeRole`. `cd:SceneDefinition` trägt unter anderem
`cd:focusConcept` und `cd:narration`. `cd:PathStep` bindet über `cd:usesScene` und
`cd:position` eine Szene in den Lernpfad ein. Das ist die Ausgangsbasis, kein
Grund für eine parallele JSON-Inhaltsquelle.

### Vorgeschlagene Verantwortlichkeiten

| Information | Semantische Heimat | Konsequenz |
| --- | --- | --- |
| Fachliche Aussage, Definition, Formel, Daten, Voraussetzungen, Quelle | Wissens-/Lernressourcen | fachlich wiederverwendbar; keine Foliennummer oder CSS-Klasse |
| Frage und ihre begründete Antwort | identifizierbare Lernressourcen mit expliziter Beziehung | nicht aus Fragezeichen, Titelähnlichkeit oder Nachbarschaft erraten |
| Funktion eines gezeigten Elements: Beschreibung, Befund, Interpretation, Quintessenz | Verwendung in einer Szene | bestehende Rollen prüfen und nur bei echter Lücke ergänzen |
| Didaktisches Muster und Frage–Antwort-Folge | pfadbezogene Verwendung/Schrittbeziehung | bei Wiederverwendung und Umordnung erneut prüfbar |
| Erklärender Lesetext | eigenständige thematische Scriptabschnitte mit Verweisen auf Wissens-/Lernressourcen | bestehendes szenengebundenes `cd:narration` ist nicht das Zielmodell; kein Zusammenkopieren von Folientexten |
| Kapitelhierarchie und Lesereihenfolge | explizite Scriptstruktur | unabhängig von der Präsentationsreihenfolge; bestehende Strukturverträge zuerst auf Wiederverwendbarkeit prüfen |
| Übergang, der nur in einer bestimmten Reihenfolge gilt | jeweiliger Präsentationspfad bzw. Scriptkontext | nicht als universelle Eigenschaft der Wissensressource ablegen |

Vor einer Ontologie-Erweiterung ist zu klären, welche vorhandenen Klassen und
Relationen diese Aufgaben bereits erfüllen. Vorschläge für zusätzliche Rollen,
Antwortbeziehungen oder pfadgebundene Textanschlüsse brauchen einen eigenen
Vertragsentwurf. Dieses Dokument legt bewusst noch keine neuen IRIs fest.

Ein fachlicher Antwortinhalt und seine dramaturgische Position sind zwei
verschiedene Dinge. Dieselbe Antwort kann in einem anderen Pfad anders eingeführt
werden. Ebenso ist eine Quintessenz kein automatisch extrahierter letzter Satz.

### Mögliche Ausgabewege: Web und Druck

Empfehlung zur Diskussion, noch keine Implementierungsentscheidung:

```text
TriG: gemeinsame Wissensressourcen + eigenständige Scriptstruktur und Texte
                         ↓ aufgelöstes Scriptmodell
                 ┌───────┴────────┐
            HTML-Leseansicht   generiertes LaTeX
                                  ↓ Build vor Veröffentlichung
                                 PDF
```

LaTeX wäre hier ein Ausgabeformat, keine zweite handgepflegte Inhaltsquelle.
Kapitel, Prosa, Formeln, vollständige Symbolerklärungen, Abbildungen und Quellen
müssen aus derselben aufgelösten Scriptfassung stammen. Stilvorlagen dürfen
druckspezifisch sein, fachliche Aussagen nicht. Diagramme benötigen geeignete
statische Exporte; interaktive Ergebnisse werden nicht ungeprüft übernommen.

Die PDF-Kompilierung erfolgt lokal bzw. im Veröffentlichungsbuild, nicht beim
Umschalten im Browser. Ein vorab erzeugtes PDF kann direkt geöffnet werden;
erstes Laden und Anzeigen brauchen trotzdem Zeit. Der Ansatz ist mit statischem
Hosting vereinbar und benötigt keinen LaTeX-Server zur Laufzeit.

Für den schnellen Wechsel wird zunächst eine HTML-Scriptansicht empfohlen,
ergänzt um „Druckfassung/PDF“. Sie ermöglicht responsive Darstellung, stabile
Abschnittsanker und inhaltliche Navigation. Alternativ kann der Scriptwechsel
direkt ein PDF öffnen; dessen Einbettung, Barrierefreiheit und zielgenaue
Navigation hängen jedoch vom PDF-Viewer ab. PDF-Seitenzahlen sind keine stabilen
semantischen Identitäten. Eine LaTeX-Ausgabe garantiert weder automatisch
Barrierefreiheit noch identische Darstellung im Web.

Vor einer Veröffentlichung sind HTML und PDF gegen dieselbe Inhaltsrevision zu
prüfen und gemeinsam bereitzustellen. Fehlgeschlagene PDF-Erzeugung darf nicht
unbemerkt eine alte Druckfassung neben einem neuen Webscript veröffentlichen.
Die bestehende Browser-Druckausgabe ist eine mögliche Vergleichsbasis; ob LaTeX
den zusätzlichen Build- und Exportaufwand rechtfertigt, prüfen wir an einem
repräsentativen thematischen Abschnitt, bevor wir eine Toolchain festlegen.

## 6. Prüfung: Struktur und redaktionelle Qualität trennen

**Technisch prüfbar nach Festlegung des Vertrags:** auflösbare Referenzen,
eindeutige Rollen/Zuordnungen, Sprachkennzeichnung, vollständige Frage–Antwort-
Verknüpfung, unmittelbare Nachbarschaft deklarierter Paare im ausgewählten Pfad,
definierte Auflösung längerer Untersuchungen sowie vollständige Formellegenden.
SHACL prüft RDF-Struktur; Pfadauflösung prüft die konkrete ausgewählte Reihenfolge.
Renderer dürfen fehlende Bedeutungsbeziehungen nicht heuristisch ergänzen.

**Redaktionell zu beurteilen:** Ist verständlich, was gezeigt wird? Folgt die
Quintessenz tatsächlich daraus? Beantwortet die Auflösung die Frage? Sind
Übergänge fachlich begründet und Absätze im Zusammenhang gut lesbar?
Vorhandene Textfelder oder bestandene SHACL-Prüfungen beweisen diese Qualität nicht.

Die bestehende Pflicht zu vollständigen Symbollegenden bleibt erhalten, auch bei
Fragefolien und im Script/PDF. Eine spätere Antwortfolie ersetzt keine Legende.

## 7. Geplantes Vorgehen für Level 5

1. Regeln gemeinsam präzisieren und als erste Arbeitsfassung festhalten.
2. Für die 41 bestehenden Szenen Funktionen und mehrteilige Zusammenhänge
   inventarisieren; Lücken markieren, noch nicht den gesamten Text umschreiben.
3. An wenigen repräsentativen Stellen pilotieren: eine Diagrammerklärung, ein
   Frage–Antwort-Zusammenhang und ein zusammenhängender Scriptabschnitt über
    ein Thema mit eigenständiger Gliederung. Die zugehörigen Folien dienen als
    Vergleich, nicht als Abschnittsschablone. Keine Fragefolge künstlich erzeugen,
    nur um das Muster zu erfüllen.
4. Alte/neue Fassung zusammen mit den angewandten Regel-IDs vergleichen:
   Folienverständlichkeit, fachliche Genauigkeit, Lesefluss und semantische Abbildung.
5. Regeln nachjustieren; erst dann auf den gesamten Level übertragen und
   Struktur-, Inhalts-, Browser- und Scriptprüfungen ergänzen.

Formeln, Daten, Berechnungen, Voraussetzungen und Quellen sind keine beiläufigen
Copy-Edit-Flächen. Benötigte fachliche Korrekturen oder Änderungen an der
41-Szenen-Reihenfolge werden gesondert begründet und abgestimmt.

## 8. Pilot und Reviewverfahren

Der [Level-5-Pilot](teaching-authoring-pilot-level5.md) wendet die Regeln zunächst
auf Dichte, Verteilungsfunktion und Quantile an. Er enthält eine Ist-Diagnose,
einen eigenständigen englischen Scriptabschnitt und einen Folienentwurf mit
expliziter Frage–Antwort-Zuordnung. Das ist redaktioneller Reviewtext, kein zweiter
aktiver Inhaltsbestand. Erst die abgestimmte Fassung wird in kanonisches TriG
überführt; ein Web-/LaTeX-Vergleich folgt auf Basis dieser einen Quelle.

Für jede Regel halten wir beim Pilotieren fest:

1. **Anlass:** welches konkrete Verständnis- oder Leseflussproblem besteht?
2. **Anwendung:** welche Text-/Strukturänderung folgt aus welcher Regel-ID?
3. **Review:** wird die Aussage klarer, bleibt sie fachlich richtig, entsteht
   unbeabsichtigte Wiederholung oder wird ein nötiger Zwischenschritt ausgelassen?
4. **Nachjustierung:** Inhalt korrigieren, Regel präzisieren oder eine begründete
   Ausnahme definieren. Ein einziges Beispiel begründet keine pauschale Regel.

Eine Regel gilt nicht allein deshalb als erfüllt, weil ein entsprechendes Feld
gefüllt ist. Für F2/F3 muss ein Review den gezeigten Gegenstand und die daraus
folgende Aussage benennen können. Für S1–S3 muss es die Beziehung zwischen den
Absätzen erklären können. Das sind redaktionelle Prüffragen, keine automatische
Messung des Lernerfolgs.

## 9. Noch gemeinsam zu entscheiden

- Reichen diese sechs Muster als erste Arbeitsfassung, oder fehlen etwa eine
  eigene Begriffsabgrenzung bzw. ein Reflexionsmuster?
- Soll die Scriptansicht HTML bleiben und zusätzlich eine LaTeX/PDF-Druckfassung
  anbieten (Empfehlung), oder soll der Wechsel direkt das vorab erzeugte PDF öffnen?
- Welche Funktionen müssen auf einer Folie stets sichtbar sein, welche dürfen
  durch Titel, Beschriftung und Darstellung selbst getragen werden?
- Welche vorhandenen Rollen und Ressourcenbeziehungen können wir unverändert
  nutzen, und wo braucht die pfadbezogene Dramaturgie eine additive Erweiterung?
