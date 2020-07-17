
# taskwarrior-api

[![Commit checks](https://github.com/Mossop/taskwarrior-api/workflows/Commit%20checks/badge.svg)](https://github.com/Mossop/taskwarrior-api/actions?query=workflow%3A%22Commit+checks%22)
[![codecov](https://codecov.io/gh/Mossop/taskwarrior-api/branch/master/graph/badge.svg)](https://codecov.io/gh/Mossop/taskwarrior-api)

An asynchronous API for interracting with [Taskwarrior](https://taskwarrior.org/).

Planned features include:

* Asynchronous using promises.
* Type-safe using TypeScript.
* Full support for UDAs.
* Hides most of the low-level bits of Taskwarrior from you.
* A good suite of automated tests.

## Alternatives

Why not use the existing [taskwarrior](https://www.npmjs.com/package/taskwarrior) module?

It was last updated four years ago so I didn't have a lot of confidence that it would be still
working. Also the github repository hosting it seems to have been deleted.

Why not use [taskwarrior-lib](https://www.npmjs.com/package/taskwarrior-lib)

It's a nice looking library however its API is synchronous and pretty low-level. By all means use it
if that is what you're looking for.

