"""Independent regression expectations for the reviewed Level 2 sequence."""

ORDER = [
    "title", "dice-flow", "dice-warmup", "arithmetic-mean", "dice-practice", "expected-value",
    "dice-expectation", "law-of-large-numbers", "lln-practice", "real-world",
    "water", "fe-practice", "growth", "geometric-mean", "growth-comparison",
    "geometric-practice", "log", "microbial", "ratios", "speed", "speed-solution", "harmonic-mean",
    "harmonic-practice", "layers", "turbidity", "median", "order", "lead",
    "median-practice", "summary", "discussion-additive", "discussion-multiplicative",
]

# focus, heading resource, ordered (resource, role, selector) body items
ADDITIONS = {
    "title": ("arithmetic-mean", "mean-title", []),
    "dice-flow": ("arithmetic-mean", "mean-dice-flow-heading", [
        ("mean-five-dice-flow", "DiagramRole", "cd:body"),
        ("mean-five-dice-sketch", "MediaRole", "cd:uri"),
    ]),
    "dice-warmup": ("arithmetic-mean", "mean-dice-warmup-heading", [
        ("mean-dice-warmup", "ExerciseRole", "cd:body"),
        ("mean-five-dice-sketch", "MediaRole", "cd:uri"),
        ("mean-dice-warmup-r", "CodeRole", "cd:hasCodeExample"),
    ]),
    "dice-practice": ("arithmetic-mean", "mean-dice-practice-heading", [
        ("mean-dice-practice", "ExerciseRole", "cd:body"),
        ("mean-dice-practice-r", "CodeRole", "cd:hasCodeExample"),
    ]),
    "dice-expectation": ("expected-value", "mean-dice-expectation-heading", [
        ("mean-one-die-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-one-die-formula", "FormulaRole", "cd:latex"),
        ("mean-five-dice-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-five-dice-formula", "FormulaRole", "cd:latex"),
    ]),
    "lln-practice": ("law-of-large-numbers", "mean-lln-practice-heading", [
        ("mean-lln-practice", "ExerciseRole", "cd:body"),
        ("mean-lln-practice-r", "CodeRole", "cd:hasCodeExample"),
    ]),
    "real-world": ("expected-value", "mean-real-world-heading", [
        ("mean-model-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-model-formula", "FormulaRole", "cd:latex"),
        ("mean-data-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-data-formula", "FormulaRole", "cd:latex"),
    ]),
    "water": ("arithmetic-mean", "mean-water-heading", [
        ("mean-water-summary", "KeyPointRole", "cd:hasKeyPoint"),
        ("mean-water-table", "TableRole", "cd:hasTableRow"),
    ]),
    "fe-practice": ("arithmetic-mean", "mean-fe-heading", [
        ("mean-fe-practice", "ExerciseRole", "cd:body"),
        ("mean-fe-r", "CodeRole", "cd:hasCodeExample"),
    ]),
    "growth": ("geometric-mean", "mean-growth-heading", [
        ("mean-growth-diagram", "DiagramRole", "cd:body"),
    ]),
    "growth-comparison": ("geometric-mean", "mean-growth-comparison-heading", [
        ("mean-growth-arithmetic-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-growth-arithmetic-formula", "FormulaRole", "cd:latex"),
        ("mean-growth-geometric-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-growth-geometric-formula", "FormulaRole", "cd:latex"),
    ]),
    "log": ("geometric-mean", "mean-log-heading", [
        ("geometric-mean-log-formula", "FormulaRole", "cd:latex"),
    ]),
    "microbial": ("geometric-mean", "mean-microbial-heading", [
        ("mean-microbial-arithmetic-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-microbial-arithmetic-formula", "FormulaRole", "cd:latex"),
        ("mean-microbial-geometric-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-microbial-geometric-formula", "FormulaRole", "cd:latex"),
    ]),
    "ratios": ("geometric-mean", "mean-ratios-heading", [
        ("mean-ratios-arithmetic-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-ratios-arithmetic-formula", "FormulaRole", "cd:latex"),
        ("mean-ratios-geometric-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-ratios-geometric-formula", "FormulaRole", "cd:latex"),
    ]),
    "speed": ("harmonic-mean", "mean-speed-heading", [
        ("mean-speed-question", "ExerciseRole", "cd:body"),
    ]),
    "speed-solution": ("harmonic-mean", "mean-speed-solution-heading", [
        ("mean-speed-calculation", "FormulaRole", "cd:latex"),
        ("mean-speed-diagram", "DiagramRole", "cd:body"),
    ]),
    "harmonic-practice": ("harmonic-mean", "mean-harmonic-practice-heading", [
        ("mean-harmonic-practice", "ExerciseRole", "cd:body"),
        ("mean-harmonic-r", "CodeRole", "cd:hasCodeExample"),
    ]),
    "layers": ("harmonic-mean", "mean-layers-heading", [
        ("mean-layers-assumptions", "StatementRole", "cd:body"),
        ("mean-layers-formula", "FormulaRole", "cd:latex"),
        ("mean-layers-diagram", "DiagramRole", "cd:body"),
        ("mean-layers-note", "StatementRole", "cd:body"),
    ]),
    "turbidity": ("median", "mean-turbidity-heading", [
        ("mean-turbidity-slide-context", "StatementRole", "cd:body"),
        ("mean-turbidity-order-table", "TableRole", "cd:hasTableRow"),
        ("mean-turbidity-chart", "ChartRole", "cd:body"),
        ("mean-turbidity-note", "StatementRole", "cd:body"),
    ]),
    "order": ("median", "mean-order-heading", [
        ("mean-odd-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-odd-formula", "FormulaRole", "cd:latex"),
        ("mean-even-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-even-formula", "FormulaRole", "cd:latex"),
    ]),
    "lead": ("median", "mean-lead-heading", [
        ("mean-lead-arithmetic-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-lead-arithmetic-formula", "FormulaRole", "cd:latex"),
        ("mean-lead-median-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-lead-median-formula", "FormulaRole", "cd:latex"),
    ]),
    "summary": ("arithmetic-mean", "mean-summary-heading", [
        ("mean-summary-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
    ]),
    "discussion-additive": ("arithmetic-mean", "mean-discussion-additive-heading", [
        ("mean-case-replicates", "ExerciseRole", "cd:body"),
        ("mean-case-sensors", "ExerciseRole", "cd:body"),
        ("mean-case-loads", "ExerciseRole", "cd:body"),
    ]),
    "discussion-multiplicative": ("geometric-mean", "mean-discussion-multiplicative-heading", [
        ("mean-case-microplastics", "ExerciseRole", "cd:body"),
        ("mean-case-sites", "ExerciseRole", "cd:body"),
        ("mean-case-reactors", "ExerciseRole", "cd:body"),
    ]),
}

EXTRA_PATH_RESOURCES = {
    "title": {"mean-title", "mean-five-dice-sketch"},
    "dice-expectation": {"mean-dice-expectation-example"},
    "water": {"mean-water-example", "mean-oxygen-cards", "mean-oxygen-formula",
              "mean-nitrate-cards", "mean-nitrate-formula", "mean-iron-cards", "mean-iron-formula"},
    "growth": {"mean-growth-example"},
    "microbial": {"mean-microbial-example"},
    "ratios": {"mean-ratios-example"},
    "layers": {"mean-layers-example"},
    "order": {"mean-order-example"},
    "lead": {"mean-lead-example"},
    "arithmetic-mean": {"mean-arithmetic-facets"},
    "expected-value": {"mean-expectation-context", "mean-expectation-facets", "mean-expectation-note"},
    "law-of-large-numbers": {"mean-lln-facets", "mean-lln-note"},
    "geometric-mean": {"mean-geometric-context", "mean-geometric-facets", "mean-geometric-note", "mean-geometric-product-cards", "mean-geometric-log-cards", "mean-geometric-log-card-formula"},
    "speed-solution": {"mean-speed-context", "mean-speed-note"},
    "speed": {"mean-speed-calculation", "mean-speed-context", "mean-speed-diagram", "mean-speed-note"},
    "harmonic-mean": {"mean-harmonic-context", "mean-harmonic-facets", "mean-harmonic-note"},
    "median": {"mean-median-context", "mean-median-facets", "mean-median-note"},
    "turbidity": {"mean-turbidity-context"},
}
