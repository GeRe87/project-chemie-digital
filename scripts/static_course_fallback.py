"""Render validated SceneDocuments as inert, accessible static HTML.

This adapter consumes generated scene data only. It must not read the RDF
Dataset or choose learning paths; compilation stays in generate_canonical_runtime.
"""
from __future__ import annotations

import html
import json
import re
from typing import Any

from histogram_statistics import bins as histogram_bins, cells as histogram_cells, bins_from_counts as histogram_counts


def fallback_attributes(sources: list[dict[str, Any]]) -> str:
    attributes = []
    resource_ids = sorted({source["resourceId"] for source in sources})
    provenance_ids = sorted({value for source in sources for value in source.get("provenanceIds", [])})
    relation_paths = sorted({source["relationPath"] for source in sources if source.get("relationPath")})
    if resource_ids:
        attributes.append(f'data-resource-id="{html.escape(" ".join(resource_ids), quote=True)}"')
    if provenance_ids:
        attributes.append(f'data-provenance-ids="{html.escape(" ".join(provenance_ids), quote=True)}"')
    if relation_paths:
        attributes.append(f'data-relation-path="{html.escape(" ".join(relation_paths), quote=True)}"')
    return " " + " ".join(attributes) if attributes else ""


def teaching_text_fallback(text: str) -> str:
    """Same inert paragraph/strong/list subset used by the live text primitive."""
    def inline(value: str) -> str:
        return re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", html.escape(value))
    parts = []
    for paragraph in re.split(r"\r?\n\s*\r?\n", text):
        lines = paragraph.splitlines()
        if lines and all(re.match(r"^-\s+", line) for line in lines):
            items = []
            for line in lines:
                match = re.match(r"^-\s+\[([?!])\]\s+([\s\S]*)$", line)
                purpose = "question" if match and match.group(1) == "?" else "task" if match else "neutral"
                content = match.group(2) if match else re.sub(r"^-\s+", "", line)
                items.append(f'<li data-marker-purpose="{purpose}"><span class="teaching-point-marker" aria-hidden="true"></span>{inline(content)}</li>')
            parts.append('<ul class="teaching-points">' + ''.join(items) + '</ul>')
        else:
            parts.append('<p>' + inline(paragraph).replace('\n', '<br>') + '</p>')
    return ''.join(parts)


def media_fallback_markup(block: dict[str, Any]) -> str:
    """Render direct or enriched media with the same escaped accessible fallback."""
    uri = html.escape(block["uri"], quote=True)
    alternative = html.escape(block["alternativeText"], quote=True)
    media_type = block.get("mediaType")
    if isinstance(media_type, str) and media_type.startswith("video/"):
        content = f'<video src="{uri}" controls preload="metadata" playsinline aria-label="{alternative}"></video>'
    elif media_type is None or media_type.startswith("image/"):
        content = f'<img src="{uri}" alt="{alternative}" />'
    else:
        content = f'<span>{html.escape(block["alternativeText"])}</span>'
    type_attribute = f' data-media-type="{html.escape(media_type, quote=True)}"' if media_type else ""
    return (
        f'<figure class="media-reference-fallback" data-media-block-id="{html.escape(block["id"], quote=True)}"'
        f'{type_attribute}{fallback_attributes(block["source"])}>{content}</figure>'
    )


def definition_list_fallback_markup(block: dict[str, Any], *, scrollable: bool = False) -> str:
    entries = "".join(
        f'<div data-definition-entry-id="{html.escape(entry["id"], quote=True)}"{fallback_attributes(entry["source"])}>'
        f'<dt>{html.escape(entry["term"])}</dt>'
        + (f'<dd>{html.escape(entry["description"])}</dd>' if entry.get("description") else "")
        + (f'<dd>{html.escape(entry["explanation"])}</dd>' if entry.get("explanation") else "")
        + "</div>"
        for entry in block["entries"]
    )
    scroll_attributes = ' tabindex="0" aria-label="Scrollable authored function glossary"' if scrollable else ""
    return f'<dl class="definition-list-fallback"{scroll_attributes}{fallback_attributes(block["source"])}>{entries}</dl>'


def derivation_fallback_markup(section: dict[str, Any]) -> str:
    content = [f'<code>{html.escape(section["steps"][0]["from"]["expression"])}</code>']
    for step in section["steps"]:
        content.append(f'<h3>{html.escape(step["operation"])}</h3><code>{html.escape(step["rule"]["formula"]["expression"])}</code><code>{html.escape(step["to"]["expression"])}</code>')
        content.append(f'<details><summary>{html.escape(step["rule"]["label"])}</summary><p>{html.escape(step["rule"]["description"])}</p><code>{html.escape(step["explanation"]["application"]["expression"])}</code><p>{html.escape(step["explanation"]["text"])}</p></details>')
        content.extend(f'<p>{html.escape(a["description"])}</p>' for a in step["assumptions"])
    content.append('<dl>' + ''.join(f'<dt>{html.escape(e["term"])}</dt><dd>{html.escape(e.get("description", ""))}</dd>' for e in section["legend"]) + '</dl>')
    return '<section class="derivation-fallback">' + ''.join(content) + '</section>'


def static_fallback(artifact: dict[str, Any], *, _fragment: bool = False) -> str:
    document = artifact["sceneDocuments"][0]
    articles = []
    for scene in document["scenes"]:
        blocks = []
        consumed_function_legend_ids: set[str] = set()
        for block in scene["blocks"]:
            if block["id"] in consumed_function_legend_ids:
                continue
            if block["kind"] == "group":
                by_id = {child["id"]: child for child in block["children"]}
                children = [by_id[child_id] for child_id in block["readingOrder"]]
                content = static_fallback({"sceneDocuments": [{**document, "scenes": [{**scene, "blocks": children}]}]}, _fragment=True)
                blocks.append(f'<section class="group-fallback" role="group"{fallback_attributes(block["source"])}>{content}</section>')
                continue
            if block["kind"] == "media-reference":
                blocks.append(media_fallback_markup(block))
                continue
            if block["kind"] == "math":
                if block.get("derivation"):
                    blocks.append(derivation_fallback_markup(block["derivation"]))
                else:
                    blocks.append(
                    f'<div class="math-fallback" role="math" aria-label="{html.escape(block["spokenText"], quote=True)}"{fallback_attributes(block["source"])}>'
                    f'<code>{html.escape(block["expression"])}</code>'
                    f'</div>'
                    )
                for detail in block.get("derivationDetails", []):
                    blocks.append(f'<details class="derivation-detail-fallback"><summary>{html.escape(detail["label"])}</summary>' + ''.join(derivation_fallback_markup(s) for s in detail['sections']) + '</details>')
                continue
            if block["kind"] == "code":
                code_markup = (
                    f'<div class="code-fallback" data-code-block-id="{html.escape(block["id"], quote=True)}" '
                    f'data-language="{html.escape(block["language"], quote=True)}"{fallback_attributes(block["source"])}>'
                    f'<pre><code>{html.escape(block["fallback"])}</code></pre>'
                    f'</div>'
                )
                next_index = scene["blocks"].index(block) + 1
                legend = scene["blocks"][next_index] if next_index < len(scene["blocks"]) else None
                is_function_legend = legend and legend["kind"] == "definition-list" and legend.get("emphasis") == "supporting" \
                    and any(source.get("relationPath") == "dct:hasPart" and source.get("resourceId") == block["source"][0].get("resourceId") for source in legend["source"])
                if is_function_legend:
                    consumed_function_legend_ids.add(legend["id"])
                    blocks.append(f'<section class="code-function-workbench-fallback" role="group" aria-label="Code and function glossary">{code_markup}{definition_list_fallback_markup(legend, scrollable=True)}</section>')
                else:
                    blocks.append(code_markup)
                continue
            if block["kind"] == "list":
                tag = "ol" if block["listStyle"] == "ordered" else "ul"
                items = "".join(
                    f'<li data-list-item-id="{html.escape(item["id"], quote=True)}"{fallback_attributes(item["source"])}>{html.escape(item["text"])}</li>'
                    for item in block["items"]
                )
                blocks.append(
                    f'<{tag} class="keypoint-list"{fallback_attributes(block["source"])}>{items}</{tag}>'
                )
                continue
            if block["kind"] == "definition-list":
                blocks.append(definition_list_fallback_markup(block))
                continue
            if block["kind"] == "table":
                headers = "".join(
                    f'<th scope="col" data-table-column-id="{html.escape(column["id"], quote=True)}"{fallback_attributes(column["source"])}>'
                    f'{html.escape(column["label"])}</th>'
                    for column in block["columns"]
                )
                rows = "".join(
                    f'<tr data-table-row-id="{html.escape(row["id"], quote=True)}"{fallback_attributes(row["source"])}>'
                    + "".join(
                        f'<td data-table-cell-id="{html.escape(cell["id"], quote=True)}"{fallback_attributes(cell["source"])}>'
                        f'{html.escape(cell["text"])}</td>'
                        for cell in row["cells"]
                    )
                    + '</tr>'
                    for row in block["rows"]
                )
                description = (
                    f' <span>{html.escape(block["description"])}</span>'
                    if block.get("description")
                    else ""
                )
                blocks.append(
                    f'<figure class="table-fallback"{fallback_attributes(block["source"])}>'
                    f'<figcaption><strong>{html.escape(block["caption"])}</strong>{description}</figcaption>'
                    f'<table><thead><tr>{headers}</tr></thead><tbody>{rows}</tbody></table>'
                    f'</figure>'
                )
                continue
            if block["kind"] == "chart":
                if block["chartType"] == "bar":
                    unit = block.get("yAxis", {}).get("unit")
                    value_items = "".join(
                        f'<li data-chart-datum-id="{html.escape(datum["id"], quote=True)}"{fallback_attributes(datum["source"])}>'
                        f'<span class="chart-category">{html.escape(datum["category"])}</span>: '
                        f'<span class="chart-value">{html.escape(str(datum["value"]))}{(" " + html.escape(unit)) if unit else ""}</span>'
                        f'</li>'
                        for datum in block["data"]
                    )
                    annotation_items = "".join(
                        f'<li data-chart-annotation-id="{html.escape(annotation["id"], quote=True)}">'
                        f'{html.escape(annotation["label"])}</li>'
                        for annotation in block.get("annotations", [])
                    )
                    body = (
                        f'<ol class="chart-data">{value_items}</ol>'
                        f'<ul class="chart-annotations">{annotation_items}</ul>'
                    )
                elif block["chartType"] == "observations":
                    rows = "".join(f'<li{fallback_attributes(datum["source"])}>{html.escape(series["label"])}: {html.escape(datum["label"])}: {datum["value"]} {html.escape(block["xAxis"]["unit"])}</li>' for series in block["series"] for datum in series["data"])
                    extra = ""
                    if block["view"]=="moments":
                        for series in block["series"]:
                            values=[d["value"] for d in series["data"]];n=len(values);mean=sum(values)/n
                            m2,m3,m4=[sum((v-mean)**r for v in values)/n for r in (2,3,4)]
                            skew=m3/m2**1.5 if m2>0 else "undefined";kurt=m4/m2**2 if m2>0 else "undefined"
                            extra+=f'<p>{html.escape(series["label"])}: mean={mean}; m2={m2}; sample variance={m2*n/(n-1)}; skewness={skew}; kurtosis={kurt}. Point, linearly interpolated boxplot and common-bin histogram views retain all {n} observations.</p>'
                    if "threshold" in block:
                        initial = block["threshold"]["initial"]
                        for series in block["series"]:
                            values=sorted(d["value"] for d in series["data"]);count=sum(v<=initial for v in values)
                            extra+=f'<p>{html.escape(series["label"])}: At x = {initial}: {count}/{len(values)} = {count/len(values)}. All ties enter together.</p><ul>'
                            extra+="".join(f'<li>x = {v}: left limit {sum(x < v for x in values)/len(values)}; F_n(x) = {sum(x <= v for x in values)/len(values)}</li>' for v in sorted(set(values)))+'</ul><p>Below the minimum: 0; at and above the maximum: 1.</p>'
                    elif block["view"] == "order":
                        extra = '<p>Ordered observations (ties retained): ' + ", ".join(f'{d["label"]}={d["value"]}' for d in sorted(block["series"][0]["data"], key=lambda d: d["value"])) + '</p>'
                    formal = block.get("formal")
                    if "comparison" in block:
                        extra += "".join(f'<p{fallback_attributes(r["source"])}>{html.escape(r["label"])}</p>' for s in block["series"] for r in s["summaries"].values())
                        extra += "".join(f'<p{fallback_attributes(s["source"])}>{html.escape(s["label"])}: {html.escape(s["prompt"])}</p>' + ''.join(f'<p{fallback_attributes(t["source"])}>{html.escape(t["text"])}</p>' for t in s.get("topics", [])) + ''.join(f'<p{fallback_attributes(p["source"])}>Optional: {html.escape(p["label"])}: {html.escape(p["prompt"])}</p>' for p in s.get("investigations", [])) for s in block["comparison"]["stages"])
                        extra += '<details><summary>Scientific details</summary>' + "".join('<p>' + html.escape(d.get("text", d.get("expression", ""))) + '</p>' for d in block["comparison"]["details"]) + '</details>'
                    if formal:
                        extra += f'<details><summary>Definition and formula</summary><p>{html.escape(formal["definition"])}</p><pre>{html.escape(formal["expression"])}</pre></details>'
                    body = f'<ol>{rows}</ol>{extra}'
                elif block["chartType"] in ("histogram","histogram2d"):
                    records=histogram_cells(block["data"],block["edges"],block["yEdges"]) if block["chartType"]=="histogram2d" else histogram_counts(block["binCounts"],block["edges"],block["normalization"]) if "binCounts" in block else histogram_bins([d["value"] for d in block["data"]],block["edges"],block["normalization"])
                    body='<p>Bins are [lower, upper), with the final upper edge included. n='+str(sum(block["binCounts"]) if "binCounts" in block else len(block["data"]))+'</p><pre>'+html.escape(json.dumps(records,ensure_ascii=False,indent=2))+'</pre>'
                    if "binCounts" in block:body+='<p>Published bin counts; original within-bin values are not reconstructed.</p>'
                    for state in block.get("states", []):
                        state_bins=histogram_counts(state["binCounts"],block["edges"],block["normalization"])
                        body+='<h4>'+html.escape(state["label"])+'</h4><p>'+html.escape(state["description"])+f' n={sum(state["binCounts"])}.</p><pre>'+html.escape(json.dumps(state_bins,ensure_ascii=False,indent=2))+'</pre>'
                    for curve in block.get("curves", []):
                        body += f'<p{fallback_attributes(curve["source"])}>Reference curve: {html.escape(curve["label"])}. Coordinates are not sample observations.</p><ol>'
                        body += ''.join(f'<li{fallback_attributes(p["source"])}>{p["x"]}: {p["y"]}</li>' for p in curve["data"]) + '</ol>'
                elif block["chartType"] == "experiment":
                    body = '<p>' + html.escape(block['description']) + '</p><dl>' + ''.join('<dt>' + html.escape(p['label']) + '</dt><dd>' + str(p['value']) + '</dd>' for p in block['parameters']) + '</dl><p>Interactive numerical results are calculated from these authored parameters in the browser.</p>'
                elif block["chartType"] in ("dot", "box"):
                    unit = html.escape(block["yAxis"].get("unit", ""))
                    rows = "".join(
                        f'<li{fallback_attributes(datum["source"])}>{html.escape(group["label"])}: {datum["value"]} {unit}</li>'
                        for group in block["groups"] for datum in group["data"]
                    )
                    reference = block.get("referenceLine")
                    annotation = (f'<p{fallback_attributes(reference["source"])}>{html.escape(reference["label"])}: {reference["value"]} {unit}</p>' if reference else "")
                    summaries = "".join(
                        f'<li{fallback_attributes(group["summary"]["source"])}>{html.escape(group["label"])}; '
                        f'{html.escape(group["summary"]["label"])}: {group["summary"]["value"]} {unit}</li>'
                        for group in block["groups"] if "summary" in group
                    )
                    curves = "".join(
                        f'<li{fallback_attributes(datum["source"])}>{html.escape(curve["label"])}: x={datum["x"]}, y={datum["y"]} {unit}</li>'
                        for curve in block.get("curves", []) for datum in curve["data"]
                    )
                    body = f'<ol class="chart-data">{rows}{summaries}{curves}</ol>{annotation}'
                    for group in block["groups"]:
                        if "interval" in group:
                            interval=group["interval"];count=sum(interval["lower"]<=d["value"]<=interval["upper"] for d in group["data"])
                            body+=f'<p{fallback_attributes(interval["source"])}>{html.escape(interval["label"])}: [{interval["lower"]}, {interval["upper"]}] {unit}; {count}/{len(group["data"])} = {100*count/len(group["data"])}% in the closed interval.</p>'
                    if block["chartType"] == "box":
                        import statistics
                        body += '<p>Linear interpolation; whiskers end at observations inside the fences, not at the fences.</p>'
                        for group in block["groups"]:
                            values = sorted(d["value"] for d in group["data"])
                            q1, median, q3 = ([values[0]] * 3 if len(values) == 1 else statistics.quantiles(values, n=4, method="inclusive"))
                            iqr = q3-q1
                            lower, upper = q1-block["fenceMultiplier"]*iqr, q3+block["fenceMultiplier"]*iqr
                            inside = [v for v in values if lower <= v <= upper]
                            outliers = [v for v in values if v < lower or v > upper]
                            body += f'<p>{html.escape(group["label"])}: Q1={q1}; median={median}; Q3={q3}; IQR={iqr}; fences=[{lower}, {upper}]; whiskers=[{min(inside)}, {max(inside)}]; flagged={outliers}</p>'
                elif block["chartType"] == "line":
                    point_items = "".join(
                        f'<li data-chart-series-id="{html.escape(series["id"], quote=True)}"{fallback_attributes(series["source"])}>'
                        f'<strong>{html.escape(series["label"])}</strong><ol>'
                        + "".join(f'<li data-chart-datum-id="{html.escape(datum["id"], quote=True)}"{fallback_attributes(datum["source"])}>'
                                  f'x={html.escape(str(datum["x"]))}, y={html.escape(str(datum["y"]))}</li>' for datum in series["data"])
                        + '</ol></li>'
                        for series in block["series"]
                    )
                    annotation_items = "".join(
                        f'<li data-chart-annotation-id="{html.escape(annotation["id"], quote=True)}">'
                        f'{html.escape(annotation["label"])}</li>'
                        for annotation in block.get("annotations", [])
                    )
                    body = f'<ol class="chart-data">{point_items}</ol><ul class="chart-annotations">{annotation_items}</ul>'
                else:
                    raise ValueError(f'Unsupported chart type in static fallback: {block["chartType"]}')
                blocks.append(
                    f'<figure class="chart-fallback" data-chart-type="{html.escape(block["chartType"], quote=True)}"'
                    f'{fallback_attributes(block["source"])}>'
                    f'<figcaption><strong>{html.escape(block["label"])}</strong> '
                    f'<span>{html.escape(block["description"])}</span></figcaption>'
                    f'<p class="chart-axis-summary">{html.escape(block["xAxis"]["label"])} / '
                    f'{html.escape(block["yAxis"]["label"])}</p>{body}</figure>'
                )
                continue
            if block["kind"] == "diagram":
                if block.get("binaryExperiment"):
                    experiment = block["binaryExperiment"]
                    text = (f'{experiment["unitLabel"]}: {experiment["positiveLabel"]} (1) or {experiment["negativeLabel"]} (0). '
                            f'{experiment["trialName"]}. {experiment["trialCount"]} independent units; '
                            f'positive-outcome probability {100*experiment["positiveProbability"]:g} percent. '
                            f'Model simulation: Mulberry32, initial seed {experiment["seed"]}. '
                            'Show the outcomes, reveal the count and collect exactly one count per series. Not real measurements.')
                    nodes_text = "".join(f'<li>{html.escape(node["label"])}: {html.escape(node.get("description", ""))}</li>' for node in block["nodes"])
                    nodes_text += "".join(f'<li>{html.escape(stage["prompt"])}</li>' for stage in experiment.get("stages", []))
                    if experiment["mode"] not in ("decision", "series"):
                        text = f'Calculated teaching model: {experiment["trialCount"]} independent trials; constant positive-outcome probability {experiment["positiveProbability"]}. Not real measurements.'
                    blocks.append(f'<figure{fallback_attributes(block["source"])}><figcaption>{html.escape(block["label"])}</figcaption><p>{html.escape(block["description"])}</p><p>{html.escape(text)}</p><ul>{nodes_text}</ul></figure>')
                    continue
                if block["diagramType"] == "sequence":
                    role_labels = {role["id"]: role["label"] for role in block["participantRoles"]}
                    message_labels = {message["id"]: message["label"] for message in block["messages"]}
                    participants = "".join(
                        f'<li data-participant-role-id="{html.escape(role["id"], quote=True)}"{fallback_attributes(role["source"])}>{html.escape(role["label"])}</li>'
                        for role in block["participantRoles"]
                    )
                    messages = "".join(
                        f'<li data-interaction-message-id="{html.escape(message["id"], quote=True)}" '
                        f'data-source-role-id="{html.escape(message["sourceRoleId"], quote=True)}" '
                        f'data-target-role-id="{html.escape(message["targetRoleId"], quote=True)}"{fallback_attributes(message["source"])}>'
                        f'{html.escape(role_labels.get(message["sourceRoleId"], message["sourceRoleId"]))}: '
                        f'{html.escape(message["label"])} → '
                        f'{html.escape(role_labels.get(message["targetRoleId"], message["targetRoleId"]))}</li>'
                        for message in block["messages"]
                    )
                    state_fragments = []
                    for state in block.get("states", []):
                        active_message_ids = state.get("activeMessageIds", [])
                        active_messages = (
                            f'<p class="diagram-active-messages">Active messages: '
                            f'{html.escape(", ".join(message_labels.get(message_id, message_id) for message_id in active_message_ids))}</p>'
                            if active_message_ids
                            else ""
                        )
                        bindings = "".join(
                            f'<li data-participant-binding-role-id="{html.escape(binding["roleId"], quote=True)}" '
                            f'data-participant-id="{html.escape(binding["participantId"], quote=True)}"{fallback_attributes(binding["source"])}>'
                            f'{html.escape(role_labels.get(binding["roleId"], binding["roleId"]))}: {html.escape(binding["label"])}</li>'
                            for binding in state.get("participantBindings", [])
                        )
                        bindings_markup = f'<ul class="diagram-participant-bindings">{bindings}</ul>' if bindings else ""
                        active_attribute = (
                            f' data-active-message-ids="{html.escape(" ".join(active_message_ids), quote=True)}"'
                            if active_message_ids
                            else ""
                        )
                        state_fragments.append(
                            f'<section class="diagram-state" data-diagram-state-id="{html.escape(state["id"], quote=True)}"'
                            f'{active_attribute}{fallback_attributes(state["source"])}><strong>{html.escape(state["label"])}</strong>'
                            f'{active_messages}{bindings_markup}</section>'
                        )
                    states = "".join(state_fragments)
                    blocks.append(
                        f'<figure class="diagram-fallback" data-diagram-type="sequence"{fallback_attributes(block["source"])}>'
                        f'<figcaption><strong>{html.escape(block["label"])}</strong> <span>{html.escape(block["description"])}</span></figcaption>'
                        f'<ol class="diagram-participants">{participants}</ol>'
                        f'<ol class="diagram-messages">{messages}</ol>'
                        f'{states}'
                        f'</figure>'
                    )
                    continue
                labels = {node["id"]: node["label"] for node in block["nodes"]}
                nodes = "".join(
                    f'<li data-diagram-node-id="{html.escape(node["id"], quote=True)}"{fallback_attributes(node["source"])}>{html.escape(node["label"])}</li>'
                    for node in block["nodes"]
                )
                edges = "".join(
                    f'<li data-diagram-edge-id="{html.escape(edge["id"], quote=True)}"{fallback_attributes(edge["source"])}>'
                    f'{html.escape(labels.get(edge["sourceNodeId"], edge["sourceNodeId"]))}: '
                    f'{html.escape(edge["label"])} → '
                    f'{html.escape(labels.get(edge["targetNodeId"], edge["targetNodeId"]))}'
                    f'</li>'
                    for edge in block["edges"]
                )
                focus_attribute = (
                    f' data-focus-node-id="{html.escape(block["focusNodeId"], quote=True)}"'
                    if block.get("focusNodeId")
                    else ""
                )
                states = "".join(
                    f'<section class="diagram-state" data-diagram-state-id="{html.escape(state["id"], quote=True)}"{fallback_attributes(state["source"])}>'
                    f'<strong>{html.escape(state["label"])}</strong>'
                    + "".join(
                        f'<p data-shared-edge-annotation-id="{html.escape(annotation["id"], quote=True)}" '
                        f'data-edge-ids="{html.escape(" ".join(annotation["edgeIds"]), quote=True)}"{fallback_attributes(annotation["source"])}>'
                        f'{html.escape(annotation["label"])}</p>'
                        for annotation in state["sharedEdgeAnnotations"]
                    )
                    + '</section>'
                    for state in block.get("states", [])
                )
                blocks.append(
                    f'<figure class="diagram-fallback" data-diagram-type="{html.escape(block["diagramType"], quote=True)}"'
                    f'{focus_attribute}{fallback_attributes(block["source"])}>'
                    f'<figcaption><strong>{html.escape(block["label"])}</strong> <span>{html.escape(block["description"])}</span></figcaption>'
                    f'<ol class="diagram-nodes">{nodes}</ol>'
                    f'<ol class="diagram-edges">{edges}</ol>'
                    f'{states}'
                    f'</figure>'
                )
                continue
            if block["kind"] == "prompt":
                response_mode = block.get("responseMode")
                if response_mode is None:
                    raise ValueError("Prompt block requires responseMode")
                if response_mode == "single-choice":
                    prompt_options = block.get("options")
                    if not prompt_options:
                        raise ValueError("single-choice prompt requires at least one option")
                    poll_key = block["source"][0]["resourceId"]
                    option_ids = " ".join(source["resourceId"] for source in block["source"][1:])
                    options = "".join(f'<li>{html.escape(option)}</li>' for option in prompt_options)
                    blocks.append(
                        f'<div class="poll-fallback" data-poll-key="{html.escape(poll_key, quote=True)}" '
                        f'data-poll-option-ids="{html.escape(option_ids, quote=True)}"{fallback_attributes(block["source"])}>'
                        f'{teaching_text_fallback(block["prompt"])}<ul>{options}</ul>'
                        f'</div>'
                    )
                elif response_mode == "free-text":
                    blocks.append(
                        f'<div class="prompt-fallback"{fallback_attributes(block["source"])}>'
                        f'{teaching_text_fallback(block["prompt"])}'
                        f'</div>'
                    )
                else:
                    raise ValueError(f"Unsupported prompt response mode: {response_mode}")
                continue
            tag = "h2" if block["intent"]["kind"] == "introduce" else "blockquote" if block["intent"]["kind"] == "explain" else "cite"
            class_name = ' class="lead"' if tag == "blockquote" else ' class="citation"' if tag == "cite" else ""
            blocks.append(
                f'<{tag}{class_name}{fallback_attributes(block["source"])}>'
                f'{html.escape(block["text"])}'
                f'</{tag}>'
            )
        if _fragment:
            articles.append("".join(blocks))
            continue
        articles.append(
            f'<article data-pitch-step="{html.escape(scene["id"], quote=True)}" '
            f'data-source-path-id="{html.escape(document["sourcePathId"], quote=True)}"{fallback_attributes(scene["source"])}>'
            + (f'<p class="scene-topic"{fallback_attributes(scene["topic"]["source"])}>Topic: {html.escape(scene["topic"]["label"])}</p>' if scene.get("topic") else "")
            + "".join(blocks)
            + "</article>"
        )
    return "\n".join(articles)


