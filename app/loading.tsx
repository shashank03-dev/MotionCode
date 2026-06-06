export default function Loading() {
  return (
    <main
      aria-label="Loading MotionCode page"
      className="min-h-screen bg-[#10120d] px-4 py-16 text-[#fffbf4] sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="h-10 w-44 animate-pulse rounded-[8px] bg-white/10" />
        <div className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="h-4 w-52 animate-pulse rounded-[8px] bg-[#9ef0c0]/20" />
            <div className="mt-6 h-16 w-full max-w-2xl animate-pulse rounded-[8px] bg-white/10" />
            <div className="mt-4 h-16 w-3/4 animate-pulse rounded-[8px] bg-white/10" />
            <div className="mt-8 h-11 w-36 animate-pulse rounded-[8px] bg-[#9ef0c0]/30" />
          </div>
          <div className="h-96 animate-pulse rounded-[8px] border border-white/10 bg-white/10" />
        </div>
      </div>
    </main>
  );
}
