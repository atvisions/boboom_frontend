import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/10 via-emerald-500/10 to-transparent p-8 md:p-12">
      <div className="absolute -top-24 -right-24 w-[480px] h-[480px] bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-[480px] h-[480px] bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="relative z-10 grid gap-6 md:grid-cols-2 items-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">BoBoom Launchpad</h1>
          <p className="text-gray-300 text-lg md:text-xl">Create, trade, and graduate the next generation of meme coins on a sleek, modern platform.</p>
          <div className="flex gap-3 pt-2">
            <Link href="#trending" className="px-5 py-3 rounded-lg bg-white text-black font-semibold hover:bg-white/90 transition">Explore Trending</Link>
            <Link href="/create" className="px-5 py-3 rounded-lg border border-white/30 font-semibold hover:bg-white/10 transition">Create Token</Link>
          </div>
        </div>
        <div className="hidden md:block justify-self-end">
          <Image src="/Furore.png" alt="globe" width={280} height={280} className="opacity-80" priority />
        </div>
      </div>
    </section>
  );
}


