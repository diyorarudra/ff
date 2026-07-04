import os
import re

for root, dirs, files in os.walk('games'):
    for file in files:
        if file == 'index.html':
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find the index of <div class="game-container
            start_idx = content.find('<div class="game-container')
            if start_idx == -1:
                continue
                
            # Find the index of <div class="adsense-seo-block"
            seo_idx = content.find('<div class="adsense-seo-block"')
            if seo_idx == -1:
                continue
                
            # Slice the content between game-container and adsense-seo-block
            between = content[start_idx:seo_idx]
            
            # Count open divs and close divs
            # This is a naive count:
            open_divs = len(re.findall(r'<div\b[^>]*>', between))
            close_divs = len(re.findall(r'</div>', between))
            
            # Since game-container itself is one open div, if open_divs - close_divs == 0,
            # it means game-container was closed BEFORE adsense-seo-block!
            depth = open_divs - close_divs
            
            if depth == 0:
                print(f"{filepath} is BROKEN (depth=0 before seo block)")
            elif depth < 0:
                print(f"{filepath} is BROKEN (depth={depth})")
