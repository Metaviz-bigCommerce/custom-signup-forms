import NavBar from '@/components/NavBar';
import RequestsManager from '@/components/requests/RequestsManager';

export default function RequestsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <RequestsManager />
      </main>
    </div>
  );
}

