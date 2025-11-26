# Common Ground Governance

_Last updated: 2025-11-25_

This document describes how decisions about the **Common Ground** project are
intended to be made, including decisions about the codebase, releases, and
license for future versions.

This is a **project governance document**, not a software license. It does not
change the terms of the AGPL or any other license already granted for the code.

---

## 1. Goals and Principles

The governance of Common Ground aims to:

1. Keep the project **open, transparent, and community-driven**.
2. Balance agility (being able to move fast) with **broad participation**.
3. Allow the community to **adapt licensing and policy over time**, while
   respecting rights already granted to users and contributors.
4. Provide clear expectations for contributors, instance operators, and users.

---

## 2. Scope of Governance

The governance process applies to:

- The main Common Ground code repositories and official releases.
- Project-wide policies such as this document, the trademark policy, and
  contributor agreements.
- Decisions about **license choices for future versions** of the software and
  any license exceptions or additional permissions.

This document does _not_ define how individual communities or instances govern
their own usage of the software.

---

## 3. Governance Components

### 3.1 Community

The **Common Ground community** includes everyone who:

- contributes code, documentation, or design,
- operates or participates in instances and services built on Common Ground,
- holds or uses the project’s governance token, or
- otherwise takes part in the project’s discussions and decisions.

### 3.2 Governance Token and On-Chain Voting

The project may use a **governance token** (for example, an ERC-20 token)
to represent voting power in certain project-wide decisions.

- Holders of the governance token may be able to create and vote on proposals
  via one or more **on-chain governance contracts**.
- These contracts are intended to provide a transparent, verifiable record of
  major decisions (for example, changing the license for future releases or
  granting specific license exceptions).

Details of the current governance contracts and parameters (such as quorum,
voting period, and thresholds) are documented separately and may evolve over
time.

### 3.3 Core Maintainers

The **core maintainers** are contributors with commit access to one or more
official repositories who are responsible for:

- reviewing and merging pull requests,
- triaging and resolving issues,
- preparing releases, and
- implementing decisions that come out of community and on-chain governance.

The set of core maintainers may change over time through community processes
or as described in the repository’s CONTRIBUTING guidelines.

---

## 4. License Policy and Future Changes

### 4.1 Current License

As of this document’s last update, the main Common Ground software is licensed
under the **GNU Affero General Public License, version 3 (AGPL-3.0)**, with
any additional terms described in `LICENSE-ADDITIONAL-TERMS.md`.

The AGPL grants recipients certain rights that are **perpetual and
non-revocable** as long as they comply with its terms.

### 4.2 Future License Changes and Exceptions

The project may, in the future:

- release new versions of the software under a different license, or
- grant additional license permissions or exceptions (for example, to allow
  specific uses that are not covered by the standard AGPL terms).

Such decisions are expected to follow the governance process of the Common
Ground community by being proposed and voted on through the governance token and on-chain
voting mechanisms.

Any such future changes or exceptions:

- **do not alter** the terms of the AGPL license already granted for past
  versions of the software, and
- apply only to the versions and components explicitly covered by the new
  decision.

### 4.3 Contributor Agreements

To make future license changes or exceptions practically possible while
respecting contributors’ rights, the project may use:

- **Contributor License Agreements (CLAs)** or
- similar contribution terms

that allow the project to:

- relicense contributions for future releases in accordance with the governance
  process, and
- grant additional permissions when approved by the community.

Contributors should review and accept the applicable contribution terms before
their contributions are merged.

---

## 5. Role of Core Maintainers in Governance

Core maintainers are expected to:

- implement accepted governance proposals (for example, by updating license
  notices, repository configuration, or release processes),
- act in good faith to follow the outcomes of on-chain
  governance decisions, where legally and practically possible, and
- be transparent about changes that affect licensing, policy, or user rights.

In situations where a governance decision cannot be implemented exactly as
proposed (for example, due to legal constraints), core maintainers should
communicate the issue and work with the community to find an alternative that
respects the intent of the decision.

---

## 6. Changes to this Governance Document

This document itself may evolve over time as the Common Ground project and its
governance mechanisms mature.

Changes to this document should:

1. Be proposed publicly (for example, as pull requests to this file).
2. Be discussed with the community.
3. Where appropriate, be ratified through the same governance mechanisms used
   for other project-wide decisions (i.e., governance token voting).

The current version of this document is always the one found in the main
Common Ground repository.
