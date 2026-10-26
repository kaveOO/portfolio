---
title: Rebuilding my homelab, again
date: 2026-09-14
tag: Hardware
description: "Third rebuild in four years. This time the goal was boring: fewer machines, less noise, and nothing I have to remember how to fix."
---

The old setup grew one weekend at a time. A mini PC for media, a second one for experiments, a Raspberry Pi doing DNS, and a NAS that nobody else in the house was allowed to touch. Each piece made sense on the day I added it. Together they made a system only I could debug, usually late at night.

So I wrote down what I actually use it for. The list was short: backups, a few self-hosted apps, a place to run long jobs, and a sandbox for trying things without paying for cloud time.

## One box, three jobs

Everything now runs on a single quiet machine with plenty of RAM and two mirrored drives. Services live in containers, each with its own folder holding the config and the data. If a folder is backed up, the service can be rebuilt. That rule replaced most of my notes.

- Backups run nightly and get checked weekly by restoring one random folder.
- Apps sit behind one reverse proxy with a single place for certificates.
- Experiments get a throwaway VM that resets every Sunday.

<figure>
<div class="ph"><span>Photo: the new rack shelf</span></div>
<figcaption>Four devices became one. The cable count went from 19 to 5.</figcaption>
</figure>

## The backup check

The most useful script in the whole setup is twelve lines long. It picks a service at random, restores its folder somewhere temporary and checks that the app starts.

```bash
svc=$(ls /srv | shuf -n1)
restic restore latest --include /srv/$svc --target /tmp/check
docker compose -f /tmp/check/srv/$svc/compose.yml up -d
curl -fsS http://localhost:$(cat /srv/$svc/.port) > /dev/null \
  && echo "ok: $svc" || echo "FAILED: $svc"
```

> A backup you have never restored is a guess.

## What I would do differently

I would have started with the list instead of the hardware. Most of the complexity came from buying something first and finding a job for it later. Next time something new arrives, it has to replace a line on the list or it goes back in the box.
