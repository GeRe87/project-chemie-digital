# Priorisierte Roadmap und Schreibbereiche — Entwurf

Basis und Befunde: [Phase 0](phase-0-20261109.md).
Eigentümerentscheidung: CAC soll Ausführungsengine unter CDAC werden.
Die folgenden Pakete sind geplant, noch keine gleichzeitig aktivierten Aufträge.
Nur ein OpenCode-Worker je überlappendem Scope, nur ein teurer Full-Gate pro Host.

## Abhängigkeiten und Akzeptanz

| ID / Priorität | Inkrement und Owner | Exklusiver Schreibbereich | Voraussetzungen | Überprüfbares Ergebnis |
| --- | --- | --- | --- | --- |
| P1A / zuerst | Unveränderte Testpipeline messen; QA/OpenCode | `docs/testing/pcd-p1a-baseline.md`; lokales ignoriertes `.local/control-tower/p1a/` | frischer exakter Lehrbranch, gepinnte Installation, exklusives Messfenster | ein originaler `npm test`-Versuch; Phasenzeiten/Exit/Not-run; Quellstatus vorher/nachher; Rohlogs und Hashes; keine Optimierung |
| P1B / P0 | Teuerste Phase isoliert profilieren; QA/OpenCode | ein Bericht `docs/testing/pcd-p1b-hotspot.md`, externe lokale Messartefakte | P1A zeigt einen konkreten Hotspot | Top-Setup-/Funktionszeiten, tatsächliche Aufrufzahlen, geprüfte Verbesserungshypothese; keine neue blinde Full-Wiederholung |
| P1C / P0 | Eine belegte Optimierung; QA oder zuständiger Codeowner/OpenCode | **erst nach P1B** genau ein Test-/Helperbereich benennen; Root-Scripts nur falls dort belegter Hotspot | P1B, eingefrorenes Testinventar, Konfliktcheck | Vorher/Nachher, gleiche relevante Negativabdeckung, reproduzierbare Artefakte, vollständiger Gate und externer exakter Status; keine gelockerten SHACL-Schichten |
| P1D / P1 | Entwickler-/Integrationsprofile; QA/OpenCode | `package.json`, eine gezielte Profilhilfe, `docs/testing/test-profiles.md` | P1A/B, bekannte Artifact-Abhängigkeiten | Fast-/Integrationprofil explizit beschränkt; ursprüngliches `npm test` vollständig; Fresh-Checkout- und Stale-Artifact-Negativfälle |
| G1 / P0 vor Harness-Pilot | Lehrbranch-Governance mit CDAC-Cutover abgleichen; separater Architekturauftrag | zunächst ADR/Änderungsinventar, spätere Governance-Dateien nur nach eigener Freigabe | aktuelles main/chemometrics erneut lesen; Eigentümerziel CAC unter CDAC | genaue Retention/Archivierung, keine reaktivierte Legacy-Lane; native v2 lehnt gemischte Registry ab; historische Inhalte bleiben erhalten |
| C1 / P1 vorbereitbar | CAC-Onboarding-Konfiguration entwerfen; Control-Architekt/OpenCode | `projects/project-chemie-digital/` ausschließlich | Vertragsentwurf; G1 vor Aktivierung; P1A als Testanforderung | `default_base_branch: chemometrics`, exakter Base-Pin, frische Run-Umgebung, private Evidenz; `validate` und pure Promptprüfung ohne reale Workerstarts; CLI `render` mutiert Cache und bleibt separater Schritt |
| C2 / P0 vor Harness-Schreibpilot | Scope- und Gate-Adapter prüfen; separater Control-Review | vorerst ADR/Projektadapter; Engine-/Policyänderung eigener PR | C1, bekannte CAC-Lücken | erlaubte/verbotene Pfade einschließlich Rename/Deletion fail closed; Node/Python in detached Snapshot vorhanden; negative Tests; keine Absenkung bestehender Regeln |
| C3 / P1 | Harmloser CAC/OpenCode-Pilot unter CDAC | nur eigene Pilot-Dokumentation im frischen Product-Worktree; Runtime-Evidenz außerhalb Git | G1/C1/C2 geprüft; sauberer gebundener CAC-Code; freier Host | prepare/start/verify mit expliziter Run-ID, richtige Source-/Configidentität, SHA-/Attempt-/Context-gebundene Evidenz; separater Reviewer, keine Selbstabnahme |
| S1 / nach Testaudit | Story-Gapanalyse und ADR; Ontologiearchitekt/OpenCode | neuer ADR-Entwurf und 1–2 schematische Beispiele in `docs/`; keine aktiven TriG-Änderungen | P1A/B, bestehende ADR-0027/28 und Scripts gelesen | vorhandene Klassen/Rollen vs. fehlende Lernfunktion; Graph-/Version-/Migrationplan; keine frei erfundenen genehmigten IRIs |
| S2 / nach ADR-Review | Minimaler additiver Story-Vertrag | präzise benannte Ontologie-/Shape-Datei, fokussierter Compilerbereich, Core-Vertrag und Negativtests; seriell | S1 separat angenommen, kein Overlap mit #280 | aktivierte neue Pfade fail closed; Altpfade unverändert; Sprache/Named-Graph/Provenienz/Formellegenden durchgängig |
| D1 / nach S2 | Bestehende 6–8 Szenen als Pilot | exakt gewählte TriG-Ressourcen-/Scene-/Path-Dateien plus Audit; generische Rendereränderung separater Auftrag | Pilotwahl mit Liste stabiler Szenen-IRIs, Fachreview | echte Vorher/Nachher-16:9-Screenshots; helle Beameransicht, vollständige statische Begründung; Script/PDF; wissenschaftlich korrekte Werte/Einheiten/Quellen |
| V1 / nach D1 | Deterministische didaktische Prüfungen | begrenztes Validatormodul, Fixtures und Reviewbericht | beobachtete Pilotfehler und klarer Regelvertrag | Quellen/Legenden/Overflow/Kontrast/Readability mit nachvollziehbaren Negativfällen; Fehlermeldungen/Severity/Belege |
| V2 / nach D1, getrennt von Autor | Blind Readback; unabhängiger Reviewer | eigener Reviewbericht; kein Zugriff auf Ausgangs-TriG im Blindteil | gerenderte Bilder eingefroren, Rubrik fest | Aussage, Begründung, Unsicherheit aus nur dem Bild rekonstruiert; Abweichungen gegen autorisierte Semantik getrennt bewertet; kein empirischer Lernerfolgsanspruch |
| R1 / zuletzt | Kontrollierte Ausweitung | jeweils ein Level/Pfad pro PR, Talks später separat | D1/V1/V2 unabhängig abgenommen | kleine Migrationen, technische/fachliche/visuelle Regressionen und explizite Integration je PR |

P1A/B haben erste Implementierungspriorität. C1/G1/S1 können als Dokumente
vorbereitet werden, dürfen aber die Messung nicht durch neue Volltests oder
zweite Worker auf dem gleichen Host verdrängen. C2 ist eine erkannte zusätzliche
Abhängigkeit; die Sicherheitslücke darf nicht durch Konfigurationstext kaschiert werden.

## Architektur-/Ownership-Matrix

| Grenze | Zuständigkeit | Erhaltene Invarianten | Konflikt-/Integrationsregel |
| --- | --- | --- | --- |
| `ontology/dataset/*.trig`, Shapes | PCD Ontologie/Fachowner | einzige autoritative Semantik, benannte Graphen, Sprache, Quellen | Content- und Schemaänderungen trennen; gleiche Resource-IRIs serialisieren |
| Dataset/Fingerprint | PCD `rdf_dataset.py` | Dataset-weite Blank-Node-Identität, Parse-Reihenfolge und CRLF-Normalisierung | keine identitätsändernde Cache-Abkürzung; Roundtrip-/Negativtests erhalten |
| Path/Compiler/Script | PCD `course_path_selection.py`, `generate_canonical_runtime.py`, `thematic_script.py` | exakte Offering/Unit/Path/Graphbindung, lesbare statische Ausgabe | zentraler Compiler exklusiver Scope; #280-Kompatibilität separat prüfen |
| Core-/Transportvertrag | PCD `packages/core`, `course_runtime_transport.py` | versionierte Raw-Validation, RDF-Provenienz, keine Reveal-Abhängigkeit | Vertrag zuerst festlegen; Adapter danach; kein paralleles inkompatibles Ändern |
| Komposition/Medien | PCD generische Renderer, Shared, Pitch | keine Fach-/Szenen-ID-Fallunterscheidungen, zugängliche Symbole | UI-Primitive eigener serieller Systemauftrag; Contentworker erweitert keine Rendererrechte |
| Self-Study/LaTeX | PCD Ausgabeadapter | gleiche Quellen, volle Legenden, keine Begründung nur hinter Klicks | statische Projektion gegen dieselbe Inhaltsrevision prüfen |
| Product-Agent-Kontext | CDAC | native v2 sauber; Legacy nur lesende Kompatibilität | kein erneuerter Dispatcher, keine zweite Statushoheit |
| Isolation/Agent/Gates/Evidenz | CAC unter CDAC, Projektpolicy in `projects/project-chemie-digital/` | eigener Worktree/venv, exakte SHA/Attempt/Context, kein automatischer Merge | kein stiller Wechsel des globalen CAC-Codes oder Copy/Paste von Playground-Befehlen |
| Technischer Check | externer Product-Validator | `agent-validator/project-chemie-digital` auf exaktem neuen HEAD | Markerkommentar diagnostisch; kein Status aus lokalen Logs erzeugen |
| Akzeptanz/Integration | unabhängiger Reviewer / Eigentümer | getrennt vom Implementierer, aktuelle Basis, explizite Entscheidung | Phase 0 autorisiert keinen Merge/Deploy und keine Sicherheits-/Löschaktion |

## Story-Layer: reuse before extend

| Anforderung | Vorhandene Grundlage | Offene Arbeit |
| --- | --- | --- |
| Leitfrage / Antwort | `guidingQuestion`, `answersGuidingQuestion`, `answerResource` am PathStep | nur unmittelbare Paare; längere Inquiry-Sequenzen nicht still aus Nachbarschaft erschließen |
| Kernaussage / Interpretation | Interpretation, StatementRole, ausgewählte Ressourcen | keine verifizierte allgemeine Pflicht „genau eine Kernaussage“; redaktionellen/semantischen Vertrag entwerfen |
| Vorwissen | bestehende Wissens-/Abhängigkeitsbeziehungen | auf konkrete didaktische Verwendung prüfen; keine neue IRI ohne Gap-Nachweis |
| Beispiel / Evidenz / Erklärung | Example-, Chart-, Table-, Formula-/Derivation-/Code-/Source-Ressourcen und Rollen | sichtbare Beobachtung→Folgerung prüfen; Ressourcenpräsenz ist kein Verständlichkeitsbeweis |
| Fehlvorstellung | Exercises/Polls/Interpretation als mögliche Bausteine | vollständige Wiederverwendbarkeit/Beziehung nicht nachgewiesen; ADR-Lücke |
| Lesetext / PDF | ThematicScript/Sections/Materials, dct:references, LaTeX | eigenständige Argumentation, keine Folienabschrift; gleiche Inhaltsrevision und vollständige statische Darstellung |
| Fokus / visuelle Hierarchie | generische Kompositionspolicy, Disclosure, Shared-Formelrenderer | keine automatische Zuordnung fachlicher Wichtigkeit aus Layout oder letzter Textzeile |

Pilotkandidat erst nach Inventar auswählen. Level 5 bietet bereits Frage-/Antwort-
und Script-Bausteine; ein zusammenhängender Abschnitt dort kann kleiner sein als
ein Neubeginn der alten #278-Varianzaufgabe. Die konkrete 6–8-Szenen-Liste wird
im Auftrag D1 festgeschrieben. Keine alte Szene als „fehlend“ melden, ohne den
aktuellen Lehrbranch zu prüfen.

Designkriterien für den späteren Pilot: hell/kontrastreich, semantisch begründete
Bilder, reduzierte Einzelaussage; farbige Header/Thumbnail, Nummer unten rechts,
nur obere Kartenecken leicht gerundet; Formelsymboloverlay per Tastatur und volle
Legende in Print/Script; Parallax optional und reduced-motion-kompatibel.
Begründungen bleiben im Standbild sichtbar. Keine neue Ontologie für Pixelgeometrie.
