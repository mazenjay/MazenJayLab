export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-panel rounded-2xl px-8 py-6 text-center">
        <p className="text-sm font-mono text-gray-400 mb-2">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-gray-500">The requested resource does not exist.</p>
      </div>
    </main>
  );
}
