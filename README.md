Entei
===

API for tech events in Singapore.

This API grabs a list of upcoming events from Meetup.com, for **today**, filtered out some not-so-techie groups, and return a nicer, more compact list in JSON format.

Technicalities
---

- Setup
  - `npm i` for installing all dependencies
  - Create `.env` file with `MEETUP_API_KEY` key and value
- Running
  - `npm run dev` - start a local development server
  - `npm start` - start a production server