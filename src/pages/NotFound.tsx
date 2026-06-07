import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
      <p className="text-sm text-gray-500 mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
