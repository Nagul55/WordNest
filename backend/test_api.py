import urllib.request
import json

req = urllib.request.Request("http://localhost:8000/api/ai/example", method="POST", data=json.dumps({"word": "rag"}).encode('utf-8'), headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as res:
    print(res.status)
    print(res.read().decode('utf-8'))
