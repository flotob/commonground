#!/bin/bash

# Test bot sendMessage endpoint

#BOT_TOKEN="VoUV6Avlwy40iksju9sQ6Ou0YGL-4EHIOvL9dKGYKzQ"
#BOT_TOKEN="XMuKDB6lqW_6AC7TcIc-VDVMPcn0NeL5wGOp3ywjBmM"
BOT_TOKEN="GroWpPrcpvmvzX-sPKw2ofKx3f327cq9CgRAsPukeNw"
COMMUNITY_ID="eacf3eb2-4465-4088-b952-62f6ed6929d7"
CHANNEL_ID="ce66f0e1-725e-45d0-948f-913bbefb1fd5"

echo "Testing bot sendMessage..."
echo ""

curl -s -w "\n\nHTTP Status: %{http_code}\n" \
  -X POST http://localhost:8000/api/v2/Bot/sendMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bot $BOT_TOKEN" \
  -d '{
    "communityId": "'"$COMMUNITY_ID"'",
    "channelId": "'"$CHANNEL_ID"'",
    "body": {
      "version": "1",
      "content": [
        { "type": "text", "value": "Hello! This is the first message from a Common Ground bot! 🤖" }
      ]
    }
  }'

echo ""
echo "Done!"

