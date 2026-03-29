#!/bin/bash
TINYFISH_API_KEY="${TINYFISH_API_KEY:?"Need TINYFISH_API_KEY"}"

curl --request POST \
  --url https://agent.tinyfish.ai/v1/automation/run-sse \
  --header "Content-Type: application/json" \
  --header "X-API-Key: $TINYFISH_API_KEY" \
  --data '{
  "url": "https://example-protected-site.com",
  "goal": "Extract all pricing plans and return as JSON",
  "browser_profile": "stealth",
  "proxy_config": {
    "enabled": true,
    "country_code": "US"
  },
  "feature_flags": {
    "enable_agent_memory": true
  }
}'
