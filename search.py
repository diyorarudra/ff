import os
import re

count = 0
for root, dirs, files in os.walk('games'):
    for file in files:
        if file == 'index.html':
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if re.search(r'</div>\s*</div>\s*<div class="adsense-seo-block"', content):
                print(f"Match found in {filepath}")
                count += 1
print(f"Total matches: {count}")
