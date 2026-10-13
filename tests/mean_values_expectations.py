"""Independent regression expectations for the reviewed Level 2 sequence."""


def leaf_blocks(scene):
    """Traverse nested semantic groups in their authored reading order."""
    def expand(block):
        if block["kind"] != "group":
            return [block]
        by_id = {child["id"]: child for child in block["children"]}
        return [leaf for identity in block["readingOrder"] for leaf in expand(by_id[identity])]
    return [leaf for block in scene["blocks"] for leaf in expand(block)]

ORDER = [
    "title", "purpose", "dice-flow", "dice-warmup", "dice-sums", "expected-value",
    "dice-expectation", "real-world", "arithmetic-mean", "arithmetic-calculation", "dice-practice", "lln-practice",
    "water", "growth", "growth-comparison", "geometric-mean", "growth-calculation", "growth-r",
    "log", "microbial", "ratios", "speed", "speed-comparison", "harmonic-mean", "speed-solution", "speed-r",
    "harmonic-practice", "layers", "turbidity", "median", "order", "lead", "median-r",
    "summary", "discussion-additive",
]

# focus, heading resource, ordered (resource, role, selector) body items
ADDITIONS = {
    "title": ("arithmetic-mean", "mean-title", []),
    "purpose": ("arithmetic-mean", "mean-purpose-heading", [
        ("mean-purpose", "KeyPointRole", "cd:hasKeyPoint"),
    ]),
    "dice-sums": ("expected-value", "mean-dice-sums-heading", [
        ("mean-dice-sums", "StatementRole", "cd:body"),
        ("mean-dice-sums", "KeyPointRole", "cd:hasKeyPoint"),
        ("mean-dice-sums-question", "ExerciseRole", "cd:body"),
    ]),
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
        ("mean-bridge-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-bridge-question", "ExerciseRole", "cd:body"),
    ]),
    "water": ("arithmetic-mean", "mean-water-heading", [
        ("mean-water-summary", "KeyPointRole", "cd:hasKeyPoint"),
        ("mean-water-table", "TableRole", "cd:hasTableRow"),
        ("mean-fe-practice", "ExerciseRole", "cd:body"),
        ("mean-fe-r", "CodeRole", "cd:hasCodeExample"),
    ]),
    "arithmetic-calculation": ("arithmetic-mean", "mean-dice-average-heading", [
        ("mean-dice-average-context", "StatementRole", "cd:body"),
        ("mean-dice-average-formula", "FormulaRole", "cd:latex"),
    ]),
    "median-r": ("median", "mean-lead-median-r-heading", [
        ("mean-lead-median-r-practice", "ExerciseRole", "cd:body"),
        ("mean-lead-median-r", "CodeRole", "cd:hasCodeExample"),
    ]),
    "growth": ("geometric-mean", "mean-growth-heading", [
        ("mean-growth-diagram", "DiagramRole", "cd:body"),
        ("mean-cell-growth-sketch", "MediaRole", "cd:uri"),
    ]),
    "growth-comparison": ("geometric-mean", "mean-growth-comparison-heading", [
        ("mean-growth-arithmetic-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-growth-arithmetic-formula", "FormulaRole", "cd:latex"),
    ]),
    "growth-calculation": ("geometric-mean", "mean-growth-calculation-heading", [
        ("mean-growth-geometric-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-growth-geometric-formula", "FormulaRole", "cd:latex"),
    ]),
    "growth-r": ("geometric-mean", "mean-growth-r-heading", [
        ("mean-growth-r-practice", "ExerciseRole", "cd:body"),
        ("mean-growth-r", "CodeRole", "cd:hasCodeExample"),
    ]),
    "speed-comparison": ("harmonic-mean", "mean-speed-comparison-heading", [
        ("mean-speed-arithmetic-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-speed-arithmetic-formula", "FormulaRole", "cd:latex"),
        ("mean-speed-geometric-cards", "DefinitionListRole", "cd:hasDefinitionListEntry"),
        ("mean-speed-geometric-formula", "FormulaRole", "cd:latex"),
    ]),
    "speed-r": ("harmonic-mean", "mean-speed-r-heading", [
        ("mean-speed-r-practice", "ExerciseRole", "cd:body"),
        ("mean-speed-r", "CodeRole", "cd:hasCodeExample"),
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
        ("mean-speed-harmonic-calculation", "FormulaRole", "cd:latex"),
        ("mean-speed-total-time-calculation", "FormulaRole", "cd:latex"),
    ]),
    "harmonic-practice": ("harmonic-mean", "mean-harmonic-practice-heading", [
        ("mean-harmonic-practice", "ExerciseRole", "cd:body"),
        ("mean-harmonic-r", "CodeRole", "cd:hasCodeExample"),
    ]),
    "layers": ("harmonic-mean", "mean-layers-heading", [
        ("mean-layers-assumptions", "StatementRole", "cd:body"),
        ("mean-layers-formula", "FormulaRole", "cd:latex"),
        ("mean-layers-diagram", "DiagramRole", "cd:body"),
    ]),
    "turbidity": ("median", "mean-turbidity-heading", [
        ("mean-turbidity-slide-context", "StatementRole", "cd:body"),
        ("mean-turbidity-average-formula", "FormulaRole", "cd:latex"),
        ("mean-turbidity-order-table", "TableRole", "cd:hasTableRow"),
        ("mean-turbidity-chart", "ChartRole", "cd:body"),
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
        ("mean-case-microplastics", "ExerciseRole", "cd:body"),
        ("mean-case-sites", "ExerciseRole", "cd:body"),
        ("mean-case-reactors", "ExerciseRole", "cd:body"),
    ]),
}

EXTRA_PATH_RESOURCES = {
    "real-world": {"mean-bridge-answer"},
    "growth-comparison": {"mean-growth-geometric-cards", "mean-growth-geometric-formula"},
    "purpose": {"mean-purpose-heading"},
    "dice-sums": {"mean-dice-sums-heading"},
    "title": {"mean-title", "mean-five-dice-sketch"},
    "dice-expectation": {"mean-dice-expectation-example"},
    "water": {"mean-water-example", "mean-oxygen-cards", "mean-oxygen-formula",
              "mean-nitrate-cards", "mean-nitrate-formula", "mean-iron-cards", "mean-iron-formula"},
    "growth": {"mean-growth-example"},
    "microbial": {"mean-microbial-example"},
    "ratios": {"mean-ratios-example"},
    "order": {"mean-order-example"},
    "lead": {"mean-lead-example"},
    "arithmetic-mean": set(),
    "expected-value": {"mean-expectation-context", "mean-expectation-note"},
    "law-of-large-numbers": {"mean-lln-facets", "mean-lln-note"},
    "geometric-mean": {"mean-growth-general-note"},
    "arithmetic-calculation": {"mean-dice-average-example"},
    "median-r": {"mean-lead-example"},
    "speed": {"mean-speed-calculation", "mean-speed-context", "mean-speed-diagram", "mean-speed-note"},
    "harmonic-mean": {"mean-harmonic-context", "mean-harmonic-note"},
    "layers": {"mean-layers-example", "mean-layers-note"},
    "median": {"mean-median-context", "mean-median-facets", "mean-median-note"},
    "turbidity": {"mean-turbidity-context", "mean-turbidity-note"},
}
