# Learner state

`packages/learner-state` defines the local `LearnerStateDocument 1.0` contract used by the self-study adapter. It is deliberately separate from canonical RDF, resolved paths and `SceneDocument`.

The artifact contains only the active dataset fingerprint, source document/scene/block identities, prompt responses and renderer-owned optional/progressive disclosure state. Canonical serialization sorts records and multiple-choice selections deterministically and adds no wall-clock time or random identifier.

Imports are strict and fail before application when the version, fingerprint, source identities, state owner, response mode, choice values, disclosure mode, value shape or record uniqueness is invalid.

The module has no DOM dependency and performs no implicit browser persistence, service access or remote synchronization.
