# Level 5: vom Untersuchungsgegenstand zur statistischen Aussage

Umsetzungsstand nach Freigabe durch den Lehrenden:
[`chemometrics-level5-population-inference-implementation.md`](chemometrics-level5-population-inference-implementation.md).
Die folgenden Abschnitte bleiben als ursprünglicher Review und Prüfauftrag erhalten;
aktueller Quellenstand und aktuelle Validierung stehen im Umsetzungsbericht.

## Status und Umfang

Vollständige inhaltliche Durchsicht nach der jüngsten Rückmeldung des Lehrenden:
70 Hauptfolien und sechs getrennte Reservefolien. Geprüft wurden Folientexte,
Diagrammbeschreibungen, Formeln, Symbollegenden, Karten, vorhandene Vergleichsstufen
und Narration. Dies ist ein **Review mit Überarbeitungsauftrag**, keine Behauptung,
dass die 76 Folien bereits nach diesem Auftrag umgeschrieben oder neu validiert sind.
Keine Änderung an semantischen Ressourcen, Zahlenbeispielen oder Renderern in diesem
Review. Keine Veröffentlichung, kein Commit, kein Push.

Die jüngste Zielklärung ersetzt die bisherige didaktische Leitentscheidung, den
Normal-Einstieg mit der Vorhersage des nächsten Messergebnisses zu begründen.
Die Mathematik dieser Vorhersage ist nicht falsch; ihre Rolle als Hauptzweck dieser
Vorlesung ist falsch gewählt. Die engeren bisherigen Story-/Übergangsreviews reichen
für diese neue, vorlesungsweite Anforderung nicht aus.

Quellen: aktueller lokaler Haupt- und Reservepfad, zugehörige authored TriG-Ressourcen,
die bereitgestellte Vorlesungsblaupause und die jüngste Zielklärung des Lehrenden.
`Eingefügtes Markdown.md` bleibt eine nicht gelesene, nicht verfügbare Zusatzquelle.

## 1. Leitfrage und fachliche Ebenen

**Was können wir aus ausgewählten und analysierten Wasserproben über die
Nitratkonzentration im definierten Untersuchungsgegenstand aussagen, und wie
unsicher ist diese Aussage?**

Vor einer konkreten Rechnung müssen Wasserkörper, räumlicher Bereich, Tiefe,
Zeitpunkt beziehungsweise Zeitraum und interessierende Größe benannt sein.
Ein heterogener Wasserkörper besitzt nicht zwangsläufig eine einzige überall
gleiche Konzentration. Ein möglicher Zielparameter ist seine mittlere Konzentration;
deren räumliche, volumenbezogene und gegebenenfalls zeitliche Gewichtung hängt von
der Untersuchungsfrage ab. Diese Festlegung ist im aktuellen Material noch offen,
nicht bereits als reale Probenahmeplanung entschieden.

Vier Ebenen sind durchgehend auseinanderzuhalten:

1. **Untersuchungsgegenstand / Grundgesamtheit:** Worüber soll die Aussage gelten?
2. **Umweltstichprobe:** Welche Einheiten wurden wann und wie ausgewählt? Decken
   Auswahl und gegebenenfalls Gewichtung die Zielgesamtheit angemessen ab?
3. **Analytik einer entnommenen Probe:** Aufbereitung, Kalibrierung, Bias und
   Wiederholmessungen beeinflussen den geschätzten Wert für diese Probe.
4. **Statistische Auswertung:** Welcher Schätzer und welche Unsicherheitsaussage
   passen zur Zielgröße, zum Probenahmedesign und zum Modell?

Ein engeres Intervall für Ebene 3 ist kein Nachweis für Repräsentativität auf Ebene 2.
Viele Wiederholungen derselben Probe ersetzen keine räumliche/zeitliche Probenahme.
Auch unabhängig ausgewählte Standorte liefern nicht ohne Weiteres den
volumengewichteten Mittelwert des gesamten Wasserkörpers. Ein größerer Umfang
repariert weder systematische Auswahlfehler noch analytischen Bias.

Ein repräsentativ angelegtes Design garantiert nicht, dass eine einzelne realisierte
Stichprobe exakt den wahren Wert trifft. Deshalb gehören Schätzung **und** Unsicherheit
zur Antwort. Präzision, Repräsentativität, Richtigkeit und Modellpassung sind keine
Synonyme.

## 2. Hauptbefunde und Priorität

### P0: Der Schluss auf den Untersuchungsgegenstand fehlt als tragende Handlung

Die bestehenden Blöcke beantworten meist: „Wenn die Parameter bekannt sind, welche
Ergebnisse erzeugt das Modell?“ Es fehlt zu häufig der Rückweg: „Wir kennen die
Parameter nicht; was erfahren wir aus dieser Stichprobe über sie?“

- B01 beginnt mit einer einzelnen Klassifikation, ohne den Untersuchungsauftrag
  bereits sichtbar an die Zielgesamtheit anzubinden. B05 nennt Schätzung, führt sie
  aber nicht als durchgehende Handlung fort.
- N09/N10 verfolgen ausdrücklich ein zukünftiges Ergebnis derselben Probe. Die
  Karten „What we need next“ und „Solved: one future result“ machen gerade diesen
  Nebenpfad zur Hauptgeschichte.
- C13/C14 erklären Stichprobenverteilungen korrekt und sind der stärkste vorhandene
  Ansatzpunkt. Ihre Bedeutung für die Verlässlichkeit **unserer Schätzung** muss
  jedoch vor der Simulation sichtbar werden.
- Der Abschluss kehrt zu fünf technischen Nitrat-Wiederholungen zurück. Ein
  vollständiger Bericht über den definierten Wasserkörper wird nicht erreicht.

### P0: Das vorhandene Nitratintervall ist kein Umweltmittelwert-Intervall

S15 und T16g verwenden dieselben fünf konstruierten Wiederholungsmessungen einer
homogenen Probe. Ihr t-Intervall von etwa 9.60735 bis 10.39265 mg/L beschreibt unter
den angegebenen Voraussetzungen den gemeinsamen analytischen Erwartungswert.
Es berücksichtigt weder die Auswahl verschiedener Umweltproben noch deren
räumliche/zeitliche Heterogenität. Ohne Bias-Kontrolle ist es nicht einmal automatisch
ein Intervall für die wahre Konzentration der entnommenen Probe.

**Nicht korrigieren, indem die fünf Wiederholungen nachträglich in fünf unabhängige
Umweltproben umbenannt werden.** Die bestehende Rechnung darf als analytisches
Teilbeispiel bleiben. Ein Umweltmittelwert benötigt ein ausdrücklich definiertes,
dazu passendes Stichprobenbeispiel und eine begründete Auswertung.

### P1: „Repräsentativer Wert“ ist noch nicht als Zielgröße bestimmt

Bei Lognormalität sind Median, geometrisches Mittel und arithmetischer Erwartungswert
verschieden. Der Median ist nicht einfach der „repräsentativere“ Ersatz für einen
schief verteilten Mittelwert. Für eine volumenbezogene mittlere Konzentration ist die
Mittelwertfrage anders als die Frage nach einer typischen Einzelprobe.
Auch eine Überschreitungswahrscheinlichkeit ist eine andere Zielgröße.

### P1: Richtige Schutzsätze ersetzen keinen positiven Ablauf

„Nicht repräsentativ“, „nicht gemessen“, „kein Beweis“ und „nicht dieselben Daten“ sind
wichtige Grenzen. Der sichtbare Hauptsatz muss aber beantworten, **welche Aussage
wir mit welchem nächsten Schritt gewinnen**. Sonst besteht die Geschichte aus einer
Folge von Einschränkungen und Modellwechseln.

### P1: Modellprüfungen und Methodenvergleich erhalten die falsche Schlussrolle

F betrifft zunächst Präzision analytischer Verfahren. KS/Pearson prüfen begrenzte
Aspekte der Übereinstimmung mit Verteilungsmodellen. Keines davon validiert das
Probenahmedesign, bestätigt Repräsentativität oder liefert die wahre Nitratkonzentration.
Diese Blöcke unterstützen die Auswertung, ersetzen aber nicht ihren Untersuchungszweck.

## 3. Durchgehender Erzählbogen, ohne Verteilungskatalog

Der Einstieg bleibt unmittelbar beim PFAS-Beispiel, ohne Statistik-Wiederholungsblock.
Schon dort wird eine Untersuchung einer definierten Wasser-Grundgesamtheit genannt.
PFAS, Partikel und Nitrat sind unterschiedliche fachliche Zielgrößen innerhalb
derselben Untersuchungslogik, nicht austauschbare Messungen derselben Größe.

| Station | Untersuchungsbezogener Zweck | Rolle der Verteilungen |
| --- | --- | --- |
| PFAS-Stichprobe | Aus ausgewählten Proben etwas über die positive Befundhäufigkeit in der Zielgesamtheit lernen | Binomial beschreibt die Streuung der Anzahl und damit die Unsicherheit einer beobachteten Häufigkeit. Befundanteil ist nicht wahre Kontaminationsprävalenz. |
| Partikel in Wasser | Von einer untersuchten Teilmenge zu einer detektierten Partikelintensität gelangen | Poisson beschreibt Zählstreuung bei definierter Exposition. Detektionsverluste und inhomogene Verteilung begrenzen den Umweltschluss. |
| Nitrat-Untersuchung | Die interessierende Konzentrationsgröße im definierten Wasserbereich schätzen | Zuerst Umweltstichprobe und Laborwiederholungen trennen; Normalfehler sind ein mögliches analytisches Teilmodell. |
| Unterschiedliche Umweltproben | Heterogenität verstehen und Zielgröße beibehalten | Lognormal ist ein Kandidat für positive schiefe Größen. Transformation ändert nicht automatisch das Untersuchungsziel. |
| Von einer Stichprobe zum Schätzer | Aus unseren Werten einen Schätzwert bilden | Die Streuung gedachter Wiederholungsstichproben erklärt seine Unsicherheit. Die Simulation ist keine Forderung nach 5.000 realen Untersuchungen. |
| Mehr Proben und Standardfehler | Präzision der Schätzung bei begründetem Design einordnen | CLT und SE betreffen den Schätzer unter Voraussetzungen; sie erzeugen keine Repräsentativität. |
| Unbekannte Streuung | Auch die Streuung muss aus Daten geschätzt werden | Chi-square/t erklären die zusätzliche Unsicherheit unter dem jeweiligen Normalmodell. Keine exakte t-Aussage für beliebige schiefe Umweltwerte. |
| Analytisches Verfahren | Prüfen, welchen Beitrag die Methode zur Streuung leistet | F ist eine bedingte Referenz für Varianzvergleiche, kein Gütesiegel für die Umweltstichprobe. |
| Modellkontrolle | Die Grundlage der verwendeten Auswertung kritisch prüfen | KS/Pearson können Modellabweichungen anzeigen; Nichtverwerfen bestätigt weder Wahrheit noch Repräsentativität. |
| Ergebnisbericht | Schätzwert, Unsicherheit, Bezugsraum/-zeit und Grenzen gemeinsam berichten | Rückkehr zur Untersuchungsfrage, nicht bloß eine Zusammenfassung von Verteilungsnamen. |

Vorwärtsrechnungen mit vorgegebenen Parametern bleiben als Werkzeuge erhalten:
Sie erklären die Stichprobenstreuung oder eine Referenzverteilung. Ihre Zahlen dürfen
nicht als Schätzung aus vorhandenen Messdaten erscheinen. Insbesondere bleiben
10.45 mg/L und das 95%-Quantil Aufgaben zur Modellwahrscheinlichkeit, nicht nachträglich
ein Konfidenzintervall oder eine Aussage über den gesamten Wasserkörper.

## 4. Folienweise Prüfung des vollständigen Hauptpfads

Die Reihenfolge unten ist die aktuelle Reihenfolge, kein bereits umgesetzter Umbau.
Jede Zeile benennt eine konkrete Überarbeitung oder eine beizubehaltende Rolle.

| Nr. | Szenen-ID | Befund und Auftrag |
| --- | --- | --- |
| 1 | `ex:l5-b01-scene--scene` | Den Untersuchungsauftrag einer definierten Wasser-Grundgesamtheit im PFAS-Einstieg sichtbar machen; Klassifikation bleibt von wahrem Zustand getrennt. |
| 2 | `ex:l5-b02-scene--scene` | Zehn ausgewählte Umweltproben als Stichprobe der Zielgesamtheit erklären; wechselnde Anzahlen bedeuten wechselnde beobachtete Häufigkeiten. |
| 3 | `ex:l5-b03a-scene--scene` | Reihenfolgenrechnung als Herleitung der Stichprobenzählung markieren, nicht als eigenes Prognoseziel. |
| 4 | `ex:l5-b03b-scene--scene` | Den Schritt von einer Reihenfolge zur Anzahl mit der beobachteten Stichprobenhäufigkeit verbinden. |
| 5 | `ex:l5-b04-scene--scene` | Parametervergleich behalten; ausdrücklich zwischen angenommener Populationswahrscheinlichkeit und geschätzter Stichprobenhäufigkeit wechseln. |
| 6 | `ex:l5-b05-scene--scene` | Null Befunde als Problem einer Aussage über unbekannte Befundhäufigkeit rahmen. Die 10.74%-Rechnung bleibt bedingte Modellrechnung, kein Konfidenzniveau. |
| 7 | `ex:l5-b06-scene--scene` | Zentrale Designfolie, nicht nur Annahmencheck: Umweltstichprobe versus Laborwiederholungen und Auswahlverzerrung tragen den weiteren Ablauf. |
| 8 | `ex:l5-p07a-scene--scene` | Warum nur 100 mL untersuchen und was soll das über den Wasserbereich aussagen? Exposition und Auswahl der Teilmenge erläutern. |
| 9 | `ex:l5-p07b-scene--scene` | Zählstreuung erklärt Unsicherheit einer Intensitätsschätzung. Vorgabe vier nicht aus den drei illustrativen Filtern als Schätzung ableiten. |
| 10 | `ex:l5-p07c-scene--scene` | Volumen als Nenner der detektierten Intensität betonen. Größeres Volumen ist nicht automatisch bessere räumliche Repräsentativität. |
| 11 | `ex:l5-p07d-scene--scene` | Modelle nach Stichprobeneinheit und Zielgröße unterscheiden; der Grenzübergang bleibt mathematisches Werkzeug. |
| 12 | `ex:l5-d08a-scene--scene` | PMF als Beschreibung möglicher Stichprobenzählungen einordnen. |
| 13 | `ex:l5-d08b-scene--scene` | Kumulative Wahrscheinlichkeiten als Werkzeug zur Beurteilung von Stichprobenergebnissen erklären. |
| 14 | `ex:l5-d08c-scene--scene` | Kontinuierliche Größen vorbereiten; zuerst benennen, ob eine Konzentration, ein Messfehler oder ein Schätzer variiert. Dreiecksillustration nicht als Umweltnachweis ausgeben. |
| 15 | `ex:l5-d08d-scene--scene` | Wahrscheinlichkeitsintervall und Intervall für einen unbekannten Parameter unterscheiden; gleiche Dreiecksrechnung beibehalten. |
| 16 | `ex:l5-d08e-scene--scene` | Quantile als spätere Referenzbausteine motivieren, nicht als fertige Unsicherheitsaussage zur Umweltkonzentration. |
| 17 | `ex:l5-n09-story1-scene--scene` | Nitrat-Untersuchungsauftrag voranstellen und die gezeigten fünf Werte ausdrücklich als Laborwiederholungen einer entnommenen Probe verorten. |
| 18 | `ex:l5-n09-story2-scene--scene` | „Describe the next measurement result“ ersetzen: Zielgesamtheit, Umweltstichprobe und analytischer Teilbeitrag müssen die drei Story-Schritte werden. |
| 19 | `ex:l5-n09a-scene--scene` | Normalfehler-Modell als Analytik innerhalb der Untersuchung einführen. Sein Erwartungswert ist nicht automatisch der Mittelwert des Wasserkörpers. |
| 20 | `ex:l5-n09b-scene--scene` | Centre/Spread mit geschätztem Konzentrationsniveau und analytischer Präzision verbinden; vorgegebene Parameter als Lehrannahmen kennzeichnen. |
| 21 | `ex:l5-n09c-scene--scene` | Dichteformel begründet die Beschreibung dieser Streuung, nicht die Repräsentativität einer Probe. |
| 22 | `ex:l5-n10a-scene--scene` | 6.68%-Beispiel als bedingte Einzelwertrechnung unterordnen. Nicht mit Wasser-Mittelwertschätzung, Sicherheit oder Grenzwertentscheidung gleichsetzen. |
| 23 | `ex:l5-n10b-scene--scene` | 10.49 mg/L bleibt Modellquantil, keine Grenze für den unbekannten Wasser-Mittelwert. Sein Werkzeugcharakter muss sichtbar sein. |
| 24 | `ex:l5-n10c-scene--scene` | Nicht „Vorhersage abgeschlossen, Schätzung später“ erzählen. Die zentrale Untersuchungsfrage jetzt wieder aufnehmen und die noch fehlende Umweltstichprobe benennen. |
| 25 | `ex:l5-n11a-scene--scene` | Den Vergleich zur tragenden Ebenentrennung machen, nicht zum beiläufigen Wechsel zu einem anderen Thema. |
| 26 | `ex:l5-n11b-scene--scene` | 40 konstruierte Laborwerte erklären nur analytische Wiederholstreuung. Keine neue Information über die räumliche Wasserverteilung behaupten. |
| 27 | `ex:l5-n11c-scene--scene` | 40 konstruierte Standortwerte zeigen eine andere Variationsebene; Standortauswahl und mögliche Gewichtung sind vor einer Umweltaussage offen. |
| 28 | `ex:l5-n11d-scene--scene` | Neben Modellkritik positiv sagen, wie Design, Zensierung und Abhängigkeit die Schätzung beeinflussen. |
| 29 | `ex:l5-l12-story-scene--scene` | Verdünnungsstory begründet Heterogenität zwischen Einheiten, nicht automatisch Lognormalität oder repräsentative Auswahl. |
| 30 | `ex:l5-l12a-scene--scene` | Neuer illustrativer Datensatz muss einem klaren Schätzproblem dienen; keine lose dritte Konzentrationsgeschichte. |
| 31 | `ex:l5-l12b-scene--scene` | Dieselben Werte transformieren; auf der Logskala wird nicht automatisch die interessierende arithmetische Umweltgröße geschätzt. |
| 32 | `ex:l5-l12c-scene--scene` | Zentrale Zielfolie: Median/geometrisches Mittel sind nicht das arithmetische Mittel. Vorgegebener Modellmittelwert ist noch keine Schätzung aus Umweltproben. |
| 33 | `ex:l5-l12d-scene--scene` | Grenzen des Loggens mit dem unveränderten Untersuchungsziel verbinden und zum Schätzer aus einer Stichprobe überleiten. |
| 34 | `ex:l5-c13a-scene--scene` | Das bekannte Modellmittel 10 dient als Simulationswahrheit zur Prüfung einer Schätzmethode; in einer echten Untersuchung ist es unbekannt. Modellwechsel sichtbar begründen. |
| 35 | `ex:l5-c13b-scene--scene` | 5.18 mg/L als Schätzwert aus einer simulierten Stichprobe hervorheben. Auswahlannahme und Abstand zum Simulationsziel erklären, keine Garantie auf Treffgenauigkeit. |
| 36 | `ex:l5-c13c-scene--scene` | 5.000 gedachte Untersuchungen zeigen, wie der Schätzer schwankt; nicht 5.000 reale Wiederholungen als Voraussetzung einer Schätzung verlangen. |
| 37 | `ex:l5-c14a-scene--scene` | Zusammenhang mit Präzision der Mittelwertschätzung ausdrücklich machen; einfache Regel setzt das passende iid-Modell voraus. |
| 38 | `ex:l5-c14b-scene--scene` | Größere Umweltstichproben unter unverändertem Design, nicht mehr Messungen derselben Probe, wenn die Aussage den Wasser-Mittelwert betrifft. |
| 39 | `ex:l5-c14c-scene--scene` | Schätzerstreuung wird kleiner; keine Garantie, dass Auswahlfehler verschwinden oder jede Stichprobe repräsentativ wird. |
| 40 | `ex:l5-c14d-scene--scene` | CLT begründet eine Referenz für standardisierte Schätzfehler; es macht weder Wasserwerte normal noch ein beliebiges Design zulässig. |
| 41 | `ex:l5-c14e-scene--scene` | Gute Grenzen behalten und zur konkreten Unsicherheit der vorliegenden Schätzung zurückführen. |
| 42 | `ex:l5-s15a-scene--scene` | Bisher fünf Laborwiederholungen: diese Daten nicht als fünf Umweltproben einsetzen. Rechenbeispiel als analytischen Teilpfad kennzeichnen. |
| 43 | `ex:l5-s15b-scene--scene` | Was wird hier wiederholt: Laborserie oder Umweltprobenahme? Normalmodell mit SD 0.316 nicht stillschweigend für die Umweltpopulation verwenden. |
| 44 | `ex:l5-s15c-scene--scene` | 0.141 mg/L ist hier analytischer SE. Ein Umwelt-SE benötigt die passenden unabhängigen Einheiten und gegebenenfalls Designgewichte/Abhängigkeiten. |
| 45 | `ex:l5-s15d-scene--scene` | Starke Kernfolie: Auswahlbias und analytischen Bias trennen; mehr Laborwiederholungen lösen beide nicht automatisch. |
| 46 | `ex:l5-t16-variance-story-scene--scene` | Varianzschätzung als Unsicherheitsbaustein der Auswertung motivieren; Studienebene ausdrücklich nennen. |
| 47 | `ex:l5-t16a-scene--scene` | Exakte chi-square-Referenz gehört zu iid-normalen Beobachtungen auf der benannten Ebene, nicht zur beliebigen Umweltstichprobe. |
| 48 | `ex:l5-t16b-scene--scene` | Konstruktion erklärt die Referenz der Streuungsschätzung; nicht zum isolierten Verteilungsporträt werden lassen. |
| 49 | `ex:l5-t16-mean-story-scene--scene` | Den zu schätzenden Mittelwert benennen. Mit vorhandenen fünf Wiederholungen ist es ein analytischer Erwartungswert, nicht automatisch Wasser als Ganzes. |
| 50 | `ex:l5-t16c-scene--scene` | Bekannte Streuung als gedanklichen Referenzfall für Schätzung und Unsicherheit zeigen, nicht als bekannte Umweltwahrheit. |
| 51 | `ex:l5-t16d-scene--scene` | t behandelt geschätzte Streuung unter Normalannahmen; weder „kleine Stichprobe genügt“ noch „alle Schätzprobleme sind t“. |
| 52 | `ex:l5-t16e-scene--scene` | Breitere Tails auf zusätzliche Unsicherheit des benannten Schätzers beziehen. |
| 53 | `ex:l5-t16f-scene--scene` | Mehr Information stabilisiert die Streuungsschätzung unter dem Modell; keine universelle Größe-30-Regel. |
| 54 | `ex:l5-t16g-scene--scene` | Kritische Umfangskorrektur: bestehendes Intervall bleibt analytisches Teilbeispiel. Für einen Umweltmittelwert ist ein eigenes begründetes Beispiel erforderlich. |
| 55 | `ex:l5-f17-story-scene--scene` | Methodenvergleich als Qualitätsfrage der Analytik innerhalb des Untersuchungsablaufs einordnen. |
| 56 | `ex:l5-f17a-scene--scene` | Präzisionsverhältnis vier ist deskriptiv, kein Beleg für Richtigkeit oder Repräsentativität. Fehlende Stichprobenumfänge nicht erfinden. |
| 57 | `ex:l5-f17b-scene--scene` | Nur bedingte F-Referenz; illustrative Freiheitsgrade nicht zu realen A/B-Daten umdeuten. |
| 58 | `ex:l5-f17c-scene--scene` | Zwei Varianzschätzungen erklären zwei Parameter. Anschließend zur Frage zurückkehren, welche Unsicherheit der Ergebnisbericht abdecken muss. |
| 59 | `ex:l5-g19a-scene--scene` | Modellkontrolle als neuen Auswertungsschritt motivieren. Fünf neue Konzentrationen sind ein anderes Beispiel, keine neu ausgewählten Werte zum „Bestehen“ eines Tests. |
| 60 | `ex:l5-g19b-scene--scene` | Vorgabe eines vollständigen Modells und Parameterschätzung aus Daten sind verschieden. Referenz für Passung, nicht für Repräsentativität. |
| 61 | `ex:l5-g19c-scene--scene` | Abstand quantifiziert Modellabweichung, nicht Fehler des geschätzten Wasser-Mittelwerts. |
| 62 | `ex:l5-g19d-scene--scene` | Nichtverwerfen erlaubt keine Aussage „Stichprobe repräsentativ“ oder „wahre Konzentration ermittelt“. |
| 63 | `ex:l5-g19e-scene--scene` | Schutzregeln behalten; Positivzweck ist eine zum tatsächlichen Beobachtungs- und Schätzprozess passende Modellkontrolle. |
| 64 | `ex:l5-p20a-scene--scene` | Partikelgrößenverteilung ist ein anderer Zielparameter als Partikelintensität oder Nitratmittelwert. Übergang und unabhängige Einheit benennen. |
| 65 | `ex:l5-p20b-scene--scene` | Klassenbeiträge erklären Modellabweichung; nicht Konzentrationsunsicherheit. |
| 66 | `ex:l5-p20c-scene--scene` | Approximation für Klassenhäufigkeiten vom exakten Normal-Varianzfall unterscheiden. |
| 67 | `ex:l5-p20d-scene--scene` | Verwerfen betrifft die vorgegebenen Klassenwahrscheinlichkeiten, nicht Sicherheit des Wassers oder Repräsentativität der Auswahl. |
| 68 | `ex:l5-p20e-scene--scene` | Rückbindung: Modellkontrolle ergänzt Probenahme-/Analytikprüfung und ersetzt sie nicht. |
| 69 | `ex:l5-e18a-scene--scene` | Statt Verteilungskatalog die Untersuchungskette und den Beitrag jeder Verteilung zum Schluss von Stichprobe auf Zielgesamtheit zusammenführen. |
| 70 | `ex:l5-e18b-scene--scene` | Abschließenden Bericht mit Zielgröße, Bezugsraum/-zeit, Design, Schätzwert, Unsicherheit und Aussagegrenze fordern. Vorhandenes Laborintervall nicht als Wasserergebnis ausgeben. |

## 5. Prüfung aller sechs Reservefolien

Die Reserve bleibt getrennt. Der Unterschied zwischen beobachtetem Befund und
unbekanntem Zustand darf im Hauptpfad trotzdem nicht nur optional erkennbar sein.

| Reserve | Szenen-ID | Befund und Auftrag |
| --- | --- | --- |
| 1 | `ex:l5-v01-scene--scene` | Als Vertiefung behalten: Entscheidung und wahre Konzentration unterscheiden. Kernunterscheidung bereits in B01 sichtbar benötigen. |
| 2 | `ex:l5-v02a-scene--scene` | Wichtig für Populationsschluss: Positivanteil schätzt ohne geeignetes Fehlklassifikationsmodell nicht automatisch wahre Prävalenz. |
| 3 | `ex:l5-v02b-scene--scene` | Erwartete Zellen erklären unterschiedliche Bezugsgruppen; keine tatsächliche Stichprobe oder Schätzung einer realen Prävalenz. |
| 4 | `ex:l5-v03a-scene--scene` | Festkonzentrations-Wiederholungen dienen der Verfahrenscharakterisierung, nicht der Umwelt-Repräsentativität. |
| 5 | `ex:l5-v03b-scene--scene` | Detektionskurve ist ein analytisches Teilmodell. Logistische Modellwahrscheinlichkeit nicht als Konzentrationsschätzung des Wasserkörpers deuten. |
| 6 | `ex:l5-v03c-scene--scene` | Einheit, Matrix, Kalibrierung und Gültigkeitsbereich gehören zur Aussagegrenze des Ergebnisberichts. |

## 6. Regeln für die nächste authored Überarbeitung

1. Zuerst die Zielgröße und den hypothetischen Probenahmekontext des durchgehenden
   Nitratbeispiels festlegen. Keine unbegründete reale oder rechtliche Entscheidung
   treffen. Keine echte Repräsentativität aus konstruierten Daten behaupten.
2. Jede Story beginnt mit dem Erkenntnisbedarf über den Untersuchungsgegenstand.
   Erst danach folgt die Variation der Beobachtung oder des Schätzers. Zukünftige
   Einzelmessungen sind nicht der Hauptzweck.
3. Auf der Folie muss erkennbar sein, welche Ebene und welcher Parameter gemeint
   sind. Eine dezente Verteilungszeile allein leistet das nicht. Vorhandene semantische
   Karten, Kontexttexte und Diagramme nutzen, keine IDspezialstyles oder mehr Text
   neben bereits dichten Formeln einführen.
4. Beobachtungsmodell und Inferenz unterscheiden: Vorgegebene Parameter erzeugen
   mögliche Stichprobenergebnisse; reale Daten informieren unbekannte Parameter.
   Wahrscheinlichkeiten dürfen nicht ohne Begründung in die Gegenrichtung gelesen werden.
5. „Measured value“, „measurement result“, „environmental sample“, „laboratory repeat“
   und „population mean“ konsistent und der Ebene entsprechend verwenden. Die
   verbliebenen „reading“-Formulierungen auch außerhalb des ersten Reviewpakets ersetzen.
6. Jeden Wechsel von Parameter, Datensatz, Population, Gewichtung oder Zielgröße
   explizit begründen. Kein Umdeklarieren bestehender Wiederholmessungen.
7. Vorhandene Zahlenbeispiele, Modellannahmen und Formeln bleiben erhalten und
   erhalten eine klare Haupt- oder Werkzeugrolle. Keine zugesagten Inhalte
   eigenmächtig entfernen oder in die Reserve verschieben. Neue Formeln brauchen
   vollständige sichtbare authored Legenden auf derselben Folie.
8. Ein Umwelt-Ergebnisbeispiel muss für sein Design und seine Verteilungsannahmen
   neu begründet werden. Insbesondere kein unverändertes exaktes t-Intervall über
   vier lognormal verteilte Umweltwerte legen. Keine nicht vorhandenen Rohdaten,
   Stichprobenumfänge, Messungen oder Methodengüten erfinden.
9. Abschluss und Tests müssen die falsche Ebenenübertragung gezielt verhindern.
   Technische Regression beweist weder Repräsentativität noch Lehrwirksamkeit.
10. Nach konsistentem Quellenstand neu generieren, Layout/Navigation prüfen und
    `npm test` auf unveränderten Quellen ausführen. Bisherige abgebrochene Läufe
    sind kein Validierungsnachweis für die geplante Neuorientierung.

## 7. Noch offen, nicht stillschweigend entschieden

- Konkreter räumlicher/zeitlicher Bezug und Gewichtung der Nitrat-Zielgröße.
- Ein durchgehendes, ausdrücklich konstruiertes Umweltstichprobenbeispiel mit
  passender Unsicherheitsaussage zusätzlich zum bestehenden analytischen Teilbeispiel.
- Verteilung des unveränderten Inhalts auf die verfügbare Lehrzeit: Die ursprünglichen
  180 Minuten einschließlich Pause waren bereits vor KS/Pearson und den Storyfolien
  verplant. Nicht zusätzliche Zeit annehmen oder Kerninhalte streichen.

**Ergebnis dieses Reviews:** Die Vorlesung braucht einen Wechsel ihrer tragenden
Erkenntnisrichtung, nicht nur andere Überschriften. Durchgehend muss die Frage
beantwortet werden, was die jeweilige Stichprobe über welchen Teil des
Untersuchungsgegenstands aussagen kann und welche Unsicherheit dabei bleibt.

### Vollständigkeitsprüfung des Reviews

Beide Pfade wurden erneut direkt aus dem kanonischen TriG-Dataset kompiliert:
70 Hauptszenen und sechs Reserveszenen. Der deterministische Abgleich bestätigt,
dass die beiden Tabellen jede der 76 exakten Szenen-IDs genau einmal und in der
jeweiligen Pfadreihenfolge enthalten. Das prüft die Abdeckung des Reviews, nicht
die Umsetzung der vorgeschlagenen Änderungen oder deren pädagogische Wirksamkeit.
Für diesen dokumentarischen Review wurde kein neuer vollständiger Testlauf gestartet.
