---
title: AssaultCubeDMA
order: 3
year: 2025
context: Personal project
tags: [C++, DMA, MemProcFS, IDA Pro, ImGui, Direct3D 9]
summary: An external proof-of-concept cheat for AssaultCube that reads game memory through a PCIe DMA card instead of the operating system, and draws an ESP overlay on top of the game.
cover:
  src: images/assaultcube-dma.webp
  avif: images/assaultcube-dma.avif
  alt: "AssaultCubeDMA running in AssaultCube: ESP boxes and distances around players, and a panel with the targeted player’s stats"
  width: 1920
  height: 1009
video: T_itQoNx3rk
links:
  - label: Code on GitHub ↗
    href: https://github.com/kaveOO/AssaultCubeDMA
  - label: Demo on YouTube ↗
    href: https://www.youtube.com/watch?v=T_itQoNx3rk
---

## Goal

A learning project in external memory access and reverse engineering. I wanted to read a running game’s memory from outside the process, through a DMA card rather than the Windows memory APIs, and turn the raw structures into something useful on screen.

## What I built

The program attaches to `ac_client.exe` through MemProcFS and DMALibrary. Every frame it reads the local player, the player list and the game’s view matrix, rebuilds each player from a single read of its structure, projects them to screen space, and draws the result in a transparent Direct3D 9 overlay with ImGui.

- Reversed the player structure in IDA Pro: head and feet position, view angles, health, armor, frags, deaths, name and team.
- One DMA read per player: the whole structure is copied in one go and parsed locally.
- World-to-screen projection with the game’s own view matrix, for a box, a distance tag and a snapline per player.
- Enemy and visibility checks from the game’s own data: the team bit, and the frame each player was last visible in.
- A transparent, always-on-top overlay window that tracks the game window and handles Direct3D device resets.

## The player structure

The layout recovered in IDA Pro. Padding fills the gaps between the fields the overlay needs, so one read of `sizeof(PlayerStruct)` bytes gives a usable copy of a player.

```cpp
struct PlayerStruct
{
    uint32_t  VFTable;                                  // 0x000
    Vec3      PositionHead;                             // 0x004
    char      Pad0[0x028 - 0x004 - sizeof(Vec3)];
    Vec3      PositionFeet;                             // 0x028
    float     Yaw;                                      // 0x034
    float     Pitch;                                    // 0x038
    char      Pad1[0xE4 - 0x038 - sizeof(float)];
    int       LastVisibleFrame;                         // 0x0E4
    char      Pad2[0xEC - 0x0E4 - sizeof(int)];
    int       Health;                                   // 0x0EC
    int       Armor;                                    // 0x0F0
    char      Pad3[0x1DC - 0x0F0 - sizeof(int)];
    int       Frags;                                    // 0x1DC
    char      Pad4[0x1E4 - 0x1DC - sizeof(int)];
    int       Deaths;                                   // 0x1E4
    char      Pad5[0x205 - 0x1E4 - sizeof(int)];
    char      Name[16];                                 // 0x205
    char      Pad6[0x30C - 0x205 - sizeof(char[16])];
    int       Team;                                     // 0x30C
};
```

## Reading the player list

The player list is an array of 32-bit pointers at a static offset. Each frame starts from the view matrix and the list, then walks it (trimmed from `Cheat.cpp`):

```cpp
float ViewMatrix[16];
if (!TargetProcess.Read(ViewMatrixOffset, ViewMatrix, sizeof(ViewMatrix)))
    return {};

int       PlayersCount  = TargetProcess.Read<int>(PlayersCountOffset);
uintptr_t PlayerListPtr = TargetProcess.Read<uint32_t>(PlayersListOffset);
int       CurrentFrame  = TargetProcess.Read<int>(CurrentFrameOffset);

for (int i = 0; i < MAX_PLAYERS; ++i)
{
    uintptr_t PlayerPtr = TargetProcess.Read<uint32_t>(PlayerListPtr + i * sizeof(uint32_t));
    if (!PlayerPtr)
        continue;

    Player Player(PlayerPtr);              // one read of the whole PlayerStruct
    if (!Player.IsValid() || !Player.IsAlive())
        continue;

    if (!WorldToScreen(Player.GetHeadPos(), Player.ScreenHead, ViewMatrix, ScreenWidth, ScreenHeight))
        continue;
    if (!WorldToScreen(Player.GetFeetPos(), Player.ScreenFeet, ViewMatrix, ScreenWidth, ScreenHeight))
        continue;

    Player.IsEnemyFlag   = Player.IsEnemy(LocalPlayer);           // team bit differs
    Player.IsVisibleFlag = Player.IsVisible(CurrentFrame);        // LastVisibleFrame >= CurrentFrame
    Player.Distance      = Player.GetDistanceTo(LocalPlayer);
    // …
}
```
