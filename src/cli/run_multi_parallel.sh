TINYFISH_API_KEY="sk-tinyfish-KDtSBpqgmvsPTI529dFbgd4UzVO1ZvMS"

for url in "https://site1.com" "https://site2.com"; do
  curl -X POST \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $TINYFISH_API_KEY" \
    -d "{
      \"url\": \"$url\",
      \"goal\": \"Extract products under \$100\",
      \"browser_profile\": \"stealth\",
      \"proxy_config\": {\"enabled\": true, \"country_code\": \"US\"}
    }" \
    https://agent.tinyfish.ai/v1/automation/run-sse &
done

wait
