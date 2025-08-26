export function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-black/40">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-300">
        <div>
          <h4 className="text-white font-semibold mb-3">BoBoom</h4>
          <p className="text-sm text-gray-400">Create, trade, and graduate the next generation of meme coins.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Hot</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/#trending" className="hover:text-white">Trending Tokens</a></li>
            <li><a href="/#curve" className="hover:text-white">On Curve</a></li>
            <li><a href="/#graduating" className="hover:text-white">Graduating</a></li>
            <li><a href="/#graduated" className="hover:text-white">Graduated</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="https://twitter.com" target="_blank" className="hover:text-white">Twitter</a></li>
            <li><a href="https://t.me" target="_blank" className="hover:text-white">Telegram</a></li>
            <li><a href="/api/tokens/config/" className="hover:text-white">API Status</a></li>
          </ul>
        </div>
      </div>
      <div className="py-4 text-center text-xs text-gray-500">© {new Date().getFullYear()} BoBoom. All rights reserved.</div>
    </footer>
  );
}


