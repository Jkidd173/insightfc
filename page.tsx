"use client";

export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-black text-white flex items-start justify-center p-10">
      <div className="w-full max-w-2xl space-y-6">
        <div className="rounded-2xl border border-white/20 p-6">
          <div className="text-3xl font-extrabold text-outline">
            Tailwind Test
          </div>
          <div className="mt-2 text-white/80">
            If this background is black and the buttons are yellow with a white border and outlined text, you’re good.
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 p-6 flex gap-4">
          <button className="btn-yellow">
            <span className="text-outline">Yellow Button</span>
          </button>

          <button className="btn-yellow">
            <span className="text-outline">White Outline Text</span>
          </button>
        </div>
      </div>
    </div>
  );
}