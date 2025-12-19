import NavBar from '@/components/NavBar';
import RequestsManager from '@/components/requests/RequestsManager';

export default function RequestsPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8 bg-gray-50">
        <RequestsManager />
      </main>
    </div>
  );
}

