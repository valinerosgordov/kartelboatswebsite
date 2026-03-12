# Kartel Boats - Project Rules

## WHO WE ARE
- Natalya: UX/UI designer, basic front-end knowledge, no coding experience
- Oleg: Brother and Founder of Kartel Boats, built the website, manages the live site

## THE ONE RULE THAT CANNOT BE BROKEN
**We ONLY edit `index_test.html`. No other file. Ever.**

The live website is running on the other files (index.html, etc.).
Changing anything outside of index_test.html could crash the live site.

## Files we touch
- `index_test.html` — this is our sandbox / test page. ALL changes go here.

## Files we NEVER touch
- `index.html` (this is the LIVE site)
- `index_dev.html`
- Everything in `assets/`, `images/`, `videos/`, `External_Files/`
- `CNAME`, `robots.txt`, `sitemap.xml`
- Any config or Google/Yandex verification files

## BACKUPS
- Before making changes, always create a backup copy named `index_test_BACKUP.html`
- If we need multiple backups, name them `index_test_BACKUP_2.html`, etc.
- Automatically create a new backup before any major code change (not just at the start)
- This way we can always go back if something goes wrong

## GIT / PUSHING CODE
- **Claude must NEVER push code to GitHub**
- **Claude must NEVER make git commits unless Natalya explicitly asks**
- Natalya will push changes herself through GitHub Desktop

## WHAT KIND OF CHANGES WE MAKE
- Simple UI and UX improvements only
- We are NOT redesigning the website
- We respect the existing design and just improve the user experience
- Small, careful changes — one thing at a time

## HOW TO WORK WITH NATALYA
- Explain everything in simple, non-technical terms
- Always describe what a change will look like before making it
- Ask before making changes, don't assume
- Show what was changed after each edit
