# Didactic review of a learning sequence

The canonical graph describes the audience, prerequisites, learning goal,
transfer question and expected reasoning. ANOVA provides three reference
sequences in ontology/dataset/anova-review-sequences.trig.

A review has five independent dimensions:

| Dimension | Question |
| --- | --- |
| accuracy | Does the evidence support the scientific conclusion? |
| reasoning | Can a learner reconstruct each inferential step? |
| prerequisites | Are the required terms and methods available at that point? |
| answer-fit | Does the answer resolve the question that was asked? |
| visual | Are the relevant data, labels and explanations readable together? |

## Prepare and capture

Regenerate the ANOVA authoring preview, start its local Vite service, then run:

    python scripts/didactic_review.py prepare
    node scripts/capture_didactic_review.cjs <packet-directory>

The packet contains a blind directory with audience information, numbered
images and visible text for every stage in light and dark mode. Review that
directory first. Reconstruct the open question, observed evidence and justified
conclusion before opening intent.trig to compare with the intended learning
goal and transfer task.

The transfer task is a proposal for checking understanding. A model's response
can expose problems with the explanation. Evidence of student understanding
requires actual student responses.

## Record an assessment

    python scripts/didactic_review.py record --packet <packet-directory> --dimension reasoning --assessment reviewed --reviewer "Reviewer identity and model" --reconstruction "Question, observations, intermediate reasoning and conclusion reconstructed from the images."

Use needs-revision for a concrete finding and supply --scene, --stage,
--finding and --recommendation. The location must be present in the captured
packet. Assess each dimension separately. A reviewer can add another assessment
after addressing a finding; earlier records remain available.

Multiple assessments can be submitted together as RDF:

    python scripts/didactic_review.py record-batch --packet <packet-directory> --report <assessments.trig>

Each cd:DidacticReview node must supply reviewDimension, reviewAssessment,
reviewReviewer and reviewReconstruction. Findings additionally supply
reviewScene, reviewStage, reviewFinding and reviewRecommendation. A batch
checks the shared source and image evidence once. Its individual records retain
the same revision and evidence requirements as the single-assessment command.

    python scripts/didactic_review.py check --packet <packet-directory>

The check returns a nonzero exit code for a stale packet, pending dimension or
unresolved finding. The latest assessment per dimension applies to the same
captured evidence. Records are RDF in reviews.trig beside the packet.

## Revision boundary

The source stamp covers the canonical dataset, shared presentation source,
compiler code, chemistry SVG assets and dependency manifests. This conservative
scope can invalidate a packet after an unrelated course-content edit. Reviews
are stored under .local/didactic-review, outside the authored dataset, so adding
an assessment does not invalidate its own source stamp. Captured images and
their scene/stage text manifest have a separate digest. Recapturing different
evidence requires fresh assessments.

Reviewed means a named reviewer assessed that dimension against the supplied
evidence. It is a review record with traceable scope and limitations.

## Residual diagnostic calibration

Run python scripts/check_anova_ks_calibration.py to reproduce the two fitted
normal KS examples with 99,999 simulations and seed 721. River simulations
generate independent preparations, round them to 0.01 percentage points, refit
the three method means, then refit the normal model to the residuals. The
heavy-tail example is compared against normal samples with their normal model
refitted on each draw. Both examples use sample standard deviation and an
exceedance estimate with the plus-one correction.

This calibrates the displayed distances against the fitting procedure, as
required when the distribution parameters are estimated from the tested data.
The slide links to the supporting
[NIST discussion](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35g.htm).
