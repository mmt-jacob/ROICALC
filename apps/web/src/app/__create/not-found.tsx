import { useNavigate } from 'react-router';

export default function CreateDefaultNotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center gap-4">
      <h1 className="text-4xl font-medium text-gray-900">Page not found</h1>
      <p className="text-gray-500">The page you're looking for doesn't exist.</p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Go Home
      </button>
    </div>
  );
}
