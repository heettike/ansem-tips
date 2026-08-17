import Image from "next/image";
import Link from "next/link";
import { TipSpreadStory } from "@/components/TipSpreadStory";
import { LandingStats } from "@/components/LandingStats";
import { LandingWins } from "@/components/LandingWins";
import { ShaderCanvas } from "@/components/ShaderCanvas";
import { CommunityWall } from "@/components/CommunityWall";
import { LandingManifesto } from "@/components/LandingManifesto";

export function LandingHero() {
  return (
    <div className="poster-grid">
      {/* hero poster — brand lockup, hero text, aura visual */}
      <section className="poster-card poster-span-2">
        <div className="flex items-center justify-between gap-4">
          <p className="brand-text">
            ansem<span className="mark">.tips</span>
          </p>
          <span className="pill">the black bull</span>
        </div>

        <h1 className="display mt-10 max-w-[85%] text-[clamp(2.5rem,5.5vw,3.5rem)]">
          tip any <span className="gold">token</span> when you like, comment,
          follow or more
        </h1>

        <div className="shader-frame mt-10 h-64 sm:h-80">
          <ShaderCanvas variant="aura" className="absolute inset-0" />
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <p className="caption">
            any coin, any chain — starting with $ansem on solana.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/onboard" className="btn-primary">
              start tipping
            </Link>
            <Link href="/withdraw" className="btn-ghost">
              got tipped?
            </Link>
          </div>
        </div>
      </section>

      {/* one large bull image — full-bleed inside the radius */}
      <section className="poster-card poster-flush poster-span-2">
        <div className="relative h-[90vh] min-h-[560px] w-full">
          <Image
            src="/brand/1_photo.jpg"
            alt="black bull"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
      </section>

      {/* one idea object — network effects */}
      <TipSpreadStory />

      {/* core numbers + allowlisted creators */}
      <LandingStats />

      {/* farcaster record + claim facts */}
      <LandingWins />

      {/* real tweets from the community */}
      <CommunityWall />

      {/* the dream — quiet manifesto before the footer */}
      <LandingManifesto />
    </div>
  );
}
