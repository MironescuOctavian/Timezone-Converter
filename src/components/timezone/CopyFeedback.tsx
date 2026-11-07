import { createEffect, createSignal, Show } from "solid-js";

export function CopyFeedback(props: { message: string }) {
  const [visible, setVisible] = createSignal(false);
  createEffect(
    () => props.message,
    (message) => {
      setVisible(Boolean(message));
      if (!message) return;
      const timer = setTimeout(() => setVisible(false), 10_000);
      return () => clearTimeout(timer);
    },
  );
  return (
    <div role="status" aria-live="polite" class="w-full text-center">
      <Show when={visible()}>
        <p class="copy-feedback">{props.message}</p>
      </Show>
    </div>
  );
}
