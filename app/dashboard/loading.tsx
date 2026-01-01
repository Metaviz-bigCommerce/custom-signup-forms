import NavBar from '@/components/NavBar';
import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-5 sm:space-y-6 md:space-y-8">
        {/* Hero Section Skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg sm:rounded-xl md:rounded-2xl p-3.5 sm:p-4 md:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Skeleton className="h-6 sm:h-7 w-40 sm:w-48 rounded-full bg-white/10" />
              </div>
              <Skeleton className="h-5 sm:h-6 md:h-7 lg:h-9 w-48 sm:w-64 md:w-80 mb-2 sm:mb-3 bg-white/20 rounded" />
              <Skeleton className="h-3 sm:h-4 md:h-5 w-full max-w-xl bg-white/10 rounded" />
            </div>
            <Skeleton className="h-10 sm:h-11 md:h-12 lg:h-14 w-full lg:w-44 rounded-lg sm:rounded-xl bg-white/20" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-100 p-3.5 sm:p-4 md:p-5 lg:p-6 shadow-sm">
              <div className="flex items-start justify-between mb-2.5 sm:mb-3 md:mb-4">
                <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl" />
                {i === 0 && (
                  <Skeleton className="h-5 sm:h-6 w-12 sm:w-14 rounded-full" />
                )}
              </div>
              <Skeleton className="h-6 sm:h-7 md:h-8 lg:h-9 w-12 sm:w-16 md:w-20 mb-1.5 sm:mb-2 rounded" />
              <Skeleton className="h-3 sm:h-3.5 md:h-4 w-20 sm:w-24 md:w-28 rounded" />
              {i === 1 && (
                <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 mt-1 rounded" />
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions Section Skeleton */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 sm:h-6 md:h-7 w-32 sm:w-40 md:w-48 mb-1 rounded" />
              <Skeleton className="h-3 sm:h-3.5 md:h-4 w-48 sm:w-56 md:w-64 rounded" />
            </div>
            <Skeleton className="h-3 sm:h-4 w-32 sm:w-40 md:w-48 rounded" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-100 p-3.5 sm:p-4 md:p-5 lg:p-6">
                <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl mb-2.5 sm:mb-3 md:mb-4" />
                <Skeleton className="h-3.5 sm:h-4 md:h-5 w-24 sm:w-28 md:w-32 mb-1.5 sm:mb-2 rounded" />
                <Skeleton className="h-2.5 sm:h-3 md:h-3.5 w-full max-w-[90%] rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Requests Table Skeleton */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Header Skeleton */}
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 lg:py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl shrink-0" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 sm:h-5 md:h-6 w-36 sm:w-44 md:w-52 mb-1 rounded" />
                  <Skeleton className="h-3 sm:h-3.5 w-48 sm:w-56 md:w-64 rounded" />
                </div>
              </div>
              <Skeleton className="h-8 sm:h-9 md:h-10 w-full sm:w-auto sm:px-6 rounded-lg sm:rounded-xl" />
            </div>
          </div>

          {/* Mobile View Skeleton */}
          <div className="md:hidden p-2.5 sm:p-3 space-y-2.5 sm:space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200/60 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                  <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-[14px] sm:h-4 w-28 sm:w-32 mb-1 sm:mb-1.5 rounded" />
                    <Skeleton className="h-3 w-36 sm:w-40 mb-1.5 sm:mb-2 rounded" />
                    <Skeleton className="h-[22px] sm:h-6 w-16 sm:w-20 rounded-md sm:rounded-lg" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100">
                  <Skeleton className="h-3 w-20 sm:w-24 rounded" />
                  <Skeleton className="h-7 sm:h-8 w-16 sm:w-20 rounded-md sm:rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Skeleton */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                  {[...Array(5)].map((_, i) => (
                    <th key={i} className="px-4 lg:px-6 py-3 lg:py-4">
                      <Skeleton className="h-3 sm:h-3.5 w-16 sm:w-20 lg:w-24 rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <Skeleton className="w-10 h-10 lg:w-11 lg:h-11 rounded-full shrink-0" />
                        <Skeleton className="h-4 lg:h-5 w-28 lg:w-32 rounded" />
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <Skeleton className="h-3.5 lg:h-4 w-36 lg:w-40 rounded" />
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-1.5 lg:gap-2">
                        <Skeleton className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded shrink-0" />
                        <Skeleton className="h-3.5 lg:h-4 w-20 lg:w-24 rounded" />
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <Skeleton className="h-6 lg:h-7 w-18 lg:w-20 rounded-lg" />
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                      <Skeleton className="h-9 lg:h-10 w-20 lg:w-24 rounded-lg lg:rounded-xl ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

