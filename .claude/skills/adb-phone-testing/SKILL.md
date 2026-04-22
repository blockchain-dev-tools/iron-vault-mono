---
name: adb-phone-testing
description: Use when testing Iron Vault on Android device via ADB — taking screenshots, tapping UI elements, inputting text, swiping, or inspecting screen state. Use when user asks to "check the phone", "screenshot", "tap", "interact with the device", or verify UI behavior.
---

# ADB Phone Testing

## Overview

Control and inspect the Iron Vault test device via ADB. Always specify the device serial to avoid ambiguity when multiple devices are connected.

## Known Devices

| Serial | Type |
|--------|------|
| `bcb0051` | Physical device (USB) — default |
| `192.168.1.236:5555` | Wireless |

**Default:** Use `bcb0051` unless told otherwise.

## Screenshot

```bash
# Take screenshot and save to project tmp/
adb -s bcb0051 exec-out screencap -p > /home/robot/workspace/iron-vault-mono/tmp/screen.png
```

Then use the `Read` tool on the file to view it:
```
Read: /home/robot/workspace/iron-vault-mono/tmp/screen.png
```

## Tap

```bash
adb -s bcb0051 shell input tap X Y
```

To find coordinates: take a screenshot first and estimate from the image, or use UI dump (see below).

## Swipe

```bash
# swipe from (x1,y1) to (x2,y2) over duration ms
adb -s bcb0051 shell input swipe X1 Y1 X2 Y2 300
```

## Text Input

```bash
adb -s bcb0051 shell input text "hello"
# Note: spaces must be escaped as %s
adb -s bcb0051 shell input text "hello%sworld"
```

## Key Events

```bash
adb -s bcb0051 shell input keyevent KEYCODE_BACK      # Back
adb -s bcb0051 shell input keyevent KEYCODE_HOME      # Home
adb -s bcb0051 shell input keyevent KEYCODE_ENTER     # Enter
adb -s bcb0051 shell input keyevent KEYCODE_DEL       # Backspace
```

## UI Hierarchy Dump (find element positions)

```bash
adb -s bcb0051 shell uiautomator dump /sdcard/ui.xml
adb -s bcb0051 pull /sdcard/ui.xml /tmp/ui.xml
```

Then `Read /tmp/ui.xml` — look for `bounds="[x1,y1][x2,y2]"` to get tap coordinates (use center point).

## Typical Workflow

1. **Screenshot** → view current state
2. **Identify target** → estimate coordinates from image or dump UI XML
3. **Interact** → tap / swipe / input
4. **Screenshot again** → verify result

## Common PIN Entry (Iron Vault)

Screen resolution is ~720×1560. Approximate keypad positions:

| Key | X | Y |
|-----|---|---|
| 1 | 190 | 895 |
| 2 | 354 | 895 |
| 3 | 518 | 895 |
| 4 | 190 | 1000 |
| 5 | 354 | 1000 |
| 6 | 518 | 1000 |
| 7 | 190 | 1105 |
| 8 | 354 | 1105 |
| 9 | 518 | 1105 |
| 0 | 354 | 1210 |
| ⌫ | 518 | 1210 |
