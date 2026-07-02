import os
import re
import subprocess

def run_cmd(cmd):
    subprocess.run(cmd, shell=True, check=True)

# 1. Checkout all html files from the good commit 1390e0a
print("Checking out pristine HTML files...")
run_cmd("git checkout 1390e0a -- \"**/*.html\"")
run_cmd("git checkout 1390e0a -- \"*.html\"")

print("Applying fixes...")

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix 1: HTML5 game -> free browser game
    # We replace '(?i)html5 games?' with 'free browser games' if it ends in 's', else 'free browser game'
    def repl(m):
        match_str = m.group()
        if match_str.lower().endswith('s'):
            return 'free browser games'
        else:
            return 'free browser game'
    content = re.sub(r'(?i)html5 games?', repl, content)

    # Fix 2: Vercel analytics
    if '<script defer src="/_vercel/insights/script.js"></script>' in content:
        content = content.replace(
            '<script defer src="/_vercel/insights/script.js"></script>',
            '<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>\n  <script defer src="/_vercel/insights/script.js"></script>'
        )

    # Fix 3: Hamburger menu on game pages
    if filepath.replace('\\', '/').startswith('games/') and 'index.html' in filepath:
        if 'hamburgerBtn' not in content:
            script = """
<script>
  const hamburgerBtn = document.getElementById('hamburger');
  const mobileMenuDiv = document.getElementById('mobile-menu');
  if (hamburgerBtn && mobileMenuDiv) {
    hamburgerBtn.addEventListener('click', () => {
      mobileMenuDiv.classList.toggle('open');
      hamburgerBtn.classList.toggle('active');
    });
  }
</script>
</html>"""
            content = re.sub(r'(?i)</html>\s*$', script, content)

    # Fix 4: Email replacement
    content = content.replace('ffliveplay1@gmail.com', 'ffliveplay@gmail.com')

    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        f.write(content)

for root, _, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))

print("Done!")
