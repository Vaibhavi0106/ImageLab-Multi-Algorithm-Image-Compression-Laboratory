import urllib.request
import io
import json
from PIL import Image

# 1. Create a test image
img = Image.new('RGB', (128, 128), color=(220, 110, 50))
buf = io.BytesIO()
img.save(buf, format='PNG')
img_bytes = buf.getvalue()

# 2. Prepare multipart request
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = bytearray()
body.extend(f'--{boundary}\r\n'.encode('utf-8'))
body.extend(b'Content-Disposition: form-data; name="file"; filename="test.png"\r\n')
body.extend(b'Content-Type: image/png\r\n\r\n')
body.extend(img_bytes)
body.extend(b'\r\n')

body.extend(f'--{boundary}\r\n'.encode('utf-8'))
body.extend(b'Content-Disposition: form-data; name="algorithm_id"\r\n\r\n')
body.extend(b'dct_custom\r\n')

body.extend(f'--{boundary}\r\n'.encode('utf-8'))
body.extend(b'Content-Disposition: form-data; name="params"\r\n\r\n')
body.extend(b'{"quality": 65, "subsampling": "4:2:0"}\r\n')

body.extend(f'--{boundary}--\r\n'.encode('utf-8'))
payload = bytes(body)

req = urllib.request.Request(
    'http://localhost:5173/api/compress',
    data=payload,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

res = urllib.request.urlopen(req)
result = json.loads(res.read())
print('Compression API Success!')
print('Experiment ID:', result['experiment_id'])
print('Algorithm:', result['algorithm_name'])
print('Original bytes:', result['metrics']['original_size_bytes'])
print('Compressed bytes:', result['metrics']['compressed_size_bytes'])
print('Compression Ratio:', result['metrics']['compression_ratio'])
print('PSNR:', result['metrics']['psnr_display'])
print('SSIM:', result['metrics']['ssim'])

# Test artifact download endpoint through proxy
exp_id = result['experiment_id']
dl_res = urllib.request.urlopen(f'http://localhost:5173/api/experiments/{exp_id}/download')
dl_bytes = dl_res.read()
print('Downloaded artifact size:', len(dl_bytes), 'Magic:', dl_bytes[:7])

# Test CSV export endpoint through proxy
csv_res = urllib.request.urlopen('http://localhost:5173/api/experiments/export/csv')
csv_text = csv_res.read().decode('utf-8')
print('CSV export snippet:\n' + csv_text[:200])
