# Issue #208 — Level-complete buffer and return lifecycle

## Implementation

Pitch course mode now inserts application-owned boundary slides after every bound SceneDocument:

1. a visible `course-level-buffer` with derived `LEVEL n COMPLETE`, LearningUnit label, and `Next → Course Overworld`;
2. an aria-hidden, transition-free return sentinel.

Reveal owns forward/back/swipe navigation. Entering the sentinel triggers the course-world controller, hides the deck, disables Reveal keyboard handling and restores focus to the Start control that opened the level.

Starting another level:
- hides the world;
- re-enables Reveal keyboard handling;
- jumps to the first authored slide of the exact bound SceneDocument;
- does not remount semantic content or reverse-parse sourcePathId.

The buffer/sentinel are renderer/application artifacts only. RDF, PathSteps and SceneDocument remain unchanged.

## Local verification

```powershell
npm run test:pitch
npm run pitch:intro
```

Browser path:
`Overworld → Level 0 Introduction → all authored slides → Level 0 complete → Next → Overworld`.
