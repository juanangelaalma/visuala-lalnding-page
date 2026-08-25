import { Button } from "@visuala/ui";
import { useState } from "react";
import { creators, durations, input, panel } from "./create-video-constants";
import { Field, FooterActions, Header, Icon } from "./CreateVideoPrimitives";

export function TalentSetup({
  creator,
  setCreator,
  duration,
  setDuration,
  quality,
  setQuality,
  onBack,
  onGenerate,
}: {
  creator: string;
  setCreator: (id: string) => void;
  duration: number;
  setDuration: (seconds: number) => void;
  quality: string;
  setQuality: (quality: string) => void;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  return (
    <>
      <Header
        eyebrow="Step 2 · Creator & format"
        title="Choose the right on-camera energy"
        copy="Select a creator, render quality, and duration for the first scene draft."
      />
      <section>
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {creators.map((item) => {
            const selected = creator === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setCreator(item.id)}
                className={`${panel} relative p-5 text-left transition ${selected ? "border-primary bg-primary/[.06]" : "hover:border-white/25"}`}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl font-display text-lg font-semibold ${selected ? "bg-primary text-black" : "bg-surface-3 text-white"}`}
                >
                  {item.initials}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold uppercase text-white">
                  {item.name}
                </h3>
                <p className="mt-1 text-xs font-semibold text-primary">{item.persona}</p>
                <p className="mt-3 min-h-10 text-sm leading-5 text-neutral-450">{item.style}</p>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlayingVoice(playingVoice === item.id ? null : item.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      setPlayingVoice(playingVoice === item.id ? null : item.id);
                  }}
                  className="mt-4 flex w-full items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-primary">
                    <Icon name={playingVoice === item.id ? "pause" : "play"} className="h-3 w-3" />
                  </span>
                  {playingVoice === item.id ? "Playing sample…" : "Preview voice"}
                </span>
                {selected ? (
                  <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-black">
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
      <section className={`${panel} mt-6 p-5 sm:p-7`}>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Field
            label="Render quality"
            help="Higher quality uses a higher-resolution backend model and more credits."
          >
            <select className={input} value={quality} onChange={(e) => setQuality(e.target.value)}>
              <option value="economy">Economy · Faster</option>
              <option value="standard">Standard · Balanced</option>
              <option value="premium">Premium · 1080p</option>
            </select>
          </Field>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-white">Video duration</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {durations.map((item) => (
                <button
                  type="button"
                  key={item.seconds}
                  onClick={() => setDuration(item.seconds)}
                  className={`relative rounded-2xl border p-4 text-left transition ${duration === item.seconds ? "border-primary bg-primary/[.06]" : "border-white/10 bg-black hover:border-white/25"}`}
                >
                  {item.recommended ? (
                    <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-1 text-[9px] font-bold uppercase text-black">
                      Recommended
                    </span>
                  ) : null}
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-450">
                    {item.label}
                  </span>
                  <strong className="mt-1 block font-display text-2xl text-white">
                    {item.seconds}s
                  </strong>
                  <span className="mt-2 block text-xs leading-5 text-neutral-500">
                    {item.detail}
                  </span>
                  <span className="mt-3 block text-xs font-semibold text-primary">
                    {item.scenes} · {item.credits} credit
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <FooterActions
        meta={`${creators.find((item) => item.id === creator)?.name} · ${duration} seconds · ${quality} · 9:16 vertical`}
      >
        <Button variant="outline" tone="light" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onGenerate}>
          Generate scenes <Icon name="sparkles" />
        </Button>
      </FooterActions>
    </>
  );
}
