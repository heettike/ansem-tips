import Image from "next/image";
import Link from "next/link";
import { TipSpreadStory } from "@/components/TipSpreadStory";
import { LandingStats } from "@/components/LandingStats";
import { LandingWins } from "@/components/LandingWins";
import { CommunityWall } from "@/components/CommunityWall";
import { LandingManifesto } from "@/components/LandingManifesto";

export function LandingHero() {
  return (
    <div className="pb-24">
      {/* hero — pastel orbs drift behind the display copy */}
      <section className="orb-field">
        <div
          className="orb orb-peach"
          style={{ width: 520, height: 520, top: "-160px", right: "8%" }}
          aria-hidden="true"
        />
        <div
          className="orb orb-lavender"
          style={{ width: 460, height: 460, top: "30%", left: "-140px" }}
          aria-hidden="true"
        />
        <div
          className="orb orb-mint"
          style={{ width: 380, height: 380, bottom: "-120px", right: "28%" }}
          aria-hidden="true"
        />

        <div className="wrap relative">
          {/* masthead — landing keeps its own quiet chrome */}
          <div className="flex h-16 items-center justify-between gap-4">
            <p className="brand-text">
              ansem<span className="mark">.tips</span>
            </p>
            <span className="pill">the black bull</span>
          </div>

          <div className="pb-24 pt-16 sm:pt-24">
            <h1 className="display display-hero max-w-3xl">
              tip any <span className="mark">token</span> when you like —
              drop 🐂 to send more
            </h1>

            <p className="mt-6 max-w-md text-[15px]">
              any coin, any chain — starting with $ansem on solana.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/onboard" className="btn-primary">
                start tipping
              </Link>
              <Link href="/withdraw" className="btn-ghost">
                got tipped?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* editorial full-bleed image band — the bull, with a caption line */}
      <section className="image-band">
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
        <div className="wrap">
          <p className="image-caption">
            the black bull — ansem<span className="mark">.tips</span>
          </p>
        </div>
      </section>

      {/* one idea object — network effects */}
      <TipSpreadStory />

      {/* core numbers + allowlisted creators */}
      <LandingStats />

      {/* farcaster record + claim facts — the dark inversion */}
      <LandingWins />

      {/* real tweets from the community */}
      <CommunityWall />

      {/* the dream — quiet manifesto before the footer */}
      <LandingManifesto />
    </div>
  );
}
