---
title: Rustorigin
caps: true
order: 1
year: 2026
context: Game security, for my own network of modded Rust servers
role: "Anti-cheat design and engineering: client, server and review tooling"
tags: [Anti-cheat, Windows internals, C#, .NET, Win32, Oxide, Harmony, Node.js]
summary: "A custom anti-cheat for my own Rust servers, which run a build with no EasyAntiCheat. A client-side anti-cheat in the launcher catches injected code, memory readers, kernel drivers and overlays; the server catches recoil scripts and aimbots; and a review panel turns it all into bans. 320 bans in its last 30 days."
cover:
  src: images/rustorigin.webp
  avif: images/rustorigin.avif
  alt: "The Rustorigin admin panel, anti-cheat page, with player names hidden: real launcher findings from live players, including an unsigned module, unsigned kernel drivers, a kernel driver loaded from a user folder, a program with read/write access to game memory and a patched game file"
  width: 1920
  height: 1009
results:
  - value: "320"
    label: bans in the last 30 days, across both servers
  - value: "97"
    label: ban-evasion accounts caught on the same PC as a banned player
  - value: "629"
    label: anti-cheat cases closed as false alarms, with nobody banned
  - value: "2,000+"
    label: automated tests across the launcher, the session service and the panel
links:
  - label: Visit Rustorigin
    href: https://rustorigin.com
---

## Goal

Rustorigin runs Rust as it played in April 2021, with the old recoil: a Main server with weekly wipes, and a Training server with free-for-all, scrims and arenas. That build doesn't ship with EasyAntiCheat, so nothing stops a recoil script or an aimbot by default. Players only stay on a server they trust, so the anti-cheat had to be good, and it had to be fair: banning a legitimate player is as bad for a community server as missing a cheater.

## The threat model

What players actually run against this build, and the layer that catches each one:

- **Recoil scripts and macros** move the mouse for the player. *Caught by* the server, which matches spray paths across sessions and accounts, and by the launcher, which sees mouse input that no physical device produced.
- **Internal cheats** are injected into the game as a DLL or mapped in by hand. *Caught by* the launcher: unsigned or hidden modules, executable memory no module accounts for, threads started outside every module, and game code patched in memory.
- **External cheats** read the game's memory from another process to draw an ESP. *Caught by* a system handle scan, run through an elevated helper, that finds programs holding read/write access to the game.
- **Kernel-mode cheats** load a driver to hide from user-mode checks. *Caught by* the launcher's view of the PC: unsigned drivers, drivers loaded from user folders, test signing and driver signature enforcement turned off.
- **Overlays** draw the ESP on top of the game, often hidden from screen capture so they don't show in clips. *Caught by* overlay checks, including windows excluded from capture and overlays drawn inside the game itself.
- **Aimbots and silent aim** snap to targets or hit where the player isn't looking. *Caught by* the server's aim checks, scored only when independent checks agree.
- **Ban evasion** means a new Steam account, often with spoofed hardware IDs. *Caught by* hashed PC component IDs, same-PC linking in the panel and spoofer signs, such as a machine ID that keeps changing on the same hardware.
- **Skipping the anti-cheat** by starting the game without the launcher or faking it. *Caught by* the signed session and the game link: no live session tied to that exact game client means a kick.

## One system, three layers

- **On the server:** OriginAntiCheat, an Oxide plugin in C# (about 4,400 lines), watches every shot, hit and movement tick and files what it sees under 17 categories, from recoil scripts and silent aim to snaps, rapid fire and shots through walls.
- **On the player's PC:** the Rustorigin launcher, a Windows app in C# (about 21,000 lines), is also a client-side anti-cheat. It keeps a signed session with the server and reports what it sees in and around the game.
- **In the admin panel:** a Node.js web panel (about 30,000 lines) turns detections into cases that staff decide, links alt accounts, and syncs bans across servers.

## The client-side anti-cheat

A server only sees what the game sends it. Most cheats live on the player's PC: a program reading the game's memory, code injected into it, a patched game file, or a script moving the mouse. So the launcher players use to install and start the game is also an anti-cheat client.

**How it's built.** C# on .NET Framework with a WPF interface and no third-party code at all, in two processes:

- **The launcher** runs as the normal user. It installs and updates the game, starts it inside a Windows job object (closing the launcher ends the game too), and runs the checks.
- **A small helper** runs with admin rights for the one thing that needs them: listing which programs hold a handle to the game. It answers over a private named pipe, and both sides check who they are talking to.

**What it checks, in the background while the game runs:**

- **Game files and code:** game files are re-hashed against their published hashes, and the game's code in memory is compared with its file on disk, so a patched file or a patch made in memory both show up.
- **Injected code:** DLLs loaded into the game are checked for a trusted signature, and the game's memory is walked for executable code that no loaded module accounts for, which is what manually injected cheats leave behind. Threads that start outside every module are caught too.
- **Hooks and overlays:** the game is checked for hooked functions and for overlays drawn over it or inside it, the usual way an ESP is shown to the player.
- **Memory readers:** a system handle snapshot finds programs that have opened the game to read or write its memory. Signed software is reported by publisher, unsigned programs by hash.
- **Scripted input:** mouse input that was generated by software instead of a real mouse is counted while the player fires, and a second mouse device is noticed. That's the client half of recoil-script detection.
- **The PC itself:** test signing, kernel debugging, driver signature enforcement, Secure Boot, TPM and virtual machines, plus signs of spoofed hardware IDs.
- **Its own health:** if a scanner stops or fails, the launcher says so. Silence never passes as clean.

**What happens with it.** The launcher never bans or kicks on its own. Every check becomes a short label in a heartbeat signed with a per-session key, sent over a pinned TLS connection, and the server decides. New checks start in measure-only mode, and they only feed a case once they've proven reliable.

**Tied to the real game.** When a player joins, and regularly after that, the server checks for a live launcher session on that SteamID and IP, and kicks anyone who started the game another way. To prove the launcher sits next to that exact game, the server sends a one-time code to the game client, and the launcher has to read it back and sign it. The gate ran in shadow mode, logging only, before it was enforced, and it fails open: an outage on the server never kicks anyone.

**No false alarms on normal PCs.** A failed read means "no answer", never a label. The signature rule was tested against the software players really run, from game launchers and chat apps to graphics drivers, mouse software, recording tools and antivirus, and 300 full scans with all of it running produced no labels.

**Light on the game.** A full scan takes 41 ms at the median and 72 ms at the 95th percentile. Beside the running game the launcher uses about 0.8% of the machine's CPU and a flat 130 MB of memory, with no handle or thread leaks over 300 scans.

**A launcher that's hard to turn against players.** Anything that runs with admin rights and updates itself is a target. Every download is checked against its SHA-256 before use, updates are only trusted with an offline RSA signature, and the installer is code-signed. Two security audits found no critical or high-severity issue. The medium ones were fixed, including a DLL-planting path closed by loading system libraries only from System32.

## Catching recoil scripts

Recoil scripts are the most common cheat on old-recoil servers: they move the mouse for the player to cancel the spray pattern. The plugin compares the crosshair path of each controlled spray in three ways: against the player's other sprays in the same session, against their earlier sessions, and against every other player through a shared spray index. The same script shows up as the same path, even when it moves to a new account. Paths are also matched against 32 recoil tables from published open-source scripts.

## Not banning the wrong player

The first versions flagged real players, me included. Version 3.0 is a rework driven by 29 days of production logs: 94,000 sprays from 266 players.

- **Checks have roles.** Some are strong enough to count, some only support a finding, some only log. A flag needs corroboration: two different strong checks, or the same one repeated across separate episodes.
- **Bad connections don't count.** Nothing is scored while a player lags, has just joined, teleports or gets on a vehicle.
- **The game's own checks only log.** Its built-in AntiHack fires tens of thousands of times a month on a busy server, mostly on innocent players, so it feeds the evidence but never flags on its own.
- **People decide.** By default the plugin never bans. It raises alerts, and staff review the evidence and make the call.

## Reviewing evidence in the panel

- **Cases:** anti-cheat flags and ban-evasion signals open cases automatically, and every case ends in a recorded decision: cheating, false alarm, or needs more data.
- **A combined reading:** the panel counts how many independent kinds of evidence agree over 30 days (recoil, aim, shot timing, launcher input, client integrity). It informs the decision and never makes it.
- **Alt accounts and ban evasion:** accounts are linked by the same PC, PC components, network, name and Steam family sharing, each with its own weight, so one weak match is not enough.
- **Ban waves:** confirmed bans can be held and executed together, so a cheat's author can't tell which signal caught whom.
- **One ban list:** bans sync across every server, and lost ones are re-sent automatically.

## In production

Numbers from the live panel, in November 2026:

- **320 bans in 30 days.** 75 were automatic, when the launcher found a known cheat injected into the game. 84 came from the ban-evasion check. Staff issued the rest by hand, from cases, reports and in-game checks.
- **97 ban-evasion accounts** banned because they played from the same PC as an account that was already banned.
- **1,187 cases opened in six weeks, 629 of them closed as false alarms.** A flag only starts a review, and more than half of the reviews ended with nobody banned. That's the system working as designed, not noise reaching players.

## Keeping players' data private

The launcher asks for consent before the first game, and nothing is sent without it. Labels are fixed words, never memory contents, file paths or window titles. Game files are hashed on the PC and only "modified" leaves it, and program names are compared as hashes salted per session. Hardware IDs are hashed on the PC as well. On the server they're hashed again with a secret key, keeps them in memory only, and logs counts, never values. IP geolocation was removed from the panel so no player address goes to a third party, and data is kept only as long as the privacy page says.

## Making the game's own checks accurate

Training runs several copies of an arena at the same coordinates. The game's own checks for noclip, line of sight and building placement were hitting walls from the other copies, so honest players were caught out. A Harmony patch in C# hides the other copies from those checks, which keeps the built-in anti-cheat accurate instead of noisy.

## How I built it

I designed the system and wrote it with Claude Code as my pair programmer: I set the rules, reviewed every change, tested it against real production logs and ran it live. The launcher has over 1,500 test cases and 31,000 fuzz cases, run in CI on Windows, plus a live harness where harmless stand-ins for cheats (a memory reader, a debugger, an overlay, an unsigned DLL) run against a fake game to check that each label really reaches the server. The session service has 89 tests and the panel around 410.
