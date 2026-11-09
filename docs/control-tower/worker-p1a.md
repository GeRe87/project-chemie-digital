# OpenCode-Auftrag PCD-P1A — unveränderte Testpipeline messen

Status: ausführbarer Worker-Brief; in Phase 0 **nicht gestartet**.
Erster delegierbarer Auftrag, keine Freigabe zur folgenden Optimierungsphase.
Direkter, begrenzter Eigentümerauftrag bis der geprüfte CAC-Unterbau verfügbar ist.
Das ist kein behaupteter CAC-/CDAC-Workerlauf. Bestehende OpenCode-Berechtigungen
bleiben unverändert; bei Toolverweigerung stoppen und den konkreten Blocker melden.

## Auftrag und Autorität

Rolle: QA, DevOps, Security, and Accessibility Engineer; Fokus ausschließlich
Testprofiling. Lies `AGENTS.md`, die QA-Rolle, dieses Briefing und den angegebenen
Testplan. Der Auftraggeber hat das Bootstrap-/Audit autorisiert; die spätere
Ausführung dieses Folgeauftrags wird vom Koordinator explizit eingeplant.

- **Track / Domäne:** `system` / Testinfrastruktur, als Bereichsangabe. Keine
  Legacy-Dispatcher-Lane aktivieren und keine alte blocked/manager-State ändern.
- **Repository:** `https://github.com/GeRe87/project-chemie-digital.git`.
- **Exakte Basis:** `origin/chemometrics@3f0f9700ad191a917df5ee4df877dc2a91118dd4`.
- **Branch:** frischer `codex/pcd-p1a-baseline-<UTC-run-id>`, eigener neuer Klon.
- **Intended write scope:** nur `docs/testing/pcd-p1a-baseline.md` als
  getracktes Ergebnis. Messprogramm, Rohlogs, Reports und Installationscache
  ausschließlich unter ignoriertem `.local/control-tower/p1a/` im eigenen Klon;
  `node_modules` und die eigene venv sind Laufzeitinstallation, keine Commits.
- **Cross-track dependencies:** keine Implementierungsabhängigkeit für diese
  Messung; aktives #280, lokale PCD-Prozesse und gemeinsamer Host sind vor Start
  erneut zu prüfen. Ein exklusives teures Messfenster ist Voraussetzung.
- **Shared contract impact:** `none`; keine Änderung an Produkt-/Test-/Semantik-
  oder Kontrollverträgen. Dieser direkte Messauftrag ersetzt kein CAC-Onboarding.

Referenzen im Auditbranch: `docs/control-tower/test-profiling.md` und
`docs/control-tower/phase-0-20261109.md`; bei Bedarf als angehängte Dateien lesen.
Aktuelles PCD-main hat die Legacy-Steuerung unter
`d45e2d0918587f0fcd6c60c95494bb9451de709c` zugunsten CDAC stillgelegt.
Der Eigentümer hat CAC als spätere Engine **unter CDAC** gewählt. Die alten
Branchzustände sind keine Erlaubnis zu Claims, Recovery oder Dispatcherbetrieb.

## Problem und Ergebnis

Die ungefähr einstündige Gesamtdauer ist noch nicht reproduzierbar belegt.
Erzeuge genau einen phasenweise beobachteten Versuch der **unveränderten**
Root-Testkette. Liefere einen priorisierten Messbericht statt einer Optimierung.

1. Origin, Basis/HEAD, Branch, Status, Toolpfade/-versionen und Lockfile-Hashes
   prüfen. Bei abweichender Remote-Basis stoppen; keinen alten SHA still übernehmen.
2. Eigene Python-venv mit PCD-Pins und Lockfile-installierten JS-Abhängigkeiten
   vorbereiten; Installationszeit separat. Keine globale CAC-/Python-Installation
   ändern, keine Tokens/Environmentwerte protokollieren. `npm ci --no-audit` und
   `npm run doctor` verwenden; keine Browser-/R-/LaTeX-Downloads für diese Baseline.
3. Host-Messfenster vom Koordinator bestätigen lassen. Keine fremden Prozesse
   beenden; bei unbekannter aktiver Full-Validierung nicht starten.
4. Ein kleines temporäres Beobachtungsprogramm unter `.local` darf `npm test`
   als Kindprozess starten, stdout/stderr getrennt speichern und die bekannten
   Lifecycle-Starts mit monotoner Zeit erfassen. Tatsächlich ausgeführten Befehl
   auf Windows korrekt auflösen, Argumentlisten verwenden, Exit unverändert
   weitergeben. Nicht selbst 15 isolierte Testaufrufe als angeblich identischen
   originalen Full-Gate ausgeben. Logbuffering und fehlende Fixturezeiten benennen.
5. Genau einen originalen `npm test`-Versuch laufen lassen. Budgets: 90 min gesamt,
   60 min Semantikphase, 10 min je andere Phase, 20 MiB pro Rohlog, 500 MiB Evidenz.
   `running/incomplete` vor Start persistieren. Nur eigene gestartete Prozesse
   bei Timeout abbrechen; wenn Prozessbaumkontrolle nicht sicher möglich ist,
   unbeaufsichtigte Ausführung unterlassen. Nie nach Fehler automatisch wiederholen.
6. Nach erster fehlgeschlagener Phase Folgeschritte `not_run` berichten. Keine
   Assertions/SHACL-Schichten/Tests abschalten, keine Fixture-Reparatur in diesem
   Auftrag. Infrastructure-Fehler von Produktfehlern unterscheiden.
7. Erzeugte Dateien vollständig inventarisieren. Die unveränderte Pipeline darf
   ihre vorgesehenen Generated-Outputs erzeugen: Pitch default-JSON/index.html,
   Authoring-Previews und Self-Study-Transport/-HTML. Sie sind **keine zusätzliche
   editierbare Semantikquelle**. Geändertes getracktes index.html erhalten und
   diffen, nicht resetten oder mitcommitten. Andere unerwartete Quelländerung
   blockiert den Befund „unveränderte Pipeline“.
8. Bericht mit Phasenrangliste, tatsächlich erreichten Testzahlen, Skips/Warnungen,
   Start-/End-SHA/-Status und Log-/Reporthashes erstellen. Folgevorschlag genau
   eine gezielte Profilfrage. Kein weiterer Full-Lauf, kein Cache-/Parallelumbau.
9. Optional nur den erlaubten Bericht committen, Commit-SHA melden. Kein Push,
   PR-Kommentar, Statussetzen, Merge oder Deployment aus dem Worker heraus;
   Koordinator übernimmt die konkrete Übergabe und einen späteren Draft-PR.

**Explizit ausgeschlossen:** `package.json`, Lockfile, `tests/**`,
`scripts/**` (außer ignoriertem temporärem Beobachter in `.local`), `packages/**`,
`ontology/**`, `.agents/**`, `.cdac/**`, Governance, Sicherheitsregeln,
Ports bestehender Server, CAC-State/Worktrees und sämtliche Lösch-/Cleanup-Aktionen.
Die notwendigen Generatornebenwirkungen sind zu berichten, nicht als
Implementierung zu committen. Kein Release-/Build-/Browser-Fullprofil zusätzlich.

## Akzeptanzkriterien

- Exakte Quelle, Installationspins und Status vorher/nachher nachgewiesen.
- Ein originaler Full-Gate-Versuch oder ein nachvollziehbarer Preflight-Blocker;
  ein blockierter Auftrag ist kein bestandener Gate.
- Alle 15 Root-Phasen mit Dauer oder `not_run/incomplete`, Originalexit, Host,
  Cachebeschreibung und separate Installationszeit. Geerbte Evidenz ausdrücklich
  von diesem Lauf trennen. Keine behaupte Beschleunigung ohne Vergleich.
- Rohlogs und maschinenlesbare Beobachtungen lokal mit SHA-256; nur kompakte,
  redigierte Ergebnisse in Git. Geheimnisfreie Dateiinventare.
- Quell-/Test-/Policy-Semantik unverändert, kein zweiter aktiver Worker,
  kein verschluckter Fehler. Kein externer Status oder unabhängiges PASS fingiert.

Handoff (kompakt):

```text
task_id / run_id:
base_sha / measured_head_sha / final_report_commit_sha:
origin / branch / isolated_checkout:
changed_tracked_paths / generated_side_effects:
commands / durations / exit_codes / reached_test_counts:
not_run / warnings / skips / infrastructure_vs_product_findings:
evidence_paths / sha256:
highest_cost_phase / one_next_profiling_question:
risks / blockers / recommended_coordinator_action:
```

## Lokaler Start nach Einplanung

Der folgende konkrete Einstieg erzeugt einen neuen Klon und startet OpenCode.
Er wurde in Phase 0 **nicht ausgeführt**. Er benutzt keinen unregistrierten
`cf-agentctl prepare/start`-Aufruf. OpenCode wird nicht durch Codex ersetzt und
keine OPENCODE_CONFIG-/Security-Ausnahme wird gesetzt.

Aus dem Control-Tower-Workspace in PowerShell:

```powershell
$ErrorActionPreference = 'Stop'
$tower = (Get-Location).Path
$brief = Join-Path $tower 'pcd-fresh-20261109/docs/control-tower/worker-p1a.md'
$runId = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffffffZ')
$worker = Join-Path $tower ('pcd-worker-p1a-' + $runId)
if (Test-Path -LiteralPath $worker) { throw 'Ziel existiert; nichts überschreiben' }
git clone --branch chemometrics --no-checkout https://github.com/GeRe87/project-chemie-digital.git $worker
if ($LASTEXITCODE -ne 0) { throw 'Clone fehlgeschlagen' }
$expected = '3f0f9700ad191a917df5ee4df877dc2a91118dd4'
$actual = (git -C $worker rev-parse origin/chemometrics).Trim()
if ($actual -ne $expected) { throw 'Remote-Basis geändert: Auftrag zuerst aktualisieren' }
git -C $worker switch -c ('codex/pcd-p1a-baseline-' + $runId) $actual
if ($LASTEXITCODE -ne 0) { throw 'Branch-Erstellung fehlgeschlagen' }
if (git -C $worker status --porcelain) { throw 'Frischer Worker nicht sauber' }
Set-Location -LiteralPath $worker
opencode run --standalone --format json --agent build --file $brief 'Führe ausschließlich PCD-P1A aus. Beginne mit dem Preflight; bei fehlendem exklusivem Messfenster nur Vorbereitung und Blockerbericht, kein Full-Gate.'
```

Nicht mit `--auto` oder geänderten Sicherheitsregeln eine Toolverweigerung umgehen.
Ein technischer Start ist keine Produktabnahme. Nach genehmigtem CAC-Onboarding
wird derselbe fachliche Auftrag über den gebundenen CAC-/CDAC-Pfad gerendert;
die temporäre direkte Variante wird dann nicht parallel weiterbetrieben.
