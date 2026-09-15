# Contributing Guide

[简体中文](CONTRIBUTING.md) | English

Thank you for improving PVLANE. The project prioritizes a small feature set, explicit calculation definitions, and reliable core workflows.

## Reporting an issue

Search existing GitHub Issues first. A new report should include:

- Operating system, Chrome or Edge version, and Node.js version.
- Minimal reproduction steps, actual result, and expected result.
- A screenshot or minimized project file when necessary.

A project JSON may embed base drawings and business data. Do not upload drawings, customer data, personal information, or other sensitive material that you are not authorized to publish.

## Submitting code

1. Fork the repository and create a feature branch from the current default branch.
2. Install dependencies with `npm ci`.
3. Keep the change limited to the problem being solved. Add meaningful tests for calculation, parsing, or state logic.
4. Run `npm test` and `npm run build`.
5. Open a Pull Request describing the problem, final behavior, and validation.

For interface changes, also check affected flows such as project creation, layout, save state, and reporting in desktop Chrome or Edge.

## Contribution license

By submitting a contribution, you confirm that you have the right to submit it and agree that the copyright holder may use, modify, and relicense your contribution under the same terms as this project's [LICENSE.md](LICENSE.md). Do not submit code, images, fonts, data, or other material that is incompatible with the project license.

A code contribution and commercial authorization are separate. Contributing code does not automatically grant authorization for restricted commercial activities.
