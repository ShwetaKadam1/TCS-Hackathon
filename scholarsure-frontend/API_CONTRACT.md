# Suggested API contract — agree with backend teammate

Base URL should be configurable (for example `VITE_API_BASE_URL=http://localhost:5000/api`).

Suggested endpoints:
- `POST /auth/login`
- `GET /auth/me`
- `GET /applications`
- `GET /applications/:id`
- `POST /applications`
- `POST /applications/:id/documents` (multipart/form-data or signed upload)
- `POST /applications/:id/screen`
- `POST /applications/:id/request-information`
- `POST /applications/:id/decision`
- `POST /applications/:id/documents/:documentId/verify`
- `GET /schemes`, `POST /schemes`, `PATCH /schemes/:id`
- `GET /audit-log`

Screening response should include `recommendation`, `reasons`, criterion results (`PASS`, `FAIL`, `UNKNOWN`), evidence quality level/explanation, rules version and timestamp. Final decision must be stored separately from recommendation.

Decision request example:
`{ "decision": "APPROVED", "reason": "Reviewed verified documents; criteria pass." }`

Backend is authoritative: never trust roles, recommendation, document-verification flags or decisions supplied by the browser. Validate permissions and ownership server-side, keep documents private, and append audit events server-side.
