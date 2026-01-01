import NavBar from '@/components/NavBar';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 bg-gray-50">
        {/* Empty - EmailTemplates component will show its own loading skeleton */}
      </main>
    </div>
  );
}

