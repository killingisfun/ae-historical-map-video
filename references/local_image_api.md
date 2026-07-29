# Local Image API For Historical Assets

Use the user's local Gemini tunnel for generated portrait/card assets when the user asks for commanders, historical people, or consistent documentary portraits.

## Connection

After reboot, the user may need to start:

```powershell
L:\gemini\tools\start_gemini_all_tunnels.ps1
```

Prefer port `18083`; use `18084` and `18085` for parallel image jobs.

Read credentials:

```powershell
$cfg = Get-Content 'L:\gemini\output\gemini_chat_api_private.server.json' -Raw | ConvertFrom-Json
$api = $cfg.api_key
$secret = $cfg.secret_path
$base = "http://127.0.0.1:18083/$secret"
$headers = @{ "X-API-Key" = $api }
Invoke-RestMethod -Method Get -Uri "$base/health" -Headers $headers
```

## Portrait Prompt Pattern

Generate portraits in one visual system:

```text
Consistent documentary portrait medallion asset of [PERSON], 19th century military leader, bust portrait, historically inspired uniform, neutral expression, clean pure white background, soft studio light, detailed face, no text, no watermark, centered subject, same visual style as a premium history documentary graphic, realistic painted photograph hybrid
```

For Ottoman subjects, explicitly mention Ottoman uniform and fez when appropriate.

## Processing

After downloading portrait PNGs, run:

```powershell
python D:\history_video\codex-skills\ae-historical-map-video\scripts\make_portrait_medallions.py
```

The output medallions are used by AE from:

```text
assets/portraits/medallions/
```

## Rules

- Treat generated likenesses as historically inspired graphics, not verified photographic portraits.
- Use one background style for the whole set, usually pure white, then normalize with the medallion script.
- Do not put text into generated images; add all names and roles in AE.
- Keep portrait cards tied to the map action or to UI side panels, never floating randomly.
