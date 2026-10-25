"""Renderer-neutral scientific work metadata projected exclusively from RDF."""
from rdflib import DCTERMS, SKOS, URIRef

CD = "https://w3id.org/project-chemie-digital/ontology/"
SCHEMA = "https://schema.org/"


def project_title(dataset, work):
    # Lazy import avoids a dependency cycle with the shared scene compiler.
    import generate_canonical_runtime as R

    def value(subject, predicate, required=False):
        result = R.one(dataset, subject, URIRef(SCHEMA + predicate), required=required)
        return str(result) if result is not None else None

    def organization(subject, seen=None):
        seen = set() if seen is None else seen
        if subject in seen:
            raise ValueError("Cyclic affiliation hierarchy")
        seen.add(subject)
        name = value(subject, "name", True)
        parent = value(subject, "parentOrganization")
        return (organization(URIRef(parent), seen) if parent else []) + [name]

    def ordered(predicate):
        records = R.objects(dataset, work, URIRef(SCHEMA + predicate))
        records.sort(key=lambda item: int(value(item, "position", True)))
        positions = [int(value(item, "position", True)) for item in records]
        if len(set(positions)) != len(positions) or any(p < 1 for p in positions):
            raise ValueError(f"Duplicate or invalid {predicate} positions")
        return records

    title = R.deterministic_authored_literal(dataset, work, SKOS.prefLabel, "en")
    if not title:
        raise ValueError("Scientific presentation requires an authored title")
    result = {"version": "1.0", "id": str(work), "title": title,
              "source": [R.source_reference(dataset, work)], "authors": [], "logos": []}
    subtitle = R.deterministic_authored_literal(dataset, work, DCTERMS.alternative, "en")
    if subtitle:
        result["subtitle"] = subtitle
    event = value(work, "recordedAt")
    if event:
        event = URIRef(event)
        result["event"] = {"id": str(event), "name": value(event, "name", True)}
        for key, predicate in [("date", "startDate"), ("location", "location")]:
            optional = value(event, predicate)
            if optional:
                result["event"][key] = optional
    for role in ordered("author"):
        author = URIRef(value(role, "author", True))
        result["authors"].append({"id": str(author), "name": value(author, "name", True),
            "affiliations": [{"id": str(affiliation), "lines": organization(affiliation)}
                             for affiliation in R.objects(dataset, author, URIRef(SCHEMA + "affiliation"))]})
    if not result["authors"]:
        raise ValueError("Scientific presentation requires at least one author")
    for logo in ordered("logo"):
        record = {"id": str(logo), "label": value(logo, "name", True)}
        uri = value(logo, "contentUrl")
        if uri:
            import re
            if not re.fullmatch(r"/?[A-Za-z0-9_-]+(?:/[A-Za-z0-9_.-]+)+", uri) or ".." in uri:
                raise ValueError("Logo assets must be local non-escaping paths")
            record["uri"] = uri
        result["logos"].append(record)
    return result


def title_fallback(metadata):
    import html
    e = html.escape
    event = metadata.get("event", {})
    content = f'<h1>{e(metadata["title"])}</h1>'
    if metadata.get("subtitle"):
        content += f'<p>{e(metadata["subtitle"])}</p>'
    content += '<p>' + e(" · ".join(event[k] for k in ["name", "date", "location"] if event.get(k))) + '</p>'
    for author in metadata["authors"]:
        content += f'<h2>{e(author["name"])}</h2>'
        content += ''.join('<p>' + '<br>'.join(e(line) for line in a["lines"]) + '</p>' for a in author["affiliations"])
    for logo in metadata["logos"]:
        content += (f'<img src="{e(logo["uri"], quote=True)}" alt="{e(logo["label"], quote=True)}">'
                    if logo.get("uri") else f'<p>{e(logo["label"])}</p>')
    return content
