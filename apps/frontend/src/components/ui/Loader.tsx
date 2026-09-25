export function SkeletonLoader() {
  return (
    <div className="w-full">
      {/* Mobile Container wrapper */}
      <div className="w-full w-full min-h-screen bg-emerald-50/50 flex flex-col overflow-hidden">
        <div className="w-full bg-emerald-50/20 flex-1 flex flex-col animate-pulse">
          {/* Header Skeleton */}
          <div className="bg-emerald-900/80 p-4 pt-5 pb-4 space-y-2">
            <div className="h-6 w-36 bg-emerald-700/60 rounded-md" />
            <div className="h-3 w-48 bg-emerald-800/60 rounded-md" />
          </div>

          {/* Content Body Skeleton */}
          <div className="p-4 flex-1 flex flex-col space-y-4">
            {/* Card Skeleton */}
            <div className="bg-white rounded-lg border border-gray-200/80 p-4 shadow-sm space-y-4">
              {/* Field 1 Skeleton */}
              <div className="space-y-1.5">
                <div className="h-3 w-12 bg-gray-200 rounded" />
                <div className="h-9 w-full bg-gray-100 rounded-md" />
              </div>

              {/* Field 2 Skeleton */}
              <div className="space-y-1.5">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-9 w-full bg-gray-100 rounded-md" />
              </div>

              {/* Button Skeleton */}
              <div className="h-10 w-full bg-gray-200 rounded-md pt-2" />

              {/* Link Placeholder Skeleton */}
              <div className="h-3 w-32 bg-gray-100 rounded mx-auto mt-2" />
            </div>

            {/* Footer Text Skeleton */}
            <div className="space-y-1.5 px-0.5">
              <div className="h-3 w-full bg-gray-200/60 rounded" />
              <div className="h-3 w-3/4 bg-gray-200/60 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
