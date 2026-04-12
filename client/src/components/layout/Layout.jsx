import Navbar from './Navbar';

const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
    <footer className="border-t border-slate-200 bg-white py-6 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} Solidarity. Building stronger communities together.
        </p>
        <div className="flex items-center gap-1 text-slate-400">
          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium">Made with care for your community</span>
        </div>
      </div>
    </footer>
  </div>
);

export default Layout;
