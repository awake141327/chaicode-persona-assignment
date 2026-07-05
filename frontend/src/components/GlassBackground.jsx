// Full-screen animated gradient backdrop that the glass panels blur over.
// Sits behind everything; colors flip with the theme.
function GlassBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden bg-linear-to-br from-violet-100 via-white to-fuchsia-100 transition-colors duration-500 dark:from-[#0d0618] dark:via-[#140b26] dark:to-[#1e0f38]"
    >
      <div className="animate-blob motion-reduce:animate-none absolute -top-40 -left-40 size-104 rounded-full bg-purple-400/40 blur-3xl sm:size-136 dark:bg-purple-600/30" />
      <div className="animate-blob-slow motion-reduce:animate-none absolute top-1/3 -right-48 size-112 rounded-full bg-cyan-300/40 blur-3xl sm:size-144 dark:bg-cyan-500/20" />
      <div className="animate-blob motion-reduce:animate-none absolute -bottom-48 left-1/4 size-120 rounded-full bg-fuchsia-300/40 blur-3xl [animation-delay:-10s] sm:size-152 dark:bg-fuchsia-600/25" />
    </div>
  )
}

export default GlassBackground
