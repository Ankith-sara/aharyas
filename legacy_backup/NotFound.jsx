import { Link, useNavigate } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import usePageMeta from '../components/usePageMeta';

const NotFound = () => {
  const navigate = useNavigate();
  usePageMeta({
    title: '404 — Page Not Found', description: 'This page does not exist. Head back to Aharyas and keep exploring.'
  });

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center mt-16">
      <div className="max-w-md w-full">
        <p className="text-[8rem] sm:text-[10rem] font-bold text-gray-100 leading-none select-none">
          404
        </p>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-wide uppercase">
            Page Not Found
          </h1>
          <p className="text-gray-500 font-light leading-relaxed text-sm sm:text-base">
            The page you're looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium uppercase tracking-wider hover:bg-gray-800 transition-all duration-300"
          >
            <Home size={16} />
            Go Home
          </Link>
          <Link
            to="/shop/collection"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-black text-sm font-medium uppercase tracking-wider hover:border-black hover:bg-gray-50 transition-all duration-300"
          >
            <Search size={16} />
            Browse Shop
          </Link>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-black transition-colors mx-auto"
        >
          Go back
        </button>
      </div>
    </div>
  );
};

export default NotFound;