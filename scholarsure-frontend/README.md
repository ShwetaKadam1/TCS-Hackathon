# ScholarSure frontend

React + TypeScript + Vite hackathon prototype.

## Run it
1. Install Node.js LTS from https://nodejs.org/
2. Open this folder in VS Code.
3. Terminal → New Terminal, then run:
   `npm install`
   `npm run dev`
4. Open the local URL Vite prints (usually http://localhost:5173).

## Features
- Role-view switch for Applicant, Evaluator, Admin (demo only, not authentication)
- Overview and application list
- Three seeded cases: approval, rejection, missing document
- Deterministic demo rules in `src/engine.ts`
- Evaluator decision with required reason
- Applicant demo application form
- Basic admin scheme screen and local activity view

## Important
This is a frontend demo using in-memory data. Refreshing resets changes. It does not currently connect to your friend's backend; document checkboxes are not actual uploads; role switching is not secure authentication; the activity view is not a secure audit log. Backend must enforce permissions and recalculate rules before saving decisions. Do not use for real scholarship decisions.

See `API_CONTRACT.md` for proposed endpoint names to coordinate with your backend teammate.
