# Testprofiling — Entwurf für Phase 1

Bezugsstand: `chemometrics@3f0f9700ad191a917df5ee4df877dc2a91118dd4`.
`npm test` bleibt das autoritative Gate. Dieses Dokument definiert keine
Testausnahme, kein neues PASS und keine geänderte Statuspolicy.

## Tatsächlicher Aufrufgraph

Root `package.json` serialisiert per `&&`:

| Nr. | Phase | Tatsächlicher Prozess / Untergraph | Erzeugte bzw. vorausgesetzte Artefakte |
| --- | --- | --- | --- |
| 1 | `check:json` | `node scripts/check-json.mjs` | entdeckt Konfigurations-JSON; keine Semantic-Quelle |
| 2 | `typecheck` | `tsc --noEmit` | lokales TypeScript aus Lockfile nötig; generierte Imports bleiben `unknown` |
| 3 | `test:json-discovery` | `node --test scripts/json-candidates.test.mjs` | isolierte JSON-Discovery-Fixtures |
| 4 | `test:semantics` | `python -m unittest discover -s tests -v` | gesamtes Python-Testinventar; SHACL, negative Fixtures, Compiler, Transport, Builds, teils Node-Unterprozesse |
| 5 | `test:core` | Workspace → Node Type-Stripping + `test/*.test.ts` | reine Verträge sowie Testfixtures; tatsächliche Dateizugriffe vor Parallelisierung auditieren |
| 6 | `test:semantic-client` | Node `packages/semantic-client/test/*.test.mts` | Abgrenzung optionaler Fuseki-Integration beachten |
| 7 | `test:learner-state` | Node `packages/learner-state/test/*.test.ts` | lokale Lernzustandsverträge |
| 8 | `test:renderer-reveal` | Workspace → Node `test/*.test.ts` | Core-/Shared-Verträge und Kompositionsregeln |
| 9 | `test:renderer-d3` | Workspace → Node `test/*.test.ts` | wissenschaftliche Berechnung/Diagrammregression |
| 10 | `test:renderer-self-study` | Node entsprechende `test/*.test.ts` | Shared-/Core-Rendering |
| 11 | `test:renderer-latex` | `preview:level5:generate` → `preview:level5:review-complete:generate` → Python Authoring-Preview → Node LaTeX-Tests | Level-5-Preview-JSON/-HTML; nicht automatisch vollständiger LuaLaTeX-Build |
| 12 | `generate:runtime` | Python Canonical Runtime ohne Auswahlargumente | Standardabweichung-default, `apps/pitch/src/generated/canonical-runtime.json`, **getracktes `apps/pitch/index.html`** |
| 13 | `check:runtime` | derselbe Python-Prozessaufruf neu, `--check` | rekonstruiert und vergleicht JSON und HTML; ist kein bloßer Datei-Existenzcheck |
| 14 | `test:pitch` | Workspace: Python Generate → Python `--check` → Root Level-4-Preview Generate → Node Pitch-Tests | erneute default-Generierung/-Prüfung und isolierte Level-4-Preview |
| 15 | `test:self-study` | `generate:self-study`: Python Offering-Artifact (en) → Node Static Generate → Node App-Tests | Self-Study-JSON und statische Ansichten |

`build_artifact()` assembliert Dataset, wählt einen exakten Pfad, berechnet
Fingerprint, kompiliert Szenen, Snapshot, Offering und Script. Offering-Generierung
kompiliert alle vollständig szenengebundenen Pfade. Die Canonical-Runtime-Funktionen
führen nicht selbst den vollen `validate_semantics.run_validation()`-Gate aus.
Deshalb Compiler- und SHACL-Kosten nicht fälschlich gleichsetzen.

## Zusätzliche Gates separat führen

- `check:semantics`: eigener Python-Prozess mit voller kanonischer SHACL-Prüfung.
- `build:chemometrics` / `check:chemometrics-build`: gepinnte Abhängigkeiten,
  SHACL, Kursauswahl, Vendorintegrität, Vite, Transport-/Dateiinventar.
- `verify:release -- --offline`: Doctor/Browser-Preflight → vollständiges
  `npm test` → Produktionsbuild → Artefaktprüfung → temporärer lokaler Server
  und Smoke des gebauten Produkts. Nicht zusätzlich blind nach einem bereits
  laufenden Full-Gate starten. Ein solcher Lauf enthält die vollständigen Tests.
- `test:browser`: gebaute Seiten, beide Themes, alle Level, echte lokale R-Ausführung,
  Stop/Recovery, Navigation, Legendendisclosure, Mobile, Fehler-/Retrypfad,
  JavaScript-freie statische Ausgabe und repräsentative Slides-PDF-Ansicht.
- `test:browser:extended`: zusätzliche umfassende Workbench-Probe, eigener Auftrag.
- Script-PDF: `script:pdf` / `check:level5:pdf`, installierte LuaLaTeX-Toolchain,
  Inhalts-/Pfad-/Graphbindung, vollständige Legenden, Fonts/Referenzen/Artefakthashes.
  Browserdruck und ein kompilierter Script-PDF-Export sind getrennte Produkte.
- Fokussierte `scripts/*_browser.cjs` / `tests/browser_pitch_*.py`: dokumentierte
  Previews/Ports; keine pauschale Behauptung, sie seien alle in `npm test` enthalten.
- Externer Status `agent-validator/project-chemie-digital` auf exaktem PR-HEAD
  und unabhängige Abnahme bleiben zusätzlich erforderlich.

## Eine reproduzierbare Baseline

1. Frischen isolierten Messklon/Branch an exakt dokumentiertem Remote-SHA erstellen.
   Bereits aktive Klone, lokale Vorlesung, Server und Worktrees bleiben erhalten.
2. OS, CPU/RAM als optionale Metadaten, Interpreterpfade/-versionen, Git-Status,
   `core.autocrlf`, Lockfile-Hashes, Python-Pins und relevante Generatorinputs erfassen.
   Keine Environment-Dumps oder Auth-Ausgaben in Messdateien.
3. Python-venv frisch erstellen, Pins installieren, `npm ci --no-audit` aus Lockfile.
   Installationszeit separat erfassen. Keine Lockfile-Neugenerierung und kein
   pauschales Dependency-Upgrade. Doctor muss für die geplanten Gates bestehen.
4. Exklusives Full-Gate-Zeitfenster koordinieren. Prozessmarker allein sind kein
   vollständiger Lock. Höchstens ein teurer Gate auf diesem Host; bei Unklarheit
   Messung verschieben und technische Vorbereitung fortsetzen.
5. **Genau einen** unveränderten `npm test`-Aufruf beobachten. Externes Messprogramm
   unter `.local/control-tower/p1a/`, ohne package.json-/Test-/Produktänderungen.
   stdout und stderr getrennt, pro Lifecycle-Start monotone Empfangszeit und UTC;
   Eltern-/Kind-Prozesszeit, Peak-RSS optional. Keine Behauptung vollständiger
   Test- oder Fixturezeiten aus bloßen gepufferten Logzeilen.
6. Elternexit sofort übernehmen. Ab Fehler sind nachfolgende `&&`-Phasen
   `not_run`, niemals PASS. Kein automatischer Retry. Ursprüngliche Fail-fast-
   Semantik bewahren. Für einen späteren gezielten Diagnoseversuch neue Run-ID.
7. Frischer npm-Abhängigkeitsbaum ist kein garantiert kalter OS-Cache. Für jeden
   Datensatz Cachezustand und Unsicherheit explizit angeben. Ein Warmvergleich ist
   ein später begründeter eigener Versuch, kein mehrfacher unkontrollierter Full-Run.
8. Start-/End-SHA und Status, erzeugte Pfade und SHA-256 der Logs/Reports sichern.
   Generierung kann getracktes `apps/pitch/index.html` ändern. Solche Änderungen
   erhalten und berichten; nicht resetten, wegstagen oder als Workerimplementierung
   committen. Ein schmutziger Messklon ist kein sauberer CAC-Verification-HEAD.

Vorgeschlagene erste Budgets: 90 min Gesamtversuch, 60 min Python-Phase,
10 min pro sonstiger Phase, maximal 20 MiB je Rohlog und 500 MiB Messartefakte.
Der Beobachter setzt anfangs ein `running/incomplete`-Manifest. Bei überschrittenem
Budget nur selbst gestartete Testprozesse kontrolliert beenden, niemals fremde
Server; Abbruch als `incomplete/timeout`, Exit 124 mit originalem Prozessstatus,
keine PASS-Übertragung. Diese Grenzen sind Messbudgets, keine Lockerung eines Gates.
Falls Prozessbaumkontrolle nicht zuverlässig möglich ist, nicht unbeaufsichtigt starten.

Minimales Datenformat je Phase:

```json
{
  "run_id": "unique-observation-id",
  "product_sha": "40-character-tested-sha",
  "command": ["npm", "test"],
  "phase": "test:semantics",
  "started_utc": "ISO-8601",
  "duration_seconds": null,
  "exit_code": null,
  "status": "not_run|running|passed|failed|incomplete",
  "cache_state": "documented, not assumed",
  "test_inventory_sha256": "digest",
  "stdout_sha256": null,
  "stderr_sha256": null
}
```

Dies ist eine Beobachtungsstruktur, kein neuer CAC-Akzeptanzvertrag.

## Vertiefungs- und Optimierungsmatrix

| Hypothese / Befund | Messung nach erster Baseline | Zulässiger kleiner Kandidat | Äquivalenznachweis |
| --- | --- | --- | --- |
| 83 Assembly-Aufrufstellen und 20 Artifact-Aufrufstellen; einmaliges Assembly 2,817 s, Fingerprint 4,074 s | tatsächliche Aufrufanzahlen und kumulierte Zeit pro Prozess; AST-Zahlen reichen nicht | eng begrenzte unveränderliche Fixture-Wiederverwendung in einem Testmodul | gleiche Test-IDs/Assertions, isolierte Mutation, umgekehrte Parse-Reihenfolge, Named-Graphs und Blank-Nodes weiterhin prüfen |
| Kanonische SHACL-Prüfung hat bereits `lru_cache(maxsize=1)` | Cache-Info und Modulidentität im gemeinsamen unittest-Prozess; Profil für RDFS, meta-SHACL, SPARQL | erst nach Messung; kein globaler Diskcache als Standard | kanonischer Gate vollständig, Mutationstests ungecachet, Graphpurität, Infos/Warnings weiterhin Fehler |
| Negative Fixture-Prüfungen können teuer sein | Top-Test-/Setup-Dauern im gezielten Folgeprofil; bei Bedarf `cProfile` einer identifizierten Teilphase | kleinere selbständige Fixtures nur mit nachweislich gleicher getesteter Constraintmenge | positive/negative Fälle, aktive Shape-IRIs, Sprach-/Provenienz-/Cross-Graph-Prüfungen explizit vergleichen |
| Doppeltes Generate/Check vor Root- und Pitch-Test | vier default-Compileraufrufe separat messen, Eingaben und Outputs hashen | später isoliertes vorbereitetes Integrationprofil; öffentliche Standalone-Tests bleiben selbständig | absichtlich veraltete/fehlende JSON- und HTML-Artefakte müssen weiter fehlschlagen; frischer Checkout funktioniert |
| Unabhängige Node-Suites sind serialisiert | Dateizugriffe und Lese-/Schreib-/Generation-Abhängigkeiten inventarisieren | erst reine Suites in getrennten Output-Sandboxes parallelisieren | kein gemeinsames index/runtime- oder Port-Schreiben; alle Fehler vollständig aggregieren; Coverage gleich |
| Prozessstart-/Node-Unterprozesskosten in Python-Tests | tatsächliche Starts und Summen, z. B. Level-5/6-Tests | gezielte Batchung einer klar unabhängigen Probe | gleiche Rohdaten und Negativprüfungen; unveränderte Fehlersignale |
| CRLF-/Codepage-Vorgeschichte | konkrete aktuelle Reproduktion statt alte Handoffs als heutige Fehler ausgeben | eigene portable Fixture-Korrektur falls erneut belegt | LF/CRLF und Windows/POSIX, echte Fehler werden weiter erkannt |

Ein späterer persistenter Cache müsste sämtliche TriG-Dateiinhalte, Shapes,
Compiler/Validatorcode, Python-/RDFLib-/pySHACL-/OWL-RL-Versionen, Inferenz-
und Meta-SHACL-Optionen, Sprache, Auswahl und Ausgabevertrag binden. Mutierbare
Dataset-Objekte dürfen nicht zwischen Tests geteilt werden, wenn deren Isolation
nicht bewiesen ist. Die einmalige Komponentendauer erlaubt noch keine Hochrechnung
auf den gesamten Gate oder eine behauptete Beschleunigung.

## Profile und Exit-Gate

Erst nach Messung explizite Profile vorschlagen:
`test:fast` (fokussiert, Ziel <5 min), `test:integration` (Ziel <15 min),
`test:full` (exakte bisherige `npm test`-Semantik). `npm test` bleibt verbindlich;
Profilnamen werden nicht ungeprüft in externe Validatorpolicy übernommen.
Browser-/Build-/PDF-/Releaseprofile bleiben nach ihrer tatsächlichen Reichweite
benannt. Laufzeitziele sind Vorschläge, keine Garantien.

Für eine Optimierung: gleiche relevante Quelle/Host/Toolchain, dokumentierte
Vorher-/Nachhermessung, vollständige positive und negative Testinventare,
konkrete Fehlerpropagation, keine verschwiegenen Skips, deterministische Artefakte,
exakter geprüfter HEAD und unabhängiger Review. Nur ein belegter Hotspot pro PR.
Raw-Evidenz bleibt außerhalb Git; ein kleiner redigierter Ergebnisbericht reicht
im Produktrepository. Keine Wiederholung des Full-Gates für reine Berichtstexte.
