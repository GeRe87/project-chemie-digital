# Level-5-Pilot: von Messwerten zu Wahrscheinlichkeiten

Status: **Historischer erster Review-Entwurf**. Die lokale Anwendung verwendet
inzwischen `ontology/dataset/chemometrics-level5-script.trig`. Die anschließenden
Live-Rückmeldungen G1 (positive Erklärungen) und G2 (echte mathematische Symbole)
präzisieren diese erste Fassung; die folgenden Entwurfsformulierungen dokumentieren
den Ausgangspunkt und sind keine zweite aktive Lehrtextquelle.
Basis: `a07792de`; Regeln: [Arbeitsentwurf v0.2](teaching-authoring-rules-draft.md).
Lehrtext bleibt entsprechend Level 5 englisch; Review und Begründungen deutsch.

## 1. Abgegrenzter Pilot

Thema: **From measurement variation to probability statements**.

Der Abschnitt entwickelt einen einzigen Zusammenhang: Ein Modell beschreibt
Variation; Dichteflächen geben Intervallwahrscheinlichkeiten; die CDF sammelt
Wahrscheinlichkeit bis zu einer Grenze; ein Quantil kehrt diese Fragestellung um.
Er ist keine Folge von Folienkommentaren. Seine Unterabschnitte können unabhängig
von der Präsentationsreihenfolge gelesen und angeordnet werden.

Nicht Gegenstand: Normaldichte herleiten, Modellanpassung, empirische Quantile,
neue Daten, zusätzliche Simulationen oder die Überarbeitung aller 41 Szenen.
Die bestehenden Formeln, Parameter und Experimente werden hier nicht verändert.

### Bereits vorhandene semantische Grundlage

Präfixe: `ex:` = `https://w3id.org/project-chemie-digital/resource/`;
Graphbasis = `https://w3id.org/project-chemie-digital/graph/`.

| Inhalt | Bestehende Ressourcen | Benannter Graph |
| --- | --- | --- |
| Definitionen von PDF, CDF und Quantil | `ex:l5-pdf-definition`, `ex:l5-cdf-definition`, `ex:l5-quantile-definition` | `knowledge/distribution-functions` |
| Messkontext und Stichprobe | `ex:pc-process-info`, `ex:pc-growth-info` | `knowledge/level5-review-pdf-cdf` |
| Intervallwahrscheinlichkeit und vollständige Legende | `ex:pc-area`, `ex:pc-area-legend`, `ex:pc-area-symbol` | `knowledge/level5-review-pdf-cdf` |
| Vergleich Histogramm/Modelldichte | `ex:pc-density` | `knowledge/level5-review-pdf-cdf` |
| Zusammenhang PDF/CDF/Quantil | `ex:pc-functions`, `ex:pc-functions-legend`, `ex:pc-linked` | `knowledge/level5-review-pdf-cdf` |
| Allgemeine fachliche Quellenreferenz | `ex:l5-source-r-distributions` über die genannten Definitionen | vorhandene Referenzen beibehalten |

Die Tabelle dokumentiert Rückverfolgbarkeit, nicht die Behauptung, dass ein
Diagramm die mathematischen Aussagen beweist. Die Quellendeckung des endgültigen
Lehrtextes bleibt vor Übernahme redaktionell zu prüfen.

### Ist-Diagnose

- Die bisherigen Narrationen von `ex:pc-n08`, `ex:pc-n09` und `ex:pc-n10`
  enthalten die nötigen Grundideen, folgen aber den Szenengrenzen.
- Der Übergang von beobachteten Anteilen zu Modellwahrscheinlichkeiten ist
  knapp. Warum man von einer Höhe zur Fläche übergeht, braucht einen erklärten
  Zusammenhang statt nur die Feststellung „probability is area“.
- CDF und Quantil erscheinen bereits gemeinsam in einem Formelblock. Das
  Script muss sie trotzdem in einer nachvollziehbaren Gedankenfolge erschließen.
- Die Fragen in `ex:pc-n03` werden über mehrere spätere Schritte aufgegriffen.
  Diese Szene ist deshalb **kein unmittelbares Frage–Antwort-Paar** mit der
  nächsten Szene. Wir dürfen sie nicht durch ein neues Label dazu erklären.

## 2. Script: vorgeschlagener zusammenhängender Lesetext

Die folgenden vier Unterabschnitte bilden zusammen einen thematischen Abschnitt.
Die Formel ist unverändert aus `ex:pc-area` übernommen; die Legende erläutert
auch die erst anschließend ausführlicher behandelte CDF. Es gibt hier bewusst
keine Foliennummern, Bedienanweisungen oder aneinandergereihten Sprechertexte.

### From repeated measurements to a model

Repeated measurements of the same homogeneous nitrate sample do not necessarily
give identical results. Injection, flow, temperature and electronics contribute
to variation, even when the sample itself has not changed. To describe that
variation, we distinguish the results actually observed from a probability model
for a result obtained under specified measurement conditions.

In the teaching simulation, individual results follow an assumed Normal model
with an expectation of 10.00 mg/L and a standard deviation of 0.10 mg/L. Increasing
the number of simulated results reveals the assumed shape more clearly, but it
does not change the model's standard deviation. The histogram describes the
finite set generated in that run; the smooth density curve describes the model
used to generate it. Their agreement in a simulation is therefore not independent
evidence that laboratory measurements follow the same model.

### Why an interval probability is an area

Once a model has been specified, we can ask how likely an individual result is
to fall within a chosen concentration interval. For a model with a probability
density, the answer depends on both the height of the density and the width of
the interval. A high, narrow region can contain less probability than a lower,
wider one. Reading the curve's height alone therefore does not answer the question.

Integrating the density over the interval combines these two contributions. The
result is an area, expressed as a dimensionless probability rather than a density
height. The same probability can also be obtained by subtracting the accumulated
probability at the lower boundary from that at the upper boundary:

$$
P(a\le X\le b)=\int_a^b f(x)\,dx=F(b)-F(a)
$$

**Symbols and conditions for this formula**

- **$X$:** random individual nitrate concentration, in mg/L.
- **$x$:** concentration coordinate used in the integration, in mg/L.
- **$a,b$:** lower and upper concentration bounds, with $a\le b$, in mg/L.
- **$P$:** probability of the event inside the parentheses, dimensionless.
- **$f(x)$:** model probability density at $x$, in L/mg.
- **$F$:** cumulative distribution function; $F(a)$ and $F(b)$ are the
  probabilities at or below the respective bounds, dimensionless.
- **$\int_a^b$:** integrate from the lower bound $a$ to the upper bound $b$.
- **$dx$:** infinitesimal concentration increment, in mg/L.
- **$\le$:** less than or equal to; the event includes both endpoints.
- **$=$:** equality of the three probability expressions; **$-$:** subtraction.
- **Parentheses:** enclose the event for $P$ and the function arguments for $f$
  and $F$; juxtaposition with $dx$ means multiplication inside the integral.

This expression assumes an absolutely continuous model: its density is
nonnegative and integrates to one over the full concentration axis. Each exact
concentration has zero point probability, so including or excluding an interval
endpoint does not change the probability. A rounded laboratory report instead
represents a concentration interval at the stated measurement resolution.

The observed fraction of simulated results inside the interval provides a
different quantity: a summary of the finite sample. It can differ from the model
probability because the generated results vary from run to run. Keeping the two
quantities separate allows the histogram to illustrate sampling variation without
turning it into the definition of the probability model.

### Accumulating probability up to a threshold

Many analytical questions concern everything at or below a concentration limit
rather than a bounded interval. The cumulative distribution function, or CDF,
answers this question directly. For a model with a density, its value at a
threshold is the density area accumulated from the lower end of the concentration
axis up to that threshold. The PDF and CDF thus describe the same model, but their
vertical axes have different meanings: the PDF shows density, whereas the CDF
shows accumulated probability.

As the threshold moves through a high-density region, probability accumulates
rapidly and the CDF rises steeply. In a low-density region, it rises more slowly;
where the derivative relation holds, its slope equals the density. This is a
relationship within the model, not a comparison of two independent datasets.
Every probability distribution has a CDF, but the density-area explanation requires
a model that possesses a density; it must not be transferred unchanged to discrete
probability masses.

### Reversing the question: from probability to concentration

The CDF starts with a concentration threshold and returns a probability. We can
also start with a desired probability and ask which threshold corresponds to it.
The model quantile answers this reversed question. For the continuous Normal and
bounded uniform examples used here, the 0.95 quantile is the concentration with
95% of the model probability at or below it. It does not promise that exactly 95%
of a particular finite sample will fall below that value.

More generally, a quantile is the lowest threshold at which the CDF reaches or
exceeds the chosen probability. At a probability jump, the accumulated probability
can exceed the requested value. This broader definition preserves the connection
between a probability and its threshold without assuming that every CDF has an
ordinary inverse. It also distinguishes a theoretical model quantile from an
empirical percentile computed from a finite set of observations.

Density, CDF and quantile are therefore complementary ways to use one probability
model: integrate over an interval, accumulate up to a threshold, or find a
threshold for a chosen accumulated probability. Choosing the tool starts with the
analytical question, not with the visual shape of a curve.

## 3. Folienlogik für denselben Zusammenhang

Dies ist ein **Text-/Funktionsentwurf**, keine bereits gerenderte Folienänderung.
Die bestehenden beiden benachbarten Pfadschritte bleiben die Reviewreferenz:
`ex:rc09` → `ex:pc-n09` (Position 5), danach `ex:rc10` → `ex:pc-n10` (Position 6).
Das Script übernimmt weder diese Reihenfolge als Strukturvertrag noch die
Textbausteine wortwörtlich.

### A — Intervallwahrscheinlichkeit erklären, Anschlussfrage eröffnen

Referenz: `ex:pc-n09`, vorhandenes Experiment `ex:pc-density` und Formel
`ex:pc-area` mit vollständiger Legende.

- **Erkenntnisschritt:** Dichtehöhe, Intervallfläche und beobachteten Anteil unterscheiden.
- **Titelvorschlag:** “Probability belongs to an interval, not to a curve height.”
- **Orientierung:** “The histogram contains 1,000 simulated results. The smooth
  curve is the assumed model density; the shaded region marks the chosen interval.”
- **Quintessenz:** “The shaded area is the model probability. The observed sample
  fraction can differ.”
- **Anschlussfrage Q1:** “Which concentration leaves 95% of the model probability
  at or below it?”

Der Kontext muss den aktuell gewählten Modelltyp korrekt benennen. Die Aussage
über 1,000 simulierte Ergebnisse gilt für diese vorhandene Referenzkonfiguration;
falls die Anzahl später veränderlich wird, muss auch der Text daran gebunden sein.
Die Frage ist eine Anschlussfrage nach einem erklärten Befund, keine reine Fragefolie.

### B — Dieselbe Frage mit CDF und Quantil beantworten

Referenz: `ex:pc-n10`, vorhandenes Experiment `ex:pc-linked` und Formeleinheit
`ex:pc-functions` mit vollständiger Legende.

- **Fragebezug:** Q1 aus A, nicht eine neu formulierte andere Aufgabe.
- **Titelvorschlag:** “A model quantile turns probability into a concentration threshold.”
- **Antwort A1, als Referenzbeispiel gekennzeichnet:** “Choose cumulative probability 0.95. Its model quantile is the
  concentration with 95% probability at or below it.”
- **Begründung am Bild:** “In the density plot, read the area to the left of the
  threshold. In the CDF plot, read the same probability as a height.”
- **Quintessenz:** “A threshold gives a probability through the CDF; a chosen
  probability gives a threshold through the quantile.”

**Wichtiger Zustandskonflikt:** Das bestehende Experiment erlaubt andere
Wahrscheinlichkeiten als 0.95. Ein Titel wie „The 0.95 quantile gives the
concentration threshold“ wäre ohne Zustandsbindung daher ungeeignet. Der
vorgeschlagene Titel bleibt allgemein, A1 wird als Referenzbeispiel sichtbar vom
aktuellen Ergebnis getrennt. Eine spätere dynamische Antwort wäre eine zusätzliche,
explizit zu modellierende Variante, keine Textersetzung nach Zahlenmustern.

**Kein verstecktes Inhaltskürzen:** `ex:pc-functions` enthält zusätzlich die
Ableitungsbeziehung. Dieser Pilot hat sie im Script erklärt. Auf der bestehenden
Folie bleibt sie zunächst samt Legende erhalten; sollte sie die Antwortführung
überlasten, wäre ihre Aufteilung in referenzierbare Formeleinheiten ein gesonderter
semantischer Änderungsschritt, kein stilles Weglassen im Renderer.

## 4. Was wir aus dem Pilot an den Regeln nachschärfen

| Regel | Konkrete Anwendung | Prüffrage / mögliche Nachjustierung |
| --- | --- | --- |
| F1–F3 | A trennt Bildbeschreibung, Aussage und beobachteten Anteil | Ist die Quintessenz ohne mündlichen Zusatz verständlich? |
| F4 | Q1 auf A wird durch A1 auf dem unmittelbar folgenden Schritt B beantwortet | Reicht eine Anschlussfrage oder braucht es hier eine eigene Fragefolie? Keine zusätzliche Szene ohne Abstimmung. |
| F6 | 0.95 ist Referenzbeispiel, kein unveränderlicher Livewert | Referenz-/Live-Geltungsbereich muss auch für Titel und Fragen gelten. |
| S1–S3 | Modell → Intervall → Akkumulation → Umkehrfrage | Ist jede fachliche Überleitung nachvollziehbar, oder fehlt ein Zwischenschritt? |
| S4–S5 | Ein thematischer Text statt drei Szenennarrationen | Die längere Erklärung und vollständige Legende dürfen den Lesefluss nicht in eine Liste auflösen. |
| S6–S7 | Frage wird im Themenabschnitt entwickelt und beantwortet | Keine künstliche Unterbrechung an der Foliengrenze. |

Erste Präzisierungen zur Diskussion:

1. **Antworten brauchen einen Geltungsbereich:** allgemein, Referenzzustand oder
   aktueller Experimentzustand. Das betrifft nicht nur die Quintessenz, sondern
   auch Überschriften und die Frage selbst.
2. **Mehrteilige Formelressourcen sind nicht automatisch gute Erklärungseinheiten.**
   Wir dürfen ihre Bestandteile für verschiedene Ausgaben nur explizit und mit
   vollständigen Legenden auswählen, nicht anhand von Texttricks abschneiden.
3. **Ein Script muss nicht jede Bedienfunktion eines Experiments erklären.**
   Fachliche Bedeutung gehört in den Lesetext; Bedienhilfe bleibt eine andere Ressource.

## 5. Semantischer Vertrag: vorhandene Bausteine und echte Lücken

Vorhanden und wiederverwendbar:

- `cd:StatementRole` und `cd:KeyPointRole` für die Darstellung kurzer Aussagen;
  eine neue Rendererrolle „Quintessenz“ ist nicht allein für eine neue Box nötig.
- `cd:Interpretation` mit `cd:interpretsResource` zum Verknüpfen einer Deutung mit
  einem Lerninhalt; diese Relation ist kein formaler Beweis.
- `dct:subject` und `dct:references` für Themen- bzw. Quellen-/Inhaltsbezug,
  `cd:body` für sprachmarkierte Prosa und `dct:hasPart` für Bestandteile.
- `cd:position` ist im Vokabular vorhanden. Sie allein definiert aber weder eine
  Scriptstruktur noch eine pfadbezogene Platzierung wiederverwendbarer Abschnitte.

Noch zu spezifizieren, bevor kanonische Daten oder Compiler geändert werden:

| Benötigte Bedeutung | Minimaler Vertragsvorschlag, noch kein eingeführtes Vokabular |
| --- | --- |
| Eigenständiges Script | Dokument mit Kapitel-/Abschnittsverwendungen und eigener Lesereihenfolge; kein verkleideter `SceneDocument` |
| Wiederverwendbarer Themenabschnitt | identifizierbarer Inhalt mit Thema, Titel, Prosa und expliziten Formel-/Abbildungsreferenzen |
| Geordnete Inhaltsblöcke | Prosa, Formel-/Legendeneinheit und statische Abbildung in einer expliziten Folge; keine HTML- oder LaTeX-Fragmente im Wissensmodell |
| Kapitel-/Abschnittsverwendung | eigener Verwendungsknoten für Reihenfolge und gegebenenfalls Kontext; die wiederverwendbare Ressource selbst erhält keine global gültige Kapitelnummer |
| Frage und Antwort | identifizierbare Frage und Antwortinhalt plus explizite Antwortbeziehung; nicht automatisch eine bewertete Übung |
| Konkretes Paar Q1 → A1 | Zuordnung der beiden Verwendungen zu `ex:rc09`/`ex:rc10` innerhalb des exakten Pfad-/Graphpaares |
| Bezug Webscript ↔ Vortrag | mehrere Inhalts-/Themenzuordnungen möglich; kein notwendiges Feld „zugehörige Folie“ auf jedem Absatz |
| Zustandsabhängige Aussage | expliziter Geltungsbereich und gegebenenfalls typisierte Ergebnisbindung; keine Ableitung aus einem Satz mit „0.95“ |

Nicht zulässig wäre, `cd:usesResource` einfach für Scriptabschnitte zu übernehmen:
Seine bestehende Domain ist `cd:PathStep`. Ebenso hat `cd:communicativeRole` die
Domain `cd:SceneItem` und `cd:narration` gehört derzeit zur Szene. Diese Prädikate
würden bei unbedachter Wiederverwendung die Ebenen vermischen. Der additive
Vertrag muss diese Grenzen respektieren und braucht anschließend SHACL- und
Compilerprüfungen. Neue IRIs werden nicht nebenbei im Lehrtext eingeführt.

### Geplante Prüfungen nach Übernahme des Vertrags

- Scriptstruktur ist eindeutig geordnet, Referenzen lösen sich auf, Hierarchie
  ist azyklisch und alle verwendeten Inhalte haben eine explizite Sprache.
- Jede eingebundene Formel bleibt mit ihrer vollständigen Legende verbunden;
  HTML und PDF erhalten dieselbe geordnete fachliche Fassung.
- Q1/A1 sind in genau diesem Lernpfad gebunden; die unmittelbare Folge wird aus
  aufgelösten Positionen geprüft, nicht aus alphabetischer Reihenfolge oder IRI-Namen.
- Das Entfernen/Umordnen eines gebundenen Schritts führt zu einem sichtbaren
  Strukturfehler, nicht zu einer stillschweigend neu geratenen Antwort.
- Kein Test wertet bloß Satzanzahl, Wortzahl oder ein vorhandenes „daher“ als
  bestandene Leseflussprüfung. Diese Qualität bleibt Gegenstand des Textreviews.

## 6. Review vor der Umsetzung

Zuerst beurteilen wir den zusammenhängenden Lesetext und A/Q1/B/A1 gemeinsam.
Danach präzisieren wir die Regeln und den additiven RDF-Vertrag. Erst die
abgestimmte Fassung wird kanonisch in TriG authored und für einen HTML-/LaTeX-
Vergleich projiziert. Dieser Entwurf wird danach als Reviewhistorie behalten,
nicht als zweite gepflegte Lehrtextquelle verwendet.

Noch nicht erfolgt: aktiver Folien-/Scriptumbau, Ontologie-Erweiterung,
LaTeX-Kompilierung, PDF- oder Browserabnahme, Commit, Merge oder Veröffentlichung.
