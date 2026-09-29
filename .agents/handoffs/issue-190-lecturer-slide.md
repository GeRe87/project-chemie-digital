# Issue #190 handoff — lecturer slide focused on teaching perspective

## Source

Course-relevant facts were selected from the private repository `GeRe87/project-cv`.

Files consulted:
- `content/person.yaml`
- `content/teaching.yaml`
- `content/career.yaml`
- `content/projects.yaml`
- `content/activities.yaml`
- `content/supervision.yaml`

Only facts that help students understand the perspective of this course were retained.

## Included

- Gerrit Renner — Analytical Data Science, Instrumental Analytical Chemistry, UDE.
- Lecturer for the Master's course `Chemometrics and Applied Statistics` at UDE since 2020.
- Teaching/practical context connecting analytical measurements and analytical data science.
- Course approach: understand assumptions, make calculations reproducible, interpret results in analytical context.

## Explicitly excluded

The slide intentionally does not mention:
- publications or publication counts;
- awards/distinctions;
- grants/projects/funding;
- editorial or reviewer roles;
- supervision metrics;
- career chronology beyond the course-relevant teaching context.

This is not intended to be a mini CV.

## New slide wording

Heading:
`Who is teaching this course?`

Three generic KeyPoint cards:

1. `CHEMOMETRICS IN THE CLASSROOM`
   `Teaching this Master's course at UDE since 2020.`

2. `ANALYTICAL CHEMISTRY AS CONTEXT`
   `Instrumental measurements and complex analytical data keep the methods tied to real measurement problems.`

3. `HOW I TEACH IT`
   `Understand the assumptions, make calculations reproducible, and interpret what the result actually means.`

Takeaway:
`GERRIT RENNER · ANALYTICAL DATA SCIENCE · INSTRUMENTAL ANALYTICAL CHEMISTRY · UDE`

## Architecture

The existing scene structure is preserved:
- prose heading
- KeyPoint list with three items
- prose takeaway

Therefore the existing generic `concept-specification` layout continues to apply. No renderer identity logic or new layout family was introduced.

## Tests

`tests/test_chemometrics_introduction.py` now verifies:
- exactly three cards;
- the 2020 course-teaching context;
- analytical measurement context;
- assumptions/reproducibility/interpretation teaching approach;
- affiliation takeaway;
- absence of CV-showcase vocabulary such as publication, award, grant/funding, editor/reviewer and supervision.

## Local verification

```powershell
python -m unittest tests.test_chemometrics_introduction -v
npm run pitch:intro
```

Visually verify Slide 3 is readable at lecture distance and feels like course orientation rather than academic self-promotion.
