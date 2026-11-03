"""Shared test imports for the integrated Level 5 lecture, not an obsolete preview."""
import sys
import unittest
from pathlib import Path
from rdflib import Namespace
from pyshacl import validate

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import rdf_dataset
import generate_canonical_runtime as runtime
import validate_semantics

BASE='https://w3id.org/project-chemie-digital/graph/'
CD=Namespace('https://w3id.org/project-chemie-digital/ontology/')
EX=Namespace('https://w3id.org/project-chemie-digital/resource/')
