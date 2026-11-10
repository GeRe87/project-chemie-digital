# Environmental Health 2026: manuscript V1

FAIR, Transparent and Automated Data Processing for Microplastics Analysis via TED-GC-MS

Full user-supplied V1. No substantive narration edits. Paragraphs and wording are retained; document line endings are normalized. Narration literals preserve the supplied strings. Planned times include transitions and are not actual recording timestamps.

## Slide 01: From Signal to Evidence

Scene: ex:eh26-scene-01. Budget: 30 s. Supplied words: 51. Whitespace-token count: 51.

Environmental monitoring increasingly depends on results derived from complex instrumental data.

In TED-GC-MS, we do not directly count microplastic particles. We measure chemical signals that can be used to estimate polymer mass.

Today, I will focus on what happens between that signal and the reported result: processing, documentation, and controlled automation.

## Slide 02: A Number Is Not the Whole Story

Scene: ex:eh26-scene-02. Budget: 65 s. Supplied words: 118. Whitespace-token count: 118.

Consider these two results for SBR, styrene-butadiene rubber, from an influent and an effluent sample.

One result is about fifteen point seven micrograms per milligram of sample; the other is about thirteen point six.

These values are derived from three analytical replicates each. But the numbers alone tell us remarkably little.

Which chromatographic signals were selected? How were overlapping signals handled? Which calibration standards were used? And which version of the processing software produced the result?

To evaluate or reproduce the analysis, we need answers to those questions.

This is the problem we want to address: not simply producing a number, but preserving the evidence behind it.

These distinctions matter when results are compared across laboratories or studies.

## Slide 03: TED-GC-MS in One Minute

Scene: ex:eh26-scene-03. Budget: 65 s. Supplied words: 118. Whitespace-token count: 118.

First, a brief look at the measurement.

In our TED-GC-MS configuration, the sample is heated under controlled conditions. Organic compounds are released, and polymers can decompose into characteristic products.

Part of the evolved gas stream passes a sorptive device, shown here as a Twister.

The loaded sorbent is transferred to a thermal desorption system. The collected substances are released, focused at low temperature, separated by gas chromatography, and detected by mass spectrometry.

The mass spectrometer observes ions formed from the separated substances, rather than intact polymer particles.

These signals are then interpreted through characteristic markers and calibration measurements.

The approach is therefore mass-based: it can provide information about polymer-related mass, but not individual particle counts, shapes, or sizes.

## Slide 04: From Chromatograms to Polymer Markers

Scene: ex:eh26-scene-04. Budget: 75 s. Supplied words: 119. Whitespace-token count: 119.

The instrument does not produce a table of polymer concentrations. It produces ion signals over time.

A total-ion chromatogram summarizes the detected signal, but a useful interpretation often begins with individual extracted-ion chromatograms.

We search for characteristic decomposition products and examine their retention behavior and mass-spectral information.

Here, one signal becomes a candidate marker.

However, environmental matrices are complex, peaks may overlap, and different substances may contribute to similar signals.

So a peak is not automatically proof of a polymer.

Before we calculate concentrations, we need a reproducible way to locate relevant signals, associate them with components, and select markers according to an explicit analytical method.

The choice of ion trace and integration region also affects the reported mass.

## Slide 05: The Data Processing Chain

Scene: ex:eh26-scene-05. Budget: 85 s. Supplied words: 137. Whitespace-token count: 137.

This is our processing chain.

We first import the instrument data and extract ion chromatograms.

Next, peak detection turns continuous signals into a list of chromatographic features.

Joint fitting then combines features that share an elution profile into components.

We select components associated with polymer markers, estimate marker areas, and use external calibration to calculate polymer-related mass.

Finally, we normalize that mass to the sample mass where appropriate.

Every arrow represents more than a file transfer.

It represents a scientific decision: a peak model, a fitting rule, a marker definition, or a calibration choice.

Those decisions are exactly what a transparent processing pipeline must preserve.

Each operation receives an input, applies a defined transformation, and produces an output.

Documenting these boundaries lets us inspect, validate, and potentially replace implementations without losing the scientific meaning of the workflow.

## Slide 06: Automated Peak Detection

Scene: ex:eh26-scene-06. Budget: 75 s. Supplied words: 127. Whitespace-token count: 127.

For peak detection, we use our qPeaks approach.

Instead of relying on a single fixed peak width, the algorithm examines each extracted-ion chromatogram with moving regression windows at several scales.

Potential peaks are described using a local asymmetric model, and suitable candidates can then be evaluated further.

In a second step, signals across different ion traces can be fitted together when they share a chromatographic elution profile.

This helps organize many individual features into meaningful components.

But automation does not remove the responsibility to evaluate them.

Window sizes, fitting settings, acceptance criteria, and marker assignments must remain explicit, because different choices can change which features enter the final calculation.

Several ion traces may contain the same chromatographic peak, but at different intensities; joint analysis preserves this relationship.

## Slide 07: Calibration Is Part of Processing

Scene: ex:eh26-scene-07. Budget: 100 s. Supplied words: 173. Whitespace-token count: 173.

Calibration is another part of data processing that deserves attention.

A conventional calibration may involve a substantial number of standards and blank measurements, making it time-consuming in a long analytical campaign.

Our working concept is running calibration: maintain a set of fifteen standards, add a newly measured standard, and remove the oldest one.

This is a first-in, first-out, or FIFO, window.

The idea is to use calibration information close to the time of a sample rather than treating calibration as a separate event at the beginning of a campaign.

The existing demonstration replays forty-four SBR calibration measurements in a balanced order and updates the fitted line as the window moves.

It illustrates the procedure, but does not independently establish long-term performance or optimal window size.

Drift, blank measurements, quality control, and calibration validity still have to be assessed.

The key point for our topic is that the selected calibration window is itself part of the result's provenance.

A moving window is not automatically a valid drift correction or a substitute for quality control.

## Slide 08: From Marker Area to SBR Content

Scene: ex:eh26-scene-08. Budget: 80 s. Supplied words: 138. Whitespace-token count: 138.

Let us return to the samples.

We use a local linear calibration fitted to fifteen standards to convert each replicate's marker area into an estimated SBR mass.

We then normalize by the amount of sample analyzed.

For the example shown, the influent has a mean of approximately fifteen point seven micrograms of SBR per milligram of sample.

The effluent has approximately thirteen point six.

Each mean is based on three normalized replicate results.

The error bars represent descriptive standard errors, not a complete uncertainty assessment.

These two numbers should not be interpreted as proof of a treatment effect.

My main point is different: the reported result depends on the exact marker area, local calibration model, normalization and processing choices.

All of them must remain traceable.

The sample and calibration identifiers must therefore remain linked to the reported results.

## Slide 09: Making the Entire Pipeline FAIR

Scene: ex:eh26-scene-09. Budget: 100 s. Supplied words: 167. Whitespace-token count: 167.

This brings us to FAIR: Findable, Accessible, Interoperable, and Reusable.

FAIR is often discussed as a property of a final dataset. In analytical chemistry, we need to think about the entire processing history.

A result should point to its input file, the selected ion traces, extracted features, chosen polymer marker, calibration data, processing parameters, and software version.

Describing these relations in a shared, machine-readable vocabulary gives each step an explicit meaning.

Another tool can distinguish a marker area from a polymer mass, or a parameter from a measured value.

This supports interoperability and reuse.

But a structured file alone is not enough to make data FAIR.

Persistent identifiers, discovery, appropriate access, provenance, licenses, and community standards also matter.

FAIR does not necessarily mean that every file is openly accessible.

The practical goal is simple: preserve the context needed to understand and reuse the result without relying on the original analyst's memory.

RDF-based descriptions can link scientific objects across software boundaries, alongside the numerical results and their provenance.

## Slide 10: Can We Validate the Pipeline?

Scene: ex:eh26-scene-10. Budget: 90 s. Supplied words: 150. Whitespace-token count: 150.

A machine-readable pipeline offers another advantage: we can check whether its steps are structurally compatible.

Consider a simple example.

One processing step produces a vector of detected peaks. The following step is initially declared to accept a single integer.

The connection looks plausible in a diagram, but the declared interfaces do not match.

Using SHACL, a language for validating RDF descriptions against explicit constraints, we can detect that mismatch and obtain a validation report.

After correcting the expected input to a peak vector, the same selected check passes.

We also record the revision and its validation evidence.

This tested teaching example demonstrates an interface check, not proof that the algorithm is scientifically correct or will execute successfully.

Nevertheless, it allows us to identify certain workflow errors before running the full analysis.

That is a concrete benefit of transparent semantics.

Real interface contracts also need units, data structures, and required parameters.

## Slide 11: Towards Controlled Automation

Scene: ex:eh26-scene-11. Budget: 70 s. Supplied words: 119. Whitespace-token count: 119.

Finally, the same explicit descriptions can support controlled automation.

Imagine that a TED-GC-MS measurement has finished and its data file is complete.

A readiness event can trigger an execution engine.

The engine follows the defined pipeline, runs the appropriate processing steps, and produces a report linked to its inputs, parameters, calibration and software versions.

The report can then be registered and stored.

Our processing engine and semantically described pipelines already exist, while the fully integrated event-driven system is still under development.

So this diagram is an architecture and development direction, not a claim of a fully deployed autonomous laboratory.

The important distinction is between automating a sequence of computations and automating a process whose decisions can still be inspected.

## Slide 12: Conclusions

Scene: ex:eh26-scene-12. Budget: 35 s. Supplied words: 60. Whitespace-token count: 60.

To conclude, TED-GC-MS provides valuable chemical information for mass-based microplastics analysis.

Automated processing helps us turn signals into results, but speed alone is not enough.

We also need traceable calibration, explicit processing steps, and checkable interfaces.

The goal is not to hide analytical decisions inside software.

It is to make them visible, checkable, and reusable.

Thank you for your attention.
