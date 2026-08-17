const MANIFESTO =
  "we dream to make every interaction, transfer real monetary value. we dream to make money move with each interaction on the internet. we dream to create one man network states. we dream to create a tool-kit for creator's to monetise their audience. we dream to tokenise content of all kinds. we dream to do all of this, without you having to move away from your timeline. we dream to 10x the utility to creator coins.";

export function LandingManifesto() {
  return (
    <section className="orb-field section-gap section-pad">
      <div
        className="orb orb-rose"
        style={{ width: 420, height: 420, top: "-10%", right: "6%" }}
        aria-hidden="true"
      />
      <div
        className="orb orb-sky"
        style={{ width: 360, height: 360, bottom: "-15%", left: "-6%" }}
        aria-hidden="true"
      />

      <div className="wrap relative">
        <p className="micro-label">the dream</p>

        <p className="manifesto-text mt-12">{MANIFESTO}</p>

        <p className="display display-lg manifesto-signoff mt-16">
          belief, should be liquid.
        </p>
      </div>
    </section>
  );
}
