# Shema Electro – rules for Claude

## Updates (deploy rule from the owner)
- Never push, publish or deploy any change (this repo, GitHub Pages, the Firebase rules/console, or the Claude artifact
  "واش نشريها؟" 2d4dd4fd-e6e3-4b76-aaa2-41548505028a) unless the owner's **current** chat message contains the text `1998`.
- Without `1998`: prepare and test the change locally, explain it, and ask the owner to write 1998 to release it.

## Never lose data
- App data lives in Firestore (project united-yeti-472800-n6). Code updates must never delete, overwrite or migrate
  existing documents, never call clearPersistence(), never clear localStorage keys starting with `wns-` or `se-`.
- Updates must NEVER sign anyone out (forced logout on update caused repeated logouts and was removed on purpose). The only
  sign-outs are the manual buttons; each one records its reason in localStorage `se-why`, shown on the login screen.
- Build the app with `python3 build_app.py <N>` (copies the Claude artifact app and injects shim.js); bump N on every release.

## Status (12 Nov 2026)
- The owner asked to stop the GitHub website and the standalone Firebase app. Both pages now only say the site is stopped
  (old code is still in git history). Work continues only on the Claude artifact app.
