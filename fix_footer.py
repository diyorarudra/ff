import os
import re

footer_html = """  <!-- ===== FOOTER ===== -->
  <footer class="site-footer py-12 px-4 md:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <!-- Brand -->
        <div class="md:col-span-2">
          <a href="/index.html" class="flex items-center gap-2 text-xl font-bold font-heading mb-4">
            <svg class="logo-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="12" rx="4"></rect><circle cx="17" cy="12" r="1"></circle><circle cx="14" cy="12" r="1"></circle><path d="M6 12h4m-2-2v4"></path></svg>
            <span class="gradient-text">ffliveplay</span>
          </a>
          <p class="text-gray-400 max-w-md leading-relaxed">Your premium destination for free, browser-based free browser games. We blend interactive digital art with web gaming to create experiences that are fast, beautiful, and accessible to everyone.</p>
        </div>
        <!-- Quick Links -->
        <div>
          <h4 class="font-heading font-bold text-white mb-4">Quick Links</h4>
          <ul class="space-y-2">
            <li><a href="/index.html#games" class="text-gray-400 hover:text-cyan-400 transition-colors">All Games</a></li>
            <li><a href="/blog/index.html" class="text-gray-400 hover:text-cyan-400 transition-colors">Blog</a></li>
            <li><a href="/compliance/about-us.html" class="text-gray-400 hover:text-cyan-400 transition-colors">About Us</a></li>
            <li><a href="/compliance/contact.html" class="text-gray-400 hover:text-cyan-400 transition-colors">Contact</a></li>
          </ul>
        </div>
        <!-- Legal -->
        <div>
          <h4 class="font-heading font-bold text-white mb-4">Legal</h4>
          <ul class="space-y-2">
            <li><a href="/compliance/privacy-policy.html" class="text-gray-400 hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
            <li><a href="/terms-of-service.html" class="text-gray-400 hover:text-cyan-400 transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-gray-500 text-sm">&copy; 2026 ffliveplay. All rights reserved.</p>
        
      </div>
    </div>
  </footer>"""

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = re.sub(r'<footer[^>]*bg-nexus-card[^>]*>.*?</footer>', footer_html, content, flags=re.DOTALL | re.IGNORECASE)
    
    if content != new_content:
        print(f"Updated footer in {filepath}")
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            f.write(new_content)

for root, _, files in os.walk('blog'):
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
