import Image from "next/image";
import Link from "next/link";
import { TipSpreadStory } from "@/components/TipSpreadStory";

export function LandingHero() {
  return (
    <div>
      {/* one type lockup */}
      <section className="px-6 pb-8 pt-20 sm:pt-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-muted">the black bull</p>

          <h1 className="display mt-6 text-[clamp(4.5rem,18vw,11rem)]">
            ansem
            <span className="mark">.tips</span>
          </h1>

          <p className="mt-8 max-w-xl text-2xl font-bold tracking-tight text-muted sm:text-3xl">
            tip <span className="gold">$ansem</span>. grow the herd.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-8 text-lg font-bold">
            <Link
              href="/onboard"
              className="text-white underline decoration-white underline-offset-8 hover:text-accent hover:decoration-accent"
            >
              start tipping
            </Link>
            <Link
              href="/withdraw"
              className="text-muted underline decoration-[#333] underline-offset-8 hover:text-white hover:decoration-white"
            >
              got tipped?
            </Link>
          </div>
        </div>
      </section>

      {/* one large bull image */}
      <section className="relative mt-4 h-[90vh] min-h-[560px] w-full overflow-hidden sm:h-screen">
        <Image
          src="/brand/1_photo.jpg"
          alt="black bull"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </section>

      {/* one idea object — network effects */}
      <TipSpreadStory />
    </div>
  );
}
