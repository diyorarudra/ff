import os
import re

for root, dirs, files in os.walk('games'):
    for file in files:
        if file == 'index.html':
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # The pattern is usually closing game-container, then adsense-seo-block, then closing adsense-seo-block, then another closing div!
            # Let's see what follows adsense-seo-block.
            match = re.search(r'</div>\s*</div>\s*(<div class="adsense-seo-block"[\s\S]*?</div>)\s*</div>', content)
            if match:
                # We want to change:
                # </div>
                # </div>
                # <div class="adsense-seo-block">...</div>
                # </div>
                #
                # To:
                # </div>
                # <div class="adsense-seo-block">...</div>
                # </div>
                
                # Wait, if we just swap the extra `</div>` from BEFORE the adsense-seo-block to AFTER it, 
                # but wait, there is ALREADY an extra </div> after it in game50!
                # Let's print out the match to see exactly what we're replacing.
                print(f"\n--- MATCH IN {filepath} ---")
                print(match.group(0))
