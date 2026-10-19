## Build plan

- **File structure:** `index.html` for the accessible app shell, `styles.css` for the mobile-first responsive design, `app.js` for application logic (organized into clear sections), and `README.md` for local setup, deployment, and backup guidance. Plain HTML, CSS, and JavaScript; no dependencies or build step.
- **Data model:** Persist `{ listings, leads, viewings }` under one versioned `localStorage` key (`crm_v1`). Use the fields and status values in the brief, with IDs and timestamps. Centralize storage and validation; provide JSON export/import and demo/clear actions in Settings.
- **Screens:** Dashboard with today’s viewings, due follow-ups, and stale listings; searchable/filterable Listings and Leads lists with detail/history; Viewings scheduling with a non-blocking one-hour conflict warning; completion feedback form; Settings for backup and data management.
- **Behavior and verification:** Derive local dates from the device clock, format SGD and dates as specified, confirm cascade deletion, and require follow-up details except for “Not interested.” Check demo-data date boundaries, feedback-to-follow-up and mark-done flow, export/clear/import, and responsive keyboard-accessible layouts at 375px and 1280px.

Waiting for your go-ahead before writing the app code.
