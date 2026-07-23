// Generated repository-local browser boundary for the graph-backed pitch scene.
// Source of truth remains the JSON-LD files under content/. The pitch tests compare
// these values with those files so drift fails the authoritative npm test command.

export const conceptDocument: unknown = {
  "@context": {
    "cd": "https://w3id.org/project-chemie-digital/ontology/",
    "ex": "https://w3id.org/project-chemie-digital/resource/",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "type": "@type",
    "id": "@id",
    "label": "skos:prefLabel",
    "authoredResource": "cd:authoredResource",
    "broader": { "@id": "skos:broader", "@type": "@id" },
    "hasDefinition": { "@id": "cd:hasDefinition", "@type": "@id" },
    "hasMathExpression": { "@id": "cd:hasMathExpression", "@type": "@id" },
    "hasSymbol": { "@id": "cd:hasSymbol", "@type": "@id" },
    "hasExample": { "@id": "cd:hasExample", "@type": "@id" },
    "hasExercise": { "@id": "cd:hasExercise", "@type": "@id" },
    "hasSource": { "@id": "cd:hasSource", "@type": "@id" }
  },
  "id": "ex:standard-deviation",
  "type": "cd:Concept",
  "authoredResource": true,
  "label": [
    { "@value": "Standardabweichung", "@language": "de" },
    { "@value": "Standard deviation", "@language": "en" }
  ],
  "broader": "ex:statistical-base-terms",
  "hasDefinition": "ex:standard-deviation-definition-basic",
  "hasMathExpression": "ex:sample-standard-deviation-expression",
  "hasSymbol": ["ex:symbol-s", "ex:symbol-n", "ex:symbol-x-i", "ex:symbol-x-bar"],
  "hasExample": ["ex:standard-deviation-example-replicates", "ex:standard-deviation-example-sensor"],
  "hasExercise": "ex:standard-deviation-exercise-01",
  "hasSource": "ex:reference-statistics-01"
};

export const resourceDocument: unknown = {
  "@context": {
    "cd": "https://w3id.org/project-chemie-digital/ontology/",
    "ex": "https://w3id.org/project-chemie-digital/resource/",
    "schema": "https://schema.org/",
    "type": "@type",
    "id": "@id",
    "body": "cd:body",
    "latex": "cd:latex",
    "symbol": "cd:symbol",
    "authoredResource": "cd:authoredResource",
    "hasSource": { "@id": "cd:hasSource", "@type": "@id" }
  },
  "@graph": [
    {
      "id": "ex:standard-deviation-definition-basic",
      "type": "cd:Definition",
      "authoredResource": true,
      "body": { "@value": "Die Standardabweichung beschreibt die typische Streuung einzelner Beobachtungen um ihren arithmetischen Mittelwert.", "@language": "de" },
      "hasSource": "ex:reference-statistics-01"
    },
    { "id": "ex:sample-standard-deviation-expression", "type": "cd:MathExpression", "latex": "s = \\sqrt{\\frac{1}{n-1}\\sum_{i=1}^{n}(x_i-\\bar{x})^2}" },
    { "id": "ex:symbol-s", "type": "cd:MathSymbol", "symbol": "s" },
    { "id": "ex:symbol-n", "type": "cd:MathSymbol", "symbol": "n" },
    { "id": "ex:symbol-x-i", "type": "cd:MathSymbol", "symbol": "x_i" },
    { "id": "ex:symbol-x-bar", "type": "cd:MathSymbol", "symbol": "x̄" },
    { "id": "ex:standard-deviation-example-replicates", "type": "cd:WorkedExample", "body": { "@value": "Fünf Wiederholmessungen einer Kalibrierlösung werden genutzt, um Präzision und Standardabweichung zu bestimmen.", "@language": "de" } },
    { "id": "ex:standard-deviation-example-sensor", "type": "cd:WorkedExample", "body": { "@value": "Temperaturmessungen eines Minireaktors werden auf zufällige Schwankungen und Sensorstabilität untersucht.", "@language": "de" } },
    { "id": "ex:standard-deviation-exercise-01", "type": "cd:Exercise", "body": { "@value": "Berechnen und interpretieren Sie die Stichprobenstandardabweichung der Messwerte 9,8; 10,1; 10,0; 10,2; 9,9 mg/L.", "@language": "de" } },
    { "id": "ex:reference-statistics-01", "type": "cd:Source", "authoredResource": true, "schema:name": "Einführende Statistikreferenz", "schema:url": "https://example.org/reference/statistics" }
  ]
};

export const sceneDocument: unknown = {
  "@context": {
    "cd": "https://w3id.org/project-chemie-digital/ontology/",
    "ex": "https://w3id.org/project-chemie-digital/resource/",
    "type": "@type",
    "id": "@id",
    "focusConcept": { "@id": "cd:focusConcept", "@type": "@id" },
    "hasSceneItem": { "@id": "cd:hasSceneItem", "@type": "@id", "@container": "@set" },
    "presentationPattern": { "@id": "cd:presentationPattern", "@type": "@id" },
    "position": "cd:position",
    "selectsResource": { "@id": "cd:selectsResource", "@type": "@id" },
    "communicativeRole": { "@id": "cd:communicativeRole", "@type": "@id" },
    "selectionPath": "cd:selectionPath",
    "language": "cd:language"
  },
  "@graph": [
    { "id": "ex:scene-standard-deviation-definition-with-citation", "type": "cd:SceneDefinition", "focusConcept": "ex:standard-deviation", "presentationPattern": "cd:DefinitionWithCitation", "hasSceneItem": ["ex:scene-standard-deviation-heading", "ex:scene-standard-deviation-definition", "ex:scene-standard-deviation-citation"] },
    { "id": "ex:scene-standard-deviation-heading", "type": "cd:SceneItem", "position": 1, "selectsResource": "ex:standard-deviation", "communicativeRole": "cd:HeadingRole", "selectionPath": "skos:prefLabel@de", "language": "de" },
    { "id": "ex:scene-standard-deviation-definition", "type": "cd:SceneItem", "position": 2, "selectsResource": "ex:standard-deviation-definition-basic", "communicativeRole": "cd:QuotationRole", "selectionPath": "cd:hasDefinition", "language": "de" },
    { "id": "ex:scene-standard-deviation-citation", "type": "cd:SceneItem", "position": 3, "selectsResource": "ex:reference-statistics-01", "communicativeRole": "cd:CitationRole", "selectionPath": "cd:hasDefinition/cd:hasSource" }
  ]
};
