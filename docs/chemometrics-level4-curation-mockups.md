# Level 4 – zwei Vorher-/Nachher-Mockups zur Freigabe

**Schematische Layoutentwürfe, keine implementierten Screenshots.**
Die Raster sollen die Informationshierarchie zeigen; Schrift-/Achsenmaße,
Kontraste und Bedienung müssen erst im lokalen Browser gemäß
[QA-Raster](chemometrics-level4-curation-plan.md#9-visuelles-qa-raster-für-den-pilot-keine-massenerzeugung-jetzt)
nachgewiesen werden. Es wird jetzt kein neuer vollständiger Export erzeugt.

## Mockup 1 – S01: eine Vorhersage statt vollständiger Einstiegswand

**Vorher:**
`C:/Users/PCUser/AppData/Local/Temp/opencode/level4-script-review/slides/opening-table-dark.png`.
Großer Titel, Szenariobox, vierzeilige Tabelle, Viererseriengrafik und mehrere
Takeaways stehen gleichzeitig auf der Unterrichtsfläche. Der Befund des Reviews
betrifft diese Informationskonkurrenz, nicht die wissenschaftliche Qualität der
vier erhaltenen 100er-Reihen.

**Nachher, Startzustand „Kennzahlen“ (einzige Intro-Szene):**

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Gleiche Kennzahlen – dieselben Beobachtungen?                         S01 │
│                                                                          │
│ Zwei konstruierte Konzentrationsreihen · jeweils n = 5 · mg/L              │
│                                                                          │
│                  A                           B                           │
│             Mittelwert 5                 Mittelwert 5                     │
│          Stichprobenvarianz 10        Stichprobenvarianz 10                │
│                     Einheit der Varianz: (mg/L)²                          │
│                                                                          │
│                 Vorhersage: Müssen die Werte gleich sein?                 │
│                                                                          │
│ [Beobachtungen zeigen]     [Zurücksetzen]                    [Details]     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Nachher, Zustand „Beobachtungen“ innerhalb derselben Szene:**

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Gleiche Kennzahlen – dieselben Beobachtungen?                         S01 │
│                                                                          │
│ A/B · synthetisch · n = 5 je Reihe                                        │
│                                                                          │
│  A        ●           ●           ●           ●           ●              │
│  B              ◆     ◆     ◆           ◆                       ◆        │
│           ├─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┤          │
│           1     2     3     4     5     6     7     8     9    10          │
│                            Konzentration (mg/L)                          │
│                                                                          │
│ Gleicher Mittelwert und gleiche SD legen die empirische Anordnung         │
│ nicht fest. Fünf Werte belegen keine Populationsverteilung.                │
│                                                                          │
│ [Kennzahlen] [Beobachtungen ✓] [Zurücksetzen]                 [Details]     │
└──────────────────────────────────────────────────────────────────────────┘
```

Die Markerpositionen stehen schematisch für die **bereits vorhandenen** A-Werte
1,3,5,7,9 und B-Werte 2,3,4,6,10. In der Umsetzung numerisch skaliert, nicht
als manuell gezeichnetes Lehrdiagramm. Quellen: `ex:l4-opening-example`,
`ex:l4-opening-data-a`, `ex:l4-opening-data-b`, `ex:l4-opening-mean`,
`ex:l4-opening-variance`. Die SD kann im Kennzahldetail gelesen werden; eine
Wurzelformel würde nur zusammen mit sichtbarer Symbollegende erscheinen.

**Details/Skript:** vollständige Rechnung, Stichproben-SD-Konvention,
Quellen und Verweis zum späteren Viererset. Die aktuelle Viererset-Grafik bleibt
unverändert erreichbar. S02 beginnt mit einer neuen Rangfrage, nicht mit einer
zweiten Wiederholung der Introthese. Keine Formel muss im Intro dauerhaft stehen.

## Mockup 2 – S17: drei Reihen, eine Darstellung statt neun Minipanels

**Vorher:**
`C:/Users/PCUser/AppData/Local/Temp/opencode/level4-script-review/slides/skewness-matrix-dark.png`.
Das wissenschaftlich nützliche 3×3-Layout kombiniert drei Reihen und drei
Darstellungen samt Achsen, Koeffizienten und ausführlichem Erklärungstext.
Als Skriptabbildung bleibt es erhalten; als Projektion werden die Panels fokussiert.

**Nachher, Fokus „Punkte / kubische Beiträge“:**

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Gleiche Varianz – gleiche kubische Balance?                           S17 │
│                                                                          │
│ [Punkte ✓] [Boxplot] [Histogramm]     [Beiträge zeigen] [Zurücksetzen]      │
│ 3 aus dem Viererset · synthetisch · n = 100 je Reihe                       │
│                                                                          │
│ Uniform         ······················                 g₁ ≈ 0            │
│                                                                          │
│ Normal-like           ··●●●●●●●●··                       g₁ ≈ 0            │
│                                                                          │
│ Rechtsschief         ●●●●●·······   ·    ·    ·          g₁ ≈ 1,759        │
│                                                                          │
│                 ├─────────┬─────────┬─────────┬─────────┤                │
│                20        40        60        80        100               │
│                             Response (a.u.)                              │
│                                                                          │
│ Kubische Beiträge behalten ihr Vorzeichen. Der Koeffizient ist            │
│ dimensionslos – keine Position auf der Messachse.                         │
│                                                        [Formel+Legende]  │
└──────────────────────────────────────────────────────────────────────────┘
```

Die Punkte in diesem Wireframe sind **keine numerische oder vollständige
100-Punkte-Abbildung**. Im Browser werden sämtliche bestehenden Beobachtungen
gerechnet und gezeichnet, inklusive zugänglicher Werte und gemeinsamer Achse.
`g₁` wird als Koeffizient beschriftet, nicht auf der Messachse eingetragen.
RDF-Vorlage: `ex:l4-skewness-matrix`, `ex:l4-shapes-uniform-series`,
`ex:l4-shapes-normal-series`, `ex:l4-shapes-skewed-series`.

**Modusregeln:**

- Pro Zustand genau drei gut lesbare Zeilen, **eine** Darstellungsart. Ein Wechsel
  ändert weder Datenmenge noch Beobachtungs-IDs. Boxen verwenden Typ 7 und
  beobachtete Whisker, Histogramme gemeinsame Kanten und Count-Skalen.
- Die gemeinsame Messachse bleibt beim Punkte-/Box-/Histogrammwechsel gleich.
  Ein Wechsel zu standardisierten Abständen aus S15 ist ein ausdrücklich anderer
  Achsenmodus, kein unbemerkter Rescale.
- „Beiträge zeigen“ ergänzt Vorzeichen/Beitragsstärke, nicht einen neuen Datensatz.
  Farbcodierung plus Text/Strichmuster, keine Farbabfrage ohne zweite Codierung.
- **„Formel+Legende“ ersetzt einen Bereich als gemeinsame Einheit**. Wenn die
  Formel sichtbar ist, bleibt ihre vollständige authored Symbollegende sichtbar;
  kein Dialog darf nur die Legende vor der weiter sichtbaren Formel verstecken.
  Bei zu wenig Platz gemeinsame fokussierte Ansicht, nicht kleinere Schrift.
- „Details“/Skript bewahren das vollständige 3×3-Bild und die Prosa. Das ist ein
  anderes Ausgabeziel, keine als beseitigt dargestellte wissenschaftliche Ressource.

**Freigabefrage:** Ist die Reduktion auf je eine Hauptvisualisierung mit diesen
benannten Zuständen fachlich sinnvoll? Erst danach Typografie, SVG-Geometrie,
Fokus/Reset und 16:9/16:10-Light/Dark im echten Browser umsetzen und nachweisen.
