import NavBar from '@/components/NavBar';
import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6 h-full">
          <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg border-2 border-gray-100">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="grid grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>

          <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="mb-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>

          <div className="col-span-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <Skeleton className="h-6 w-32 mb-6" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

