const MANIFESTO =
  "we dream to make every interaction, transfer real monetary value. we dream to make money move with each interaction on the internet. we dream to create one man network states. we dream to create a tool-kit for creator's to monetise their audience. we dream to tokenise content of all kinds. we dream to do all of this, without you having to move away from your timeline. we dream to 10x the utility to creator coins.";

export function LandingManifesto() {
  return (
    <section className="poster-card poster-span-2">
      <div className="flex items-center justify-between gap-4">
        <p className="brand-text">
          ansem<span className="mark">.tips</span>
        </p>
        <span className="pill">the dream</span>
      </div>

      <p className="manifesto-text mt-12">{MANIFESTO}</p>

      <p className="manifesto-signoff mt-12">belief, should be liquid.</p>
    </section>
  );
}
