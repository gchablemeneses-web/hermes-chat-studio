# Version 1.1.0 verification

## Automated behavior

The locked test dependencies were installed with `npm ci --ignore-scripts`.
The package test script (`node --experimental-vm-modules tests/behavior.mjs`)
passed all eight checks:

1. SDK mount and default transcript scope.
2. Every one-click preset and preservation of the external live-agent panel.
3. Custom controls and persistent settings across remounts.
4. Saved styles and configuration JSON round trips.
5. Bounded numbers and rejection of CSS injection through configuration.
6. Storage write failure without partially applying settings.
7. Spanish UI and restoration without deleting saved styles.
8. Clean teardown and repeated reload without accumulated side effects.

The VM Modules warning belongs to Node's test harness. The installed plugin
does not use the VM API or evaluate scripts.

## Official admission check

The installed Hermes CLI's public parser and `plugins validate` command ran
with `--install-deps --json` and exited 0. All eleven admission checks passed,
including security scan `safe` and the documented Desktop SDK surface.
The validator reports one expected warning: the Python capability probe is
skipped because this desktop-only package has no Python `__init__.py`.

## Native UI

Real clicks in Hermes Desktop on Windows verified the title-bar button,
the plugin-owned settings dialog, preset application, custom text sizing,
and closing/reopening the dialog with the modified value retained.
The screenshot shows that dialog's synthetic preview, cropped to exclude
conversations and account information.

Native checks were performed on Windows and Hermes 0.21.5. Other operating
systems, every screen size, and future transcript markup are not covered by
this native check. The automated SDK adapters do not prove future host
compatibility. This plugin makes no network or model calls. Hermes's Desktop
loader isolates errors, not capabilities; SDK-only code is not a security sandbox.

