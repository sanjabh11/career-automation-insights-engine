---
description: global agent workflow using planning, verification, and lessons capture
---
1. For any non-trivial task, create or update `tasks/todo.md` before implementation with outcome-oriented checklist items.
2. Confirm the intended implementation path, scope, and verification strategy before making broad code changes.
3. If execution deviates, stops making progress, or uncovers new architectural constraints, stop and re-plan in `tasks/todo.md` before continuing.
4. Use focused research and parallel reads where appropriate to keep working context clean.
5. After implementation, verify behavior with the relevant tests, manual checks, or log inspection before marking work complete.
6. If the user corrects the agent or a mistake pattern is found, append the pattern and prevention rule to `tasks/lessons.md`.
7. End each substantial task with a concise completion summary, verification status, and any remaining risks or follow-ups.
