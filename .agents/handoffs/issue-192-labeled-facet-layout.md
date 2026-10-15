# Issue #192 — Generic labeled facets and profile-gated projection

## Role

`Presentation System Worker`

## Scope completed

- added renderer-owned `labeled-card-grid` inference for the generic structure `heading + three-entry DefinitionList + takeaway`;
- added a reusable definition-card visual with separate `dt` / `dd` hierarchy, responsive grid geometry and no fixed card height;
- reused renderer-supplied `--definition-entry-hue` rather than any scene/resource identity;
- moved alternate publication-projection activation behind `PresentationProjectionCapabilities`;
- enabled `publication` only for the CogniFlow presentation profile; Chemometrics has no projection capability and therefore no toggle;
- added layout/profile/standardization regressions.

## Explicitly unchanged

- Chemometrics scientific/content TriG;
- nitrate case-study RDF relations and staged disclosure;
- SceneDocument schema;
- learner-state contracts;
- CogniFlow authored content.

## Identity boundary

The new layout and runtime gate contain no lecturer, Chemometrics, scene-id or resource-id checks. Layout selection is based only on validated block kind/order/cardinality. Projection activation is a generic profile capability.

## Verification handoff

Connector-side implementation cannot execute the repository test suite. Owner-local gates required before final acceptance:

```powershell
npm run test:renderer-reveal
npm run test:pitch
```

After those are green, #191 may migrate the lecturer slide to the generic DefinitionList structure and perform the browser smoke.
