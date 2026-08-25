import { Button } from "@visuala/ui";
import type { ChangeEvent } from "react";
import { input, panel } from "./create-video-constants";
import type { Product, Upload, UploadKind } from "./create-video-types";
import { Field, FooterActions, Header, Icon } from "./CreateVideoPrimitives";

function UploadPanel({
  kind,
  title,
  copy,
  uploads,
  onUpload,
  onRemove,
  onMain,
}: {
  kind: UploadKind;
  title: string;
  copy: string;
  uploads: Upload[];
  onUpload: (kind: UploadKind, event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  onMain?: (id: string) => void;
}) {
  return (
    <section className={`${panel} p-5 sm:p-7`}>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon name={kind === "product" ? "image" : "sparkles"} />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold uppercase text-white">{title}</h2>
          <p className="mt-1 font-sans-secondary text-sm leading-6 text-neutral-450">{copy}</p>
        </div>
      </div>
      <label className="mt-5 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black/40 px-6 text-center transition hover:border-primary/70 hover:bg-primary/[.03]">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-primary">
          <Icon name="upload" />
        </span>
        <span className="font-sans-secondary text-sm font-semibold text-white">
          Choose {kind === "product" ? "product photos" : "listing screenshots"}
        </span>
        <span className="mt-1 text-xs text-neutral-500">JPG, PNG, or WEBP · up to 4 images</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => onUpload(kind, event)}
        />
      </label>
      {uploads.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className={`group relative aspect-square overflow-hidden rounded-2xl border bg-surface-2 ${upload.main ? "border-primary" : "border-white/10"}`}
              style={{
                backgroundImage: `linear-gradient(180deg, transparent, rgb(0 0 0 / .75)), url(${upload.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <button
                type="button"
                disabled={!onMain}
                className="absolute inset-x-2 bottom-2 truncate rounded-full bg-black/75 px-2 py-1 text-left text-[10px] text-white disabled:cursor-default"
                onClick={() => onMain?.(upload.id)}
              >
                {upload.main ? "Main product photo" : upload.name}
              </button>
              <button
                type="button"
                aria-label={`Remove ${upload.name}`}
                onClick={() => onRemove(upload.id)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Icon name="trash" className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/[.03] p-4 text-neutral-500">
          <Icon name="image" />
          <span className="text-xs">
            {kind === "product"
              ? "Add at least one clear product photo to continue."
              : "Optional, but helps AI detect the title, price, benefits, reviews, and promotions."}
          </span>
        </div>
      )}
    </section>
  );
}

export function ProductSetup({
  uploads,
  onUpload,
  onRemove,
  onMain,
  onContinue,
}: {
  uploads: Upload[];
  onUpload: (kind: UploadKind, event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  onMain: (id: string) => void;
  onContinue: () => void;
}) {
  const productUploads = uploads.filter((upload) => upload.kind === "product");
  const listingUploads = uploads.filter((upload) => upload.kind === "listing");
  return (
    <>
      <Header
        eyebrow="Step 1 · Add your product"
        title="Upload it. AI handles the brief."
        copy="Skip the long form. Add clear product photos and screenshots from Shopee, TikTok Shop, Tokopedia, or any other marketplace."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ["01", "Upload sources", "Product photos and listing screenshots"],
          ["02", "AI reads everything", "Names, benefits, audience, offers, and reviews"],
          ["03", "Review the brief", "Adjust anything before generating scenes"],
        ].map(([number, title, detail]) => (
          <div key={number} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
            <span className="text-xs font-bold text-primary">{number}</span>
            <strong className="ml-3 text-sm text-white">{title}</strong>
            <p className="mt-2 text-xs leading-5 text-neutral-500">{detail}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <UploadPanel
          kind="product"
          title="Product photos"
          copy="Upload the front, packaging, texture, and important details. Pick the strongest photo as the main reference."
          uploads={productUploads}
          onUpload={onUpload}
          onRemove={onRemove}
          onMain={onMain}
        />
        <UploadPanel
          kind="listing"
          title="Marketplace screenshots"
          copy="Add screenshots that show the product title, description, price, promotion, reviews, or key claims."
          uploads={listingUploads}
          onUpload={onUpload}
          onRemove={onRemove}
        />
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/[.04] p-4">
        <span className="mt-0.5 text-primary">
          <Icon name="sparkles" className="h-4 w-4" />
        </span>
        <p className="text-xs leading-5 text-neutral-450">
          <strong className="text-white">Tip for a better analysis:</strong> avoid blurry images and
          make sure text in marketplace screenshots is readable. You can review every AI-generated
          field before continuing.
        </p>
      </div>
      <FooterActions
        meta={`${productUploads.length} product photo${productUploads.length === 1 ? "" : "s"} · ${listingUploads.length} listing screenshot${listingUploads.length === 1 ? "" : "s"}`}
      >
        <Button variant="outline" tone="light">
          Save draft
        </Button>
        <Button onClick={onContinue} disabled={!productUploads.length}>
          Analyze with AI <Icon name="sparkles" />
        </Button>
      </FooterActions>
    </>
  );
}
export function ProductAnalysis({ progress }: { progress: number }) {
  const tasks = [
    "Reading product photos",
    "Extracting listing text",
    "Detecting benefits and offers",
    "Inferring the target audience",
    "Building the creative brief",
  ];
  const activeIndex = Math.min(tasks.length - 1, Math.floor(progress / 20));
  return (
    <div className="flex min-h-[620px] items-center justify-center">
      <section className="w-full max-w-2xl text-center">
        <span className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-3xl bg-primary text-black">
          <Icon name="sparkles" className="h-7 w-7" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-primary">
          AI product intelligence
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase text-white">
          Turning images into a creative brief
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-450">
          Visuala is combining visual details with text from your marketplace screenshots. No manual
          product form needed.
        </p>
        <div className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Analyzing sources
            </span>
            <strong className="font-display text-2xl text-white">{progress}%</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={`${panel} mt-6 p-5 text-left`}>
            {tasks.map((task, index) => (
              <div
                key={task}
                className="flex items-center gap-3 border-b border-white/[.06] py-3 last:border-0"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${index < activeIndex ? "border-primary bg-primary text-black" : index === activeIndex ? "animate-pulse border-primary text-primary" : "border-white/15 text-neutral-650"}`}
                >
                  {index < activeIndex ? <Icon name="check" className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={`text-sm ${index <= activeIndex ? "text-white" : "text-neutral-650"}`}
                >
                  {task}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
export function ProductReview({
  product,
  setProduct,
  uploads,
  onBack,
  onContinue,
}: {
  product: Product;
  setProduct: (product: Product) => void;
  uploads: Upload[];
  onBack: () => void;
  onContinue: () => void;
}) {
  const set = (key: keyof Product, value: string) => setProduct({ ...product, [key]: value });
  const fields: {
    key: keyof Product;
    label: string;
    wide?: boolean;
  }[] = [
    { key: "name", label: "Product name" },
    { key: "category", label: "Category" },
    { key: "description", label: "Product description", wide: true },
    { key: "audience", label: "Target audience" },
    { key: "sellingPoint", label: "Main selling point" },
    { key: "offer", label: "Offer or promotion" },
    { key: "cta", label: "Call to action" },
    { key: "keyMessage", label: "Key message", wide: true },
    { key: "concept", label: "Suggested video concept", wide: true },
  ];
  return (
    <>
      <Header
        eyebrow="AI analysis complete"
        title="Your product brief is ready"
        copy="Visuala extracted these details from your images. Review and fine-tune anything before choosing a creator."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className={`${panel} overflow-hidden`}>
          <div className="flex items-center gap-3 border-b border-white/10 bg-primary/[.06] p-5 text-sm text-primary">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">
              <Icon name="check" className="h-4 w-4" />
            </span>
            <span>
              <strong>Product understood.</strong> All fields remain editable.
            </span>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
            {fields.map((field) => (
              <div key={field.key} className={field.wide ? "sm:col-span-2" : ""}>
                <Field label={field.label}>
                  {field.wide ? (
                    <textarea
                      className={`${input} min-h-24 resize-y`}
                      value={product[field.key]}
                      onChange={(event) => set(field.key, event.target.value)}
                    />
                  ) : (
                    <input
                      className={input}
                      value={product[field.key]}
                      onChange={(event) => set(field.key, event.target.value)}
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </section>
        <aside className={`${panel} h-fit p-5`}>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">
            Sources analyzed
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {uploads.slice(0, 6).map((upload) => (
              <div
                key={upload.id}
                className="aspect-square rounded-xl border border-white/10 bg-cover bg-center"
                style={{ backgroundImage: `url(${upload.url})` }}
              />
            ))}
          </div>
          <dl className="mt-5 divide-y divide-white/[.07] text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-neutral-500">Product photos</dt>
              <dd className="font-semibold text-white">
                {uploads.filter((upload) => upload.kind === "product").length}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-neutral-500">Listing screenshots</dt>
              <dd className="font-semibold text-white">
                {uploads.filter((upload) => upload.kind === "listing").length}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-neutral-500">Confidence</dt>
              <dd className="font-semibold text-primary">High</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 text-xs font-semibold text-primary hover:underline"
          >
            Change uploaded sources
          </button>
        </aside>
      </div>
      <FooterActions meta="This brief will guide the script, dialogue, and visual direction">
        <Button variant="outline" tone="light" onClick={onBack}>
          Back to uploads
        </Button>
        <Button onClick={onContinue} disabled={!product.name.trim()}>
          Use this brief <Icon name="arrow" />
        </Button>
      </FooterActions>
    </>
  );
}
