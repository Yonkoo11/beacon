#!/usr/bin/env zsh
setopt +o nomatch
set -e

SCRIPT_DIR="${0:A:h}"
AUDIO_DIR="$SCRIPT_DIR/audio"
mkdir -p "$AUDIO_DIR"
rm -f "$AUDIO_DIR"/*.mp3

VOICE_ID="nPczCjzI2devNBz1zQrb"  # Brian
MODEL="eleven_multilingual_v2"

if [[ -z "$ELEVENLABS_API_KEY" ]]; then
  echo "ERROR: ELEVENLABS_API_KEY not set"
  exit 1
fi

declare -A CLIPS
CLIPS[01-dashboard]="This is Beacon. It probes eight x-four-oh-two endpoints on Stellar every five minutes and scores them on uptime and latency. The sparkline bars show each probe result. Green is healthy. Red is a failure."
CLIPS[02-feed]="The probe feed streams in every five minutes. Each line is a real HTTP request. You can see latency variation across endpoints. When something fails, it shows timeout or error instead of a fake latency number."
CLIPS[03-scores]="Trust scores combine uptime and latency over twenty-four hours. Seventy percent weight on uptime. Thirty percent on p95 latency. A 402 response counts as healthy since that's the x-four-oh-two paywall working."
CLIPS[04-payment]="The scores themselves are behind an x-four-oh-two paywall. An agent pays one tenth of a cent in USDC on Stellar. It gets the full trust score JSON back. That transaction settles on Stellar testnet."
CLIPS[05-explorer]="And here's the proof on chain. Account creation. USDC trustline. A DEX swap for testnet USDC. And the x-four-oh-two payment invocation. All real transactions on Stellar."
CLIPS[06-close]="Beacon gives agents the trust data they need before spending money. That's it."

for clip in 01-dashboard 02-feed 03-scores 04-payment 05-explorer 06-close; do
  OUT="$AUDIO_DIR/$clip.mp3"
  echo "Generating $clip..."
  TEXT="${CLIPS[$clip]}"

  curl -s "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"$TEXT\",
      \"model_id\": \"$MODEL\",
      \"voice_settings\": {
        \"stability\": 0.82,
        \"similarity_boost\": 0.65,
        \"style\": 0.03
      }
    }" \
    -o "$OUT"

  if file "$OUT" | grep -q "JSON\|text\|ASCII"; then
    echo "ERROR: $clip returned error:"
    cat "$OUT"
    rm "$OUT"
    exit 1
  fi

  SIZE=$(wc -c < "$OUT")
  echo "OK $clip ($SIZE bytes)"
done

echo "All audio clips generated"
