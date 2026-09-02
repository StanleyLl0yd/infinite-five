# Security Policy

## Reporting a vulnerability

Please do not report security vulnerabilities through public issues, pull requests, discussions, or comments.

Use GitHub Private Vulnerability Reporting for this repository: open the repository **Security** tab and choose **Report a vulnerability**. Include enough information to reproduce and assess the issue, such as the affected component, impact, reproduction steps, and any relevant proof of concept.

Do not include real credentials, personal data, or third-party secrets in a report.

## Supported version

Security fixes are applied to the latest published release, the current code on `main`, and the officially hosted Infinite Five web application. Older releases, unrelated historical commits, forks, mirrors, and unofficial deployments are not supported.

## Scope

Security reports may cover the web application, PWA behavior, Rust game-core trust boundaries, dependency or supply-chain risks, GitHub Actions workflows, native release packaging, and accidental exposure of secrets. npm dependencies are audited in CI and both Rust lockfiles are checked against RustSec advisories without blanket ignores.

Ordinary gameplay bugs, AI behavior, visual issues, and feature requests should use the normal issue tracker instead.
