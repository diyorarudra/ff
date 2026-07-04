import os
import re

for root, dirs, files in os.walk('games'):
    for file in files:
        if file == 'index.html':
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            pattern = r'</div>\s*</div>\s*<div class="adsense-seo-block"'
            
            if re.search(pattern, content):
                # Replace with just one </div>
                new_content = re.sub(pattern, '    </div>\n  \n<div class="adsense-seo-block"', content, count=1)
                
                with open(filepath, 'w', encoding='utf-8', newline='') as f:
                    f.write(new_content)
                print(f"Fixed {filepath}")
