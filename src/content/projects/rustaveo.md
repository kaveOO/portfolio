---
title: RUSTAVEO
order: 1
year: 2026
context: Paid SaaS, built and run solo
role: Solo (product, backend, frontend, infrastructure)
tags: [TypeScript, Fastify, PostgreSQL, React 19, WebSockets, Docker, Caddy, Chrome extension]
summary: A paid companion web app for the game Rust. It sends raid alerts the second a base is hit, profiles enemy players, and runs a team's base from a shared live map, built on the Rust+ companion protocol.
cover:
  src: images/rustaveo.webp
  avif: images/rustaveo.avif
  alt: "The Rustaveo web app: a live map of a Rust server with its grid, monuments and player markers, beside the sidebar for intel, tracking, alerts and automations"
  width: 1920
  height: 1009
results:
  - value: 80k
    label: lines of TypeScript in one monorepo
  - value: "680"
    label: tests that gate every merge
---

## Goal

Rust players lose their bases while they sleep. The game's official companion app (Rust+) can talk to a server, but it only reaches the people who have it open. I wanted a hosted product a whole clan could share: raid alerts that actually wake you up, intel on the players around you, and the base's switches and alarms on one live map, with nothing to install.

## What I built

A full product, from the protocol connection to billing, that I designed, built, shipped and ran on my own.

- **Raid alerts on every channel.** When a paired alarm fires, the team is notified in the app, by web push, on Discord and Telegram, and by a phone call with text-to-speech, with retries and per-plan call budgets.
- **Player intel.** Look up any player: account age, Rust hours, bans, past names, possible alt accounts and a cheat-suspicion score with its reasons. Reports can be shared as a public link that unfurls as a card in Discord.
- **A shared live map.** Team positions, monuments and markers on the server's map, pushed live over WebSockets, with smart switches, alarms and automations controlled from the same screen.
- **Accounts and billing.** Steam login, plans with limits, a 7-day Pro trial and Stripe checkout.
- **A Chrome extension** that links a player's Rust+ account in one click, and tags teammates on their Steam friends list.

## How it fits together

A browser can't speak the Rust+ protocol, so Rustaveo is a backend that holds the game connections, and a web app that talks to it. The connection itself uses the open-source [rustplus.js](https://github.com/liamcottle/rustplus.js) client for the reverse-engineered Rust+ protocol. Everything around it is mine.

```text
Browser (React + Vite)
  │  HTTPS (REST) + WSS (live push)
  ▼
Caddy (TLS) ──► Node backend (Fastify)
                 ├─ Steam OpenID login
                 ├─ rustplus.js connection ──► Rust game server
                 ├─ Postgres (servers, credentials, events)
                 └─ serves the built web app (single origin)
```

The code is one TypeScript monorepo: `shared/` for the types used on both sides, `server/` for the Fastify API, WebSocket hub and game connections, and `web/` for the React single-page app.

## Keeping players' credentials safe

Linking a game account means handling a token that can control a player's base, so it never reaches the browser.

- Tokens are encrypted at rest in Postgres with AES-256-GCM and only ever decrypted on the server.
- Every request checks access to that server's data: owner, team member or admin.
- The extension hands the token back in the URL fragment (`#token=…`), which browsers never send to a server, so it stays out of request logs. The published build only accepts `https://rustaveo.com` as a return address.

## Shipping it

Releases went out without downtime on Docker and Caddy, which also handles HTTPS. The 680 tests gate every merge, and each deploy is pinned to a commit so a bad release rolls back automatically.

## Why it closed

Everything in Rustaveo runs through the Rust+ companion API. In 2026 Facepunch, the studio behind Rust, nerfed that API, and the features the product was built on stopped being possible. Rather than keep charging for a weaker product, I closed it in November 2026: renewals were stopped and unused paid days refunded.
