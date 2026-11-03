# Shared teaching rendering

This package owns the pure inline mathematics, authored symbol definitions and
mathematical derivation HTML used by Reveal and Self-Study. It depends on the
renderer-neutral core and KaTeX; it must not import either application, Reveal.js,
or either output adapter.

Reveal's previous module paths re-export these functions for compatibility.
Self-Study imports this package directly. The HTML behavior and authored legend
contents are preserved; disclosure, presentation layout and print behavior remain
the responsibility of the consuming adapter.
