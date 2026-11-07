import { createSignal, For, onSettled, Show } from "solid-js";
import { t } from "@rimelight/i18n";

type Photo = { src: string; page: string; title: string };
// Bound resolved metadata; images stay lazy and in-flight requests stay cancellable.
const galleryCache = new Map<string, { photos: Photo[]; expires: number }>();

// Fetch additional article photos only when the lightbox is opened.
export function PhotoGallery(props: { src: string; page: string; article: string; title: string }) {
  const [photos, setPhotos] = createSignal<Photo[]>([]);
  const [index, setIndex] = createSignal(0);
  const [loading, setLoading] = createSignal(false);
  let dialog: HTMLDialogElement | undefined;
  let controller: AbortController | undefined;
  let opener: HTMLButtonElement | undefined;
  const current = () => photos()[index()];
  const move = (direction: number) =>
    setIndex((value) => (value + direction + photos().length) % Math.max(1, photos().length));
  async function open() {
    controller?.abort();
    const request = new AbortController();
    controller = request;
    setPhotos([{ src: props.src, page: props.page, title: props.title }]);
    setIndex(0);
    const cached = galleryCache.get(props.article);
    if (cached && cached.expires > Date.now()) {
      setPhotos(cached.photos);
      setLoading(false);
      dialog?.showModal();
      return;
    }
    setLoading(true);
    dialog?.showModal();
    try {
      const title = decodeURIComponent(new URL(props.article).pathname.split("/wiki/")[1] ?? "");
      const params = new URLSearchParams({
        action: "query",
        generator: "images",
        titles: title,
        gimlimit: "30",
        prop: "imageinfo",
        iiprop: "url|mime",
        iiurlwidth: "1400",
        format: "json",
        formatversion: "2",
        origin: "*",
      });
      const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
        signal: request.signal,
      });
      if (!response.ok) throw new Error("Gallery unavailable");
      const data = (await response.json()) as {
        query?: {
          pages?: {
            title?: string;
            imageinfo?: {
              thumburl?: string;
              url?: string;
              descriptionurl?: string;
              mime?: string;
            }[];
          }[];
        };
      };
      const additional = (data.query?.pages ?? [])
        .filter((page) => !/flag|coat.of.arms|logo|map|icon|locator/i.test(page.title ?? ""))
        .flatMap((page) => {
          const info = page.imageinfo?.[0];
          return info?.url &&
            info.descriptionurl &&
            /^image\/(jpeg|png|webp)$/.test(info.mime ?? "")
            ? [
                {
                  src: info.thumburl ?? info.url,
                  page: info.descriptionurl,
                  title: (page.title ?? props.title).replace(/^File:/, "").replaceAll("_", " "),
                },
              ]
            : [];
        });
      if (!request.signal.aborted) {
        const photos = [
          { src: props.src, page: props.page, title: props.title },
          ...additional.filter((photo) => photo.page !== props.page).slice(0, 8),
        ];
        if (!galleryCache.has(props.article) && galleryCache.size >= 32)
          galleryCache.delete(galleryCache.keys().next().value!);
        galleryCache.set(props.article, { photos, expires: Date.now() + 600_000 });
        if (galleryCache.size > 30) galleryCache.delete(galleryCache.keys().next().value!);
        setPhotos(photos);
      }
    } catch {
      /* Keep the original photo available when extra images cannot be loaded. */
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }
  function close() {
    controller?.abort();
    dialog?.close();
    opener?.focus();
  }
  onSettled(() => () => controller?.abort());
  return (
    <>
      <button
        ref={(element) => {
          opener = element;
        }}
        type="button"
        class="city-photo group"
        aria-label={t("timezone.openPhotos")}
        onClick={open}
      >
        <img
          src={props.src}
          alt={props.title}
          loading="lazy"
          decoding="async"
          class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span class="photo-overlay-control absolute bottom-3 right-3 grid size-9 place-items-center rounded-full border border-primary-500/50 bg-black/65 text-primary-500">
          <span class="i-lucide-expand size-4" aria-hidden="true" />
        </span>
      </button>
      <dialog
        ref={(element) => {
          dialog = element;
        }}
        class="city-gallery"
        aria-label={props.title}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === dialog) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
        }}
      >
        <div class="mx-auto flex flex-col gap-4 rounded-2xl border border-primary-700/60 bg-neutral-50/95 p-4 text-neutral-950 shadow-2xl sm:p-6">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-lg font-bold">{props.title}</h3>
            <button
              type="button"
              class="grid size-10 place-items-center rounded-full border border-primary-700 text-primary-500"
              aria-label={t("timezone.closePhotos")}
              onClick={close}
            >
              <span class="i-lucide-x size-5" aria-hidden="true" />
            </button>
          </div>
          <div class="relative grid min-h-64 place-items-center overflow-hidden rounded-xl bg-black/30">
            <Show when={current()}>
              {(photo) => (
                <img
                  src={photo().src}
                  alt={photo().title}
                  class="max-h-[74dvh] w-full object-contain"
                />
              )}
            </Show>
            <Show when={photos().length > 1}>
              <button
                type="button"
                class="photo-overlay-control absolute left-3 grid size-11 place-items-center rounded-full border border-primary-500/60 bg-black/75 text-xl text-primary-500"
                aria-label={t("timezone.previousPhoto")}
                onClick={() => move(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                class="photo-overlay-control absolute right-3 grid size-11 place-items-center rounded-full border border-primary-500/60 bg-black/75 text-xl text-primary-500"
                aria-label={t("timezone.nextPhoto")}
                onClick={() => move(1)}
              >
                ›
              </button>
            </Show>
          </div>
          <div class="flex items-center justify-between gap-3 text-xs">
            <span>
              {loading() ? t("timezone.loadingPhotos") : `${index() + 1} / ${photos().length}`}
            </span>
            <a
              href={current()?.page}
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-500 underline"
            >
              {t("timezone.photoCredits")}
            </a>
          </div>
          <Show when={photos().length > 1}>
            <div class="flex gap-2 overflow-x-auto pb-1">
              <For each={photos()}>
                {(photo, position) => (
                  <button
                    type="button"
                    class={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${index() === position() ? "border-primary-500" : "border-transparent"}`}
                    aria-label={photo.title}
                    onClick={() => setIndex(position())}
                  >
                    <img src={photo.src} alt="" loading="lazy" class="h-full w-full object-cover" />
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
      </dialog>
    </>
  );
}
