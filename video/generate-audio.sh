#!/usr/bin/env zsh
setopt +o nomatch
set -e

SCRIPT_DIR="${0:A:h}"
AUDIO_DIR="$SCRIPT_DIR/audio"
mkdir -p "$AUDIO_DIR"

VOICE_ID="nPczCjzI2devNBz1zQrb"  # Brian
MODEL="eleven_multilingual_v2"

if [[ -z "$ELEVENLABS_API_KEY" ]]; then
  echo "ERROR: ELEVENLABS_API_KEY not set"
  exit 1
fi

declare -A CLIPS
CLIPS[01-dashboard]="Eight endpoints. Probed every five minutes. Scored on uptime and latency. This is Beacon's live trust dashboard for x-four-oh-two on Stellar."
CLIPS[02-cards]="Each endpoint gets a trust score from zero to one hundred. The bars are real probe results. Green is a successful response. Red is a failure or timeout. The score combines uptime and latency over twenty-four hours."
CLIPS[03-compact]="Endpoints that aren't responding drop to zero and fade out. The probe log below shows every request with its actual latency. No fake data. Every number is a real HTTP call."
CLIPS[04-payment]="The scores are behind an x-four-oh-two paywall. An agent pays one tenth of a cent in USDC on Stellar. It gets the trust score JSON back. That transaction settles on Stellar testnet."
CLIPS[05-explorer]="Here's the proof on chain. Account creation. USDC trustline. A DEX swap for testnet USDC. And the x-four-oh-two payment. All real transactions on Stellar."
CLIPS[06-close]="Beacon gives agents trust data before they spend money. Try it live."

for clip in 01-dashboard 02-cards 03-compact 04-payment 05-explorer 06-close; do
  OUT="$AUDIO_DIR/$clip.mp3"

  # Skip if already exists and is valid audio
  if [[ -f "$OUT" ]] && file "$OUT" | grep -q "Audio\|MPEG\|MP3\|layer"; then
    echo "SKIP $clip (exists)"
    continue
  fi

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
