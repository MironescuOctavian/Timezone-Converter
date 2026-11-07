// Shared semantic shortcuts keep complex responsive/state styling in UnoCSS.
// Theme variables and animation keyframes remain in the small CSS token files.
export const siteShortcuts: Record<string, string> = {
  "globe-enable-button": "[color:#000] [&:not(:disabled)]:[min-height:3rem]",
  "site-header-container":
    "mx-auto grid max-w-6xl items-center [grid-template-columns:minmax(0,_1fr)_auto] [gap:0.5rem] [padding:0.75rem] [@media_(min-width:_1000px)]:flex [@media_(min-width:_1000px)]:justify-between [@media_(min-width:_1000px)]:[height:4.5rem] [@media_(min-width:_1000px)]:[gap:1rem] [@media_(min-width:_1000px)]:[padding:0_2rem]",
  "site-header-navigation":
    "min-w-0 [grid-column:1/-1] [grid-row:2] [@media_(min-width:_1000px)]:flex [@media_(min-width:_1000px)]:flex-1 [@media_(min-width:_1000px)]:justify-center",
  "site-header-links":
    "grid w-full grid-cols-3 items-center gap-1 text-center [&_a]:flex [&_a]:items-center [&_a]:justify-center [&_a]:[min-height:2.75rem] [@media_(max-width:_999px)]:[&_a]:[padding:0.5rem] [@media_(max-width:_999px)]:[&_a]:[font-size:0.75rem] [@media_(max-width:_999px)]:[&_a]:[line-height:1.25] [@media_(min-width:_1000px)]:flex [@media_(min-width:_1000px)]:[width:auto] [@media_(min-width:_1000px)]:whitespace-nowrap",
  "site-header-mobile-contact": "[@media_(min-width:_1000px)]:[display:none_!important]",
  "copy-feedback":
    "mt-4 rounded-xl border border-primary-700/40 bg-primary-500/10 px-5 py-4 text-center text-lg font-bold text-primary-500 [animation:section-enter_250ms_ease-out_both] [@media(prefers-reduced-motion:reduce)]:[animation:none]",
  "converter-search":
    "relative mx-auto w-full max-w-sm [@media(min-width:768px)]:absolute [@media(min-width:768px)]:[left:50%] [@media(min-width:768px)]:[transform:translateX(-50%)]",
  "site-footer-layout":
    "mx-auto grid grid-cols-2 items-start justify-items-center gap-8 max-w-6xl px-5 py-8 text-center [&>div]:min-w-0 [&>div]:max-w-full [&>div:first-child]:[grid-column:1/-1] [&>div:nth-child(4)]:[grid-column:1/-1] [&>div:last-child]:[grid-column:1/-1] [&_a]:[overflow-wrap:anywhere] [@media_(min-width:_1000px)]:flex [@media_(min-width:_1000px)]:flex-row [@media_(min-width:_1000px)]:flex-nowrap [@media_(min-width:_1000px)]:justify-between [@media_(min-width:_1000px)]:[gap:1rem] [@media_(min-width:_1000px)]:[&>div]:shrink-0 [@media_(min-width:_1280px)]:[gap:2rem] [@media_(max-width:_1279px)]:[padding-bottom:7rem]",
  "city-photo":
    "relative block w-full overflow-hidden rounded-xl [aspect-ratio:4/3] [&:not(:disabled)]:[min-height:18rem] [@media_(min-width:_640px)]:[aspect-ratio:auto]",
  "timezone-page":
    "[width:100%] [max-width:72rem] [margin-inline:auto] [padding:2rem_1.25rem_5rem] [color:var(--rl-neutral-950)] [@media_(min-width:_640px)]:[padding-inline:2rem] [&_>_section]:[margin-block:0] [&_>_section_+_section]:[margin-top:clamp(3.5rem,_6vw,_5rem)] [&_.section-heading]:[margin-bottom:1.75rem] [&_>_section]:[animation:section-enter_0.65s_ease-out_both] [&_button]:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease,_background-color_0.2s_ease] [&_a]:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease,_background-color_0.2s_ease] [&_button:hover]:[transform:translateY(-2px)] [&_a:hover]:[transform:translateY(-2px)] [@media_(prefers-reduced-motion:_reduce)]:[&_>_section]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[&_button]:[transition:none] [@media_(prefers-reduced-motion:_reduce)]:[&_a]:[transition:none] [@media_(prefers-reduced-motion:_reduce)]:[&_button:hover]:[transform:none] [@media_(prefers-reduced-motion:_reduce)]:[&_a:hover]:[transform:none] [@media_(hover:_hover)_and_(prefers-reduced-motion:_no-preference)]:[&_button:not(:disabled):hover]:[box-shadow:0_4px_16px_color-mix(in_srgb,_var(--rl-primary-500)_16%,_transparent)] [@media_(hover:_hover)_and_(prefers-reduced-motion:_no-preference)]:[&_a.hero-cta:hover]:[box-shadow:0_4px_16px_color-mix(in_srgb,_var(--rl-primary-500)_16%,_transparent)] [@media_(hover:_hover)_and_(prefers-reduced-motion:_no-preference)]:[&_button:not(:disabled):active]:[transform:scale(0.98)] [@media_(hover:_hover)_and_(prefers-reduced-motion:_no-preference)]:[&_button:not(:disabled):active]:[box-shadow:none] [&_a.hero-cta]:[min-width:min(100%,_22rem)] [&_a.hero-cta]:[min-height:4.5rem] [&_a.hero-cta]:[padding:1rem_2rem] [&_a.hero-cta]:justify-center [&_a.hero-cta]:[font-size:1.15rem] [&_a.hero-cta]:[box-shadow:0_8px_28px_color-mix(in_srgb,_var(--rl-primary-500)_12%,_transparent)] [&_.section-rail_>_a:hover]:[transform:none] [@media_(max-width:_1279px)]:[padding-bottom:7rem] [--timeline-day:#ffbf00] [--timeline-evening:#ac7b20] [--timeline-night:#40331d]",
  "timezone-world-clock": "[padding-top:7rem]",
  "timezone-home": "[@media_(min-width:_640px)]:[padding-top:3rem]",
  "section-heading":
    "[&_h2]:[margin-top:0.75rem] [&_h2]:[line-height:1.2] [&_h2_+_p]:[margin-top:0.75rem] [&_h2_+_p]:[line-height:1.6]",
  "country-shape":
    "[transition:fill-opacity_150ms,_stroke-width_150ms] [&:hover]:[filter:drop-shadow(0_0_5px_var(--rl-primary-500))]",
  "clock-marquee":
    '[mask-image:linear-gradient(to_right,_transparent,_black_4%,_black_96%,_transparent)] [@media_(prefers-reduced-motion:_reduce)]:[&_[data-slot="track"]]:[animation:none_!important]',
  "clock-card":
    '[background:radial-gradient(_circle_at_100%_0%,_color-mix(in_srgb,_var(--rl-primary-500)_12%,_transparent),_transparent_45%_),_linear-gradient(145deg,_var(--rl-neutral-50),_var(--rl-primary-950))] [box-shadow:inset_0_1px_0_color-mix(in_srgb,_var(--rl-primary-500)_25%,_transparent),_0_8px_28px_#0002] [&::before]:[content:""] [&::before]:absolute [&::before]:[top:0] [&::before]:[left:1.25rem] [&::before]:[right:1.25rem] [&::before]:[height:2px] [&::before]:[background:linear-gradient(90deg,_transparent,_var(--rl-primary-500),_transparent)] [&::before]:[opacity:0.7] [&::before]:pointer-events-none [&:hover]:[transform:translateY(-4px)] [@media_(prefers-reduced-motion:_reduce)]:[&:hover]:[transform:none]',
  "timezone-live-ring":
    "[animation:timezone-live-pulse_1.8s_ease-out_infinite] [@media_(prefers-reduced-motion:_reduce)]:[animation:none]",
  "weather-icon":
    "relative inline-block [@media_(prefers-reduced-motion:_reduce)]:[animation:none]",
  "weather-sun": "[animation:timezone-orbit_12s_linear_infinite]",
  "weather-snow": "[animation:timezone-orbit_12s_linear_infinite]",
  "weather-rain":
    '[&::after]:[content:"···"] [&::after]:absolute [&::after]:[left:20%] [&::after]:[bottom:-0.45em] [&::after]:[color:#75bfff] [&::after]:[letter-spacing:1px] [&::after]:[animation:weather-drops_1.1s_linear_infinite] [@media_(prefers-reduced-motion:_reduce)]:[&::after]:[animation:none]',
  "globe-canvas":
    "block [width:100%] [height:clamp(280px,_44vw,_600px)] overflow-hidden select-none [-webkit-user-select:none]",
  "globe-selector":
    "[&_select]:text-center [&_select]:[text-align-last:center] [&_select]:[padding-inline:2.5rem] [@media_(min-width:_640px)]:[grid-column:1_/_-1]",
  "world-clock-row":
    "grid [grid-template-columns:2.75rem_minmax(0,_1.25fr)_minmax(7.5rem,_0.8fr)_minmax(_9rem,_0.9fr_)_auto_0.75rem] items-center [gap:1rem] [@media_(max-width:_767px)]:[grid-template-columns:2.75rem_minmax(0,_1fr)_auto_0.75rem] [@media_(max-width:_767px)]:[gap:0.75rem]",
  "world-clock-row-meta":
    "flex items-center [gap:0.85rem] [min-width:10rem] [padding-inline:1.25rem] [border-inline-start:1px_solid_color-mix(in_srgb,_var(--rl-primary-500)_20%,_transparent)] [font-size:0.8rem] [@media_(max-width:_767px)]:hidden",
  "world-clock-row-facts": "grid [gap:0.4rem]",
  "city-activity-status":
    "flex items-center [gap:0.65rem] [min-width:0] [@media_(max-width:_767px)]:hidden",
  "city-activity-copy":
    "grid [gap:0.3rem] [min-width:0] [&_strong]:[font-size:0.7rem] [&_strong]:font-semibold [&_strong]:[line-height:1.4] [&_small]:[font:0.6rem_monospace] [&_small]:[opacity:0.55]",
  "city-activity":
    "grid place-items-center [flex:none] [width:2.5rem] [height:2.5rem] [border:1px_solid_color-mix(in_srgb,_var(--site-accent-ink)_20%,_transparent)] [border-radius:0.85rem] [color:var(--site-accent-ink)]",
  "city-activity-work": "[background:color-mix(in_srgb,_var(--rl-primary-500)_15%,_transparent)]",
  "city-activity-free": "[background:color-mix(in_srgb,_var(--site-accent-ink)_7%,_transparent)]",
  "city-activity-sleep":
    "[background:color-mix(in_srgb,_var(--rl-neutral-950)_5%,_transparent)] [opacity:0.7]",
  "presence-markers":
    "[&_>_g:focus]:[outline:none] [&_>_g:focus_>_circle:last-child]:[stroke:var(--site-map-selected-outline,_white)] [&_>_g:focus_>_circle:last-child]:[stroke-width:2.5]",
  "presence-dot-halo":
    "[animation:presence-glow_3s_ease-in-out_infinite] [@media_(prefers-reduced-motion:_reduce)]:[animation:none]",
  "globe-stage":
    "[height:calc(clamp(280px,_44vw,_600px)_+_0.75rem)] overflow-hidden [@media_(min-width:_640px)]:[grid-column:1] [@media_(min-width:_640px)]:[grid-row:2_/_4] [@media_(min-width:_640px)]:relative [@media_(min-width:_640px)]:[height:auto] [@media_(min-width:_640px)]:[min-height:0] [@media_(min-width:_640px)]:[align-self:stretch] [@media_(min-width:_640px)]:[&_.globe-canvas]:absolute [@media_(min-width:_640px)]:[&_.globe-canvas]:[inset:0] [@media_(min-width:_640px)]:[&_.globe-canvas]:[margin:0] [@media_(min-width:_640px)]:[&_.globe-canvas]:[height:calc(100%_-_4rem)]",
  "country-card":
    "[box-sizing:border-box] [height:17.5rem] flex flex-col overflow-hidden [&_>_.flex]:justify-center",
  "country-card-weather":
    "[flex:none] [height:1.5rem] overflow-hidden [&_.city-info_>_div_>_p]:[min-width:0] [&_.city-info_>_div_>_p]:overflow-hidden [&_.city-info_>_div_>_p]:[white-space:nowrap] [&_.city-info_>_div_>_p_>_span:last-child]:overflow-hidden [&_.city-info_>_div_>_p_>_span:last-child]:[text-overflow:ellipsis] [&_.city-info_>_div]:justify-center",
  "country-card-actions": "[margin-top:auto]",
  "globe-hover-slot":
    "[&_.country-card]:text-center [&_>_div]:[min-height:14.5rem] [@media_(max-width:_639px)]:[margin-top:1.25rem] [@media_(min-width:_640px)]:[grid-column:2] [@media_(min-width:_640px)]:[grid-row:2] [@media_(min-width:_640px)]:[align-self:start] [@media_(min-width:_640px)]:[padding-top:1rem]",
  "globe-exploring": "[@media_(max-width:_639px)]:hidden",
  "globe-panel":
    "[&_.globe-details]:text-center [@media_(min-width:_640px)]:grid [@media_(min-width:_640px)]:[grid-template-columns:minmax(0,_1.5fr)_minmax(230px,_0.8fr)] [@media_(min-width:_640px)]:[grid-template-rows:auto_auto_auto] [@media_(min-width:_640px)]:[gap:0.5rem_1.5rem] [@media_(min-width:_640px)]:items-start",
  "globe-guide": "text-center [&_.flex]:justify-center",
  "city-gallery":
    "fixed [inset:0] [margin:auto] [border:0] [padding:1rem] [width:min(96vw,_90rem)] [max-height:96dvh] overflow-y-auto [background:transparent] [color:inherit] [&::backdrop]:[background:#000b] [&::backdrop]:[backdrop-filter:blur(7px)] [&[open]]:[animation:section-enter_0.2s_ease-out] [&_button:hover]:[transform:none]",
  "globe-controls":
    "flex-wrap [&_button.globe-zoom-button]:[box-sizing:border-box] [&_button.globe-zoom-button]:inline-flex [&_button.globe-zoom-button]:[width:3rem] [&_button.globe-zoom-button]:[min-width:3rem] [&_button.globe-zoom-button]:[height:3rem] [&_button.globe-zoom-button]:[min-height:3rem] [&_button.globe-zoom-button]:[flex:0_0_3rem] [&_button.globe-zoom-button]:items-center [&_button.globe-zoom-button]:justify-center [&_button.globe-zoom-button]:[padding:0] [&_button.globe-zoom-button]:[line-height:1] [@media_(min-width:_640px)]:[grid-column:1] [@media_(min-width:_640px)]:[grid-row:3] [@media_(min-width:_640px)]:[align-self:end] [@media_(min-width:_640px)]:[z-index:1]",
  "globe-zoom-value": "inline-block [width:3.25rem] [flex:0_0_3.25rem]",
  "converter-date":
    '[box-sizing:border-box] [height:3.5rem] [min-height:3.5rem] [&:focus]:[outline:2px_solid_#fff] [&:focus]:[outline-offset:2px] [&:focus]:[animation:date-focus_1.8s_ease-in-out_infinite] [&::-webkit-datetime-edit-year-field:focus]:[background:#fff] [&::-webkit-datetime-edit-year-field:focus]:[color:#111] [&::-webkit-datetime-edit-year-field:focus]:[border-radius:3px] [&::-webkit-datetime-edit-month-field:focus]:[background:#fff] [&::-webkit-datetime-edit-month-field:focus]:[color:#111] [&::-webkit-datetime-edit-month-field:focus]:[border-radius:3px] [&::-webkit-datetime-edit-day-field:focus]:[background:#fff] [&::-webkit-datetime-edit-day-field:focus]:[color:#111] [&::-webkit-datetime-edit-day-field:focus]:[border-radius:3px] [&::-webkit-datetime-edit-hour-field:focus]:[background:#fff] [&::-webkit-datetime-edit-hour-field:focus]:[color:#111] [&::-webkit-datetime-edit-hour-field:focus]:[border-radius:3px] [&::-webkit-datetime-edit-minute-field:focus]:[background:#fff] [&::-webkit-datetime-edit-minute-field:focus]:[color:#111] [&::-webkit-datetime-edit-minute-field:focus]:[border-radius:3px] [&::-webkit-datetime-edit-second-field:focus]:[background:#fff] [&::-webkit-datetime-edit-second-field:focus]:[color:#111] [&::-webkit-datetime-edit-second-field:focus]:[border-radius:3px] [&::-webkit-datetime-edit-ampm-field:focus]:[background:#fff] [&::-webkit-datetime-edit-ampm-field:focus]:[color:#111] [&::-webkit-datetime-edit-ampm-field:focus]:[border-radius:3px] [@media_(prefers-reduced-motion:_reduce)]:[&:focus]:[animation:none] [:root[data-theme="light"]_&:focus]:[outline-color:#805000] [:root[data-theme="light"]_&:focus]:[animation:none] [:root[data-theme="light"]_&:focus]:[box-shadow:0_0_0_2px_#805000] [@media_(prefers-color-scheme:_light)]:[:root:not([data-theme="dark"])_&:focus]:[outline-color:#805000] [@media_(prefers-color-scheme:_light)]:[:root:not([data-theme="dark"])_&:focus]:[animation:none] [@media_(prefers-color-scheme:_light)]:[:root:not([data-theme="dark"])_&:focus]:[box-shadow:0_0_0_2px_#805000]',
  "timezone-option-group":
    "[color:var(--rl-primary-500)] [border-top:1px_solid_var(--rl-primary-500)] font-bold [&_option]:[color:var(--rl-neutral-950)] [&_option]:[background:var(--rl-neutral-50)] [&_option]:[font-weight:400]",
  "globe-details":
    "[@media_(max-width:_639px)]:[margin-top:1.25rem] [@media_(min-width:_640px)]:[grid-column:2] [@media_(min-width:_640px)]:[grid-row:3] [@media_(min-width:_640px)]:text-left",
  "hero-dial-ring": "[@media_(prefers-reduced-motion:_reduce)]:[animation:none]",
  "hero-dial-inner": "[@media_(prefers-reduced-motion:_reduce)]:[animation:none]",
  "hero-dial-card": "[@media_(prefers-reduced-motion:_reduce)]:[animation:none]",
  "hero-layout":
    "grid items-center [gap:3rem] [padding-block:1.5rem] [@media_(min-width:_768px)]:[grid-template-columns:minmax(0,_1.3fr)_minmax(0,_1fr)] [@media_(min-width:_768px)]:[gap:3.5rem] [@media_(min-width:_768px)]:[padding-block:2rem]",
  "hero-copy":
    "[min-width:0] text-center [&_.hero-local]:flex [&_.hero-local]:justify-center [&_.hero-local]:[width:fit-content] [&_.hero-local]:[max-width:100%] [&_.hero-local]:[margin-inline:auto] [@media_(min-width:_768px)]:text-left [@media_(min-width:_768px)]:[&_.hero-local]:[margin-inline:0_auto]",
  "timezone-mode-switch":
    'justify-center items-center [&_>_button]:inline-flex [&_>_button]:items-center [&_>_button]:justify-center [&_>_button]:[gap:0.5rem] [&_>_button]:[min-height:2.75rem] [&_>_button]:[padding:0.65rem_1.25rem] [&_>_button]:[font-size:0.875rem] [&_>_button]:font-bold [&_>_button]:[line-height:1.25] [&_>_button[aria-pressed="true"]]:[border-color:var(--rl-primary-500)] [&_>_button[aria-pressed="true"]]:[box-shadow:0_3px_14px_color-mix(in_srgb,_var(--rl-primary-500)_12%,_transparent)] [@media_(hover:_hover)_and_(prefers-reduced-motion:_no-preference)]:[&_>_button:hover_>_[aria-hidden="true"]]:[transform:rotate(-8deg)_scale(1.08)] [@media_(hover:_hover)_and_(prefers-reduced-motion:_no-preference)]:[&_>_button_>_[aria-hidden="true"]]:[transition:transform_220ms_ease]',
  "globe-region-label":
    "font-inherit [stroke-linejoin:round] [filter:drop-shadow(0_1px_2px_#0008)]",
  "hero-cta":
    '[@media_(hover:_hover)_and_(prefers-reduced-motion:_no-preference)]:[&:hover_>_[aria-hidden="true"]]:[transform:rotate(-8deg)_scale(1.08)] [@media_(hover:_hover)_and_(prefers-reduced-motion:_no-preference)]:[&_>_[aria-hidden="true"]]:[transition:transform_220ms_ease]',
  "hero-heading":
    "[margin-top:1.75rem] [font-size:clamp(2.5rem,_4.4vw,_3.5rem)] [line-height:1.14] [letter-spacing:-0.045em]",
  "hero-description":
    "[max-width:45ch] [margin:1.25rem_auto_0] [text-wrap:pretty] [@media_(min-width:_768px)]:[margin-inline:0] [@media_(min-width:_768px)]:[max-width:42ch]",
  "hero-action":
    "flex justify-center [margin-top:1.75rem] [@media_(min-width:_768px)]:[justify-content:flex-start]",
  "hero-artwork":
    "relative [isolation:isolate] [width:min(100%,_26rem)] [margin-inline:auto] [padding:1rem_0] [background:radial-gradient(_ellipse_at_center,_color-mix(in_srgb,_var(--rl-primary-500)_6%,_transparent),_transparent_70%_)]",
  "hero-artwork-label":
    'flex items-center justify-center [gap:0.5rem] [margin-bottom:1.5rem] [font-size:0.72rem] font-bold [letter-spacing:0.14em] [text-transform:uppercase] [color:var(--site-accent-ink,_var(--rl-primary-500))] [&_>_span]:relative [&_>_span]:[box-shadow:0_0_10px_#ffbf0080,_0_0_20px_#ffbf0030] [&_>_span::after]:[content:""] [&_>_span::after]:absolute [&_>_span::after]:[inset:0] [&_>_span::after]:[border-radius:inherit] [&_>_span::after]:[background:#ffbf00] [&_>_span::after]:[animation:timezone-live-pulse_2.8s_ease-out_infinite] [@media_(prefers-reduced-motion:_reduce)]:[&_>_span::after]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[&_>_span::after]:hidden [@media_(prefers-reduced-motion:_reduce)]:[&_>_span]:[animation:none]',
  "hero-clocks":
    "grid [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:0.65rem] [width:100%] [margin:auto]",
  "hero-clock-item":
    'relative [isolation:isolate] [min-width:0] [padding:0.6rem_0.35rem_0.85rem] overflow-hidden [border:1px_solid_color-mix(in_srgb,_var(--rl-primary-500)_12%,_transparent)] [border-radius:1rem] [background:linear-gradient(_145deg,_color-mix(in_srgb,_var(--rl-primary-500)_5%,_var(--rl-neutral-50)),_var(--rl-neutral-50)_)] text-center [animation:clock-reveal_0.7s_both] [animation-delay:calc(var(--clock-order)_*_65ms)] [transition:border-color_250ms,_box-shadow_250ms,_background_250ms] [&::after]:[content:""] [&::after]:absolute [&::after]:[inset:-50%] [&::after]:[z-index:-1] [&::after]:[background:linear-gradient(_110deg,_transparent_42%,_color-mix(in_srgb,_var(--rl-primary-500)_9%,_transparent)_50%,_transparent_58%_)] [&::after]:[transform:translateX(-80%)] [&::after]:[animation:clock-sheen_14s_ease-in-out_infinite] [&::after]:[animation-delay:calc(var(--clock-order)_*_0.7s)] [&::after]:pointer-events-none [&:hover]:[border-color:color-mix(in_srgb,_var(--rl-primary-500)_60%,_transparent)] [&:hover]:[box-shadow:inset_0_0_24px_color-mix(in_srgb,_var(--rl-primary-500)_7%,_transparent),_0_0_24px_#0001] [&:hover_.hero-clock-menu]:[opacity:1] [&:hover_.hero-clock-menu]:[pointer-events:auto] [&:focus-within_.hero-clock-menu]:[opacity:1] [&:focus-within_.hero-clock-menu]:[pointer-events:auto] [@media_(prefers-reduced-motion:_reduce)]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[&::after]:[animation:none]',
  "hero-clock-meta":
    "flex justify-between items-center [padding-inline:0.25rem] [margin-bottom:0.4rem] [font:0.55rem_monospace] [letter-spacing:0.1em] [color:var(--rl-primary-500)] [opacity:0.65]",
  "hero-clock-country":
    "flex items-center justify-center [gap:0.3rem] [min-height:1.1rem] [&_img]:[border-radius:2px] [&_img]:[object-fit:cover] [&_img]:[flex-shrink:0]",
  "hero-clock-digital":
    "inline-block [margin-top:0.4rem] [padding:0.2rem_0.45rem] [border-radius:0.35rem] [background:color-mix(in_srgb,_var(--rl-primary-500)_7%,_transparent)] [color:var(--rl-neutral-950)] [letter-spacing:0.03em]",
  "hero-clock-featured":
    "[border-color:color-mix(in_srgb,_var(--rl-primary-500)_45%,_transparent)] [&_.hero-clock-face]:[border-color:var(--rl-primary-500)] [&_.hero-clock-face]:[background:color-mix(in_srgb,_var(--rl-primary-500)_8%,_var(--rl-neutral-50))] [&_.hero-clock-face]:[box-shadow:0_0_28px_color-mix(in_srgb,_var(--rl-primary-500)_12%,_transparent)]",
  "hero-clock-menu":
    "absolute [inset:0] [z-index:2] flex flex-col justify-center [gap:0.5rem] [padding:0.6rem] [border-radius:inherit] [background:color-mix(in_srgb,_var(--rl-neutral-50)_94%,_transparent)] [backdrop-filter:blur(8px)] [opacity:0] pointer-events-none [transition:opacity_180ms_ease] [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:[gap:0.35rem] [&_button]:[min-height:2.5rem] [&_button]:[padding:0.5rem_0.2rem] [&_button]:[border:1px_solid_color-mix(in_srgb,_var(--rl-primary-500)_30%,_transparent)] [&_button]:[border-radius:0.6rem] [&_button]:[font-size:0.65rem] [&_button]:font-bold [&_button]:[color:var(--rl-primary-500)] [&_button]:[transform:none_!important] [&_a]:flex [&_a]:items-center [&_a]:justify-center [&_a]:[gap:0.35rem] [&_a]:[min-height:2.5rem] [&_a]:[padding:0.5rem_0.2rem] [&_a]:[border:1px_solid_color-mix(in_srgb,_var(--rl-primary-500)_30%,_transparent)] [&_a]:[border-radius:0.6rem] [&_a]:[font-size:0.65rem] [&_a]:font-bold [&_a]:[color:var(--rl-primary-500)] [&_a]:[transform:none_!important] [&_.hero-clock-convert]:[background:var(--rl-primary-500)] [&_.hero-clock-convert]:[color:#111] [&_:is(button,_a):focus-visible]:[outline:2px_solid_var(--rl-primary-500)] [&_:is(button,_a):focus-visible]:[outline-offset:2px] [@media_(hover:_none)]:relative [@media_(hover:_none)]:[opacity:1] [@media_(hover:_none)]:[pointer-events:auto] [@media_(hover:_none)]:[padding:0.5rem_0_0] [@media_(hover:_none)]:[background:transparent] [@media_(hover:_none)]:[backdrop-filter:none] [@media_(hover:_none)]:[&_>_p]:hidden",
  "hero-clock-markers":
    "absolute [inset:5%] [border-radius:50%] [background:repeating-conic-gradient(_from_-1deg,_color-mix(in_srgb,_var(--rl-primary-500)_45%,_transparent)_0deg_2deg,_transparent_2deg_30deg_)] [mask-image:radial-gradient(circle,_transparent_63%,_black_65%)]",
  "hero-clock-hand":
    "[@media_(prefers-reduced-motion:_reduce)]:[transition:none_!important] absolute [left:50%] [bottom:50%] [transform-origin:50%_100%] [border-radius:6px] [transition:none]",
  "hero-clock-face":
    "relative [aspect-ratio:1] [width:100%] [max-width:72px] [margin:auto] [border:2px_solid_color-mix(in_srgb,_var(--rl-primary-500)_65%,_transparent)] [border-radius:50%] [background:radial-gradient(_circle_at_35%_25%,_color-mix(in_srgb,_var(--rl-primary-500)_8%,_var(--rl-neutral-50)),_var(--rl-neutral-50)_70%_)] [box-shadow:inset_0_0_0_4px_var(--rl-neutral-50),_0_4px_12px_#0002]",
  "hero-clock-tick": "absolute [background:var(--rl-primary-500)] [border-radius:4px]",
  "hero-clock-tick-top": "[left:49%] [width:2%] [height:7%] [top:4%]",
  "hero-clock-tick-bottom": "[left:49%] [width:2%] [height:7%] [bottom:4%]",
  "hero-clock-tick-left": "[top:49%] [height:2%] [width:7%] [left:4%]",
  "hero-clock-tick-right": "[top:49%] [height:2%] [width:7%] [right:4%]",
  "hero-clock-hour": "[height:25%] [width:5%] [background:var(--rl-primary-500)]",
  "hero-clock-minute": "[height:36%] [width:3%] [background:var(--rl-neutral-950)]",
  "hero-clock-second": "[height:40%] [width:1.5%] [background:var(--rl-primary-500)]",
  "hero-clock-center":
    "absolute [top:50%] [left:50%] [width:10%] [aspect-ratio:1] [transform:translate(-50%,_-50%)] [border-radius:50%] [background:var(--rl-primary-500)] [border:2px_solid_var(--rl-neutral-50)]",
  "section-rail":
    'fixed [z-index:35] [left:50%] [bottom:max(1rem,_env(safe-area-inset-bottom))] [transform:translateX(-50%)] flex items-center [gap:0.35rem] [padding:0.5rem] [border:1px_solid_color-mix(in_srgb,_var(--site-accent-ink)_25%,_transparent)] [border-radius:1.4rem] [background:color-mix(in_srgb,_var(--rl-neutral-50)_94%,_transparent)] [box-shadow:0_8px_32px_#0002,_inset_0_1px_0_color-mix(in_srgb,_var(--site-accent-ink)_10%,_transparent)] [backdrop-filter:blur(16px)] [&_>_a]:relative [&_>_a]:grid [&_>_a]:place-items-center [&_>_a]:[width:2.75rem] [&_>_a]:[height:2.75rem] [&_>_a]:[border-radius:0.95rem] [&_>_a]:[color:var(--rl-neutral-950)] [&_>_a]:[transition:background_200ms,_color_200ms,_box-shadow_200ms] [&_>_a:hover]:[background:color-mix(in_srgb,_var(--site-accent-ink)_10%,_transparent)] [&_>_a:hover]:[color:var(--site-accent-ink)] [&_>_a:focus-visible]:[background:color-mix(in_srgb,_var(--site-accent-ink)_10%,_transparent)] [&_>_a:focus-visible]:[color:var(--site-accent-ink)] [&_>_a:focus-visible]:[outline:2px_solid_var(--site-accent-ink)] [&_>_a:focus-visible]:[outline-offset:3px] [&_>_a[aria-current="location"]]:[background:var(--rl-primary-500)] [&_>_a[aria-current="location"]]:[color:#17120a] [&_>_a[aria-current="location"]]:[box-shadow:0_3px_16px_color-mix(in_srgb,_var(--rl-primary-500)_20%,_transparent)] [&_>_a:is(:hover,_:focus-visible)_.section-rail-tooltip]:[opacity:1] [&_>_a:is(:hover,_:focus-visible)_.section-rail-tooltip]:visible [&_>_a:is(:hover,_:focus-visible)_.section-rail-tooltip]:[transform:translateX(-50%)_translateY(0)] [@media_(min-width:_1280px)]:[left:max(0.4rem,_calc((100vw_-_72rem)_/_2_-_5.75rem))] [@media_(min-width:_1280px)]:[top:calc(50%_+_2.25rem)] [@media_(min-width:_1280px)]:[bottom:auto] [@media_(min-width:_1280px)]:[transform:translateY(-50%)] [@media_(min-width:_1280px)]:flex-col [@media_(min-width:_1280px)]:[&_>_a:is(:hover,_:focus-visible)_.section-rail-tooltip]:[transform:translateX(0)] [@media_(prefers-reduced-motion:_reduce)]:[&_a]:[transition:none]',
  "section-rail-tooltip":
    "absolute [bottom:calc(100%_+_1rem)] [left:50%] [transform:translateX(-50%)_translateY(4px)] flex items-center [gap:0.8rem] [width:max-content] [max-width:15rem] [padding:0.8rem_1rem] [border:1px_solid_color-mix(in_srgb,_var(--site-accent-ink)_25%,_transparent)] [border-radius:1rem] [background:var(--rl-neutral-50)] [color:var(--rl-neutral-950)] [box-shadow:var(--site-shadow)] [opacity:0] invisible pointer-events-none [transition:opacity_180ms,_transform_180ms,_visibility_180ms] [&_strong]:block [&_strong]:[font-size:0.8rem] [&_small]:block [&_small]:[margin-top:0.2rem] [&_small]:[font-size:0.65rem] [&_small]:[opacity:0.6] [@media_(min-width:_1280px)]:[bottom:auto] [@media_(min-width:_1280px)]:[left:calc(100%_+_1rem)] [@media_(min-width:_1280px)]:[transform:translateX(-4px)] [@media_(prefers-reduced-motion:_reduce)]:[transition:none]",
  "section-rail-number": "[font:0.65rem_monospace] [color:var(--site-accent-ink)]",
  "city-timeline": "[padding:0.35rem_1.25rem_0.85rem]",
  "city-timeline-track":
    "relative [height:0.65rem] [border-radius:0.35rem] [background-color:var(--rl-primary-700)] [&_input]:absolute [&_input]:[inset:-0.7rem_-0.55rem] [&_input]:[width:calc(100%_+_1.1rem)] [&_input]:[height:2rem] [&_input]:[margin:0] [&_input]:appearance-none [&_input]:[background:transparent] [&_input]:cursor-grab [&_input]:[touch-action:pan-y] [&_input]:[accent-color:var(--rl-primary-500)] [&_input:active]:cursor-grabbing [&_input:disabled]:[cursor:default] [&_input::-webkit-slider-runnable-track]:[height:0.65rem] [&_input::-webkit-slider-runnable-track]:[background:transparent] [&_input::-webkit-slider-thumb]:appearance-none [&_input::-webkit-slider-thumb]:[width:1.1rem] [&_input::-webkit-slider-thumb]:[height:1.1rem] [&_input::-webkit-slider-thumb]:[margin-top:-0.225rem] [&_input::-webkit-slider-thumb]:[border:2px_solid_var(--rl-neutral-50)] [&_input::-webkit-slider-thumb]:[border-radius:50%] [&_input::-webkit-slider-thumb]:[background:var(--site-accent-ink)] [&_input::-webkit-slider-thumb]:[box-shadow:0_0_0_1px_var(--site-accent-ink),_0_0_12px_#ffbf0040] [&_input::-moz-range-track]:[height:0.65rem] [&_input::-moz-range-track]:[background:transparent] [&_input::-moz-range-thumb]:[width:0.9rem] [&_input::-moz-range-thumb]:[height:0.9rem] [&_input::-moz-range-thumb]:[border:2px_solid_var(--rl-neutral-50)] [&_input::-moz-range-thumb]:[border-radius:50%] [&_input::-moz-range-thumb]:[background:var(--site-accent-ink)] [&_input::-moz-range-thumb]:[box-shadow:0_0_0_1px_var(--site-accent-ink)] [&_input:focus-visible]:[outline:2px_solid_var(--site-accent-ink)] [&_input:focus-visible]:[outline-offset:3px] [&_input:focus-visible]:[border-radius:0.5rem]",
  "city-timeline-ticks":
    "flex justify-between [margin-top:0.6rem] [font:10px_monospace] [opacity:0.55] [@media_(max-width:_639px)]:[&_>_span:nth-child(even)]:hidden",
  "timeline-legend":
    "flex flex-wrap justify-center [gap:0.75rem_1.25rem] [font-size:0.65rem] [&_>_span]:inline-flex [&_>_span]:items-center [&_>_span]:[gap:0.4rem] [&_i]:[width:0.5rem] [&_i]:[height:0.5rem] [&_i]:[border-radius:50%]",
  "timeline-day": "[background:var(--timeline-day)]",
  "timeline-evening": "[background:var(--timeline-evening)]",
  "timeline-night": "[background:var(--timeline-night)]",
  "site-shell":
    '[&_.text-primary-500]:[color:var(--site-accent-ink)] [&_.text-primary-400]:[color:var(--site-accent-ink)] [&_.text-primary-300]:[color:var(--site-accent-ink)] [&_[class*="hover:text-primary-"]:hover]:[color:var(--site-accent-ink)] [&_.photo-overlay-control]:[color:#ffbf00] [&_.hero-clock-menu_:is(a,_p)]:[color:var(--site-accent-ink)] [&_.hero-clock-meta]:[color:var(--site-accent-ink)] [&_.timezone-mode-switch_>_button:not([aria-pressed="true"])]:[color:var(--site-accent-ink)] [&_.hero-clock-hour]:[background:var(--site-accent-ink)] [&_.hero-clock-second]:[background:var(--site-accent-ink)] [&_.hero-clock-tick]:[background:var(--site-accent-ink)] [&_.hero-clock-center]:[background:var(--site-accent-ink)] [&_.hero-clock-face]:[border-color:color-mix(in_srgb,_var(--site-accent-ink)_65%,_transparent)] [&_:is(.country-card,_.clock-card,_.globe-panel)]:[box-shadow:var(--site-shadow)]',
  "site-setting-picker":
    'relative inline-grid [flex-shrink:0] place-items-center [width:2.5rem] [height:2.5rem] [border:1px_solid_color-mix(in_srgb,_var(--site-accent-ink)_25%,_transparent)] [border-radius:0.75rem] [background:var(--rl-neutral-50)] [color:var(--site-accent-ink)] [transition:background-color_180ms,_box-shadow_180ms] [&_>_span]:pointer-events-none cursor-pointer [&:hover]:[background:color-mix(in_srgb,_var(--site-accent-ink)_8%,_var(--rl-neutral-50))] [&:focus-within]:[outline:2px_solid_var(--site-accent-ink)] [&:focus-within]:[outline-offset:3px] [&[aria-expanded="true"]]:[background:color-mix(in_srgb,_var(--site-accent-ink)_10%,_var(--rl-neutral-50))] [&[aria-expanded="true"]]:[box-shadow:0_0_0_3px_color-mix(in_srgb,_var(--site-accent-ink)_8%,_transparent)]',
  "site-settings-menu":
    'fixed [inset:auto] [margin:0] [width:272px] [max-height:65vh] overflow-y-auto [overscroll-behavior:contain] [padding:0.5rem] [border:1px_solid_color-mix(in_srgb,_var(--site-accent-ink)_25%,_transparent)] [border-radius:1.1rem] [background:var(--rl-neutral-50)] [color:var(--rl-neutral-950)] [box-shadow:0_16px_48px_#0002,_inset_0_1px_0_color-mix(in_srgb,_var(--site-accent-ink)_10%,_transparent)] [font:inherit] [&:popover-open]:grid [&:popover-open]:[gap:0.2rem] [&:popover-open]:[animation:settings-reveal_160ms_ease-out] [&_>_button]:flex [&_>_button]:items-center [&_>_button]:[gap:0.75rem] [&_>_button]:[width:100%] [&_>_button]:[min-height:3.25rem] [&_>_button]:[padding:0.5rem_0.65rem] [&_>_button]:[border:0] [&_>_button]:[border-radius:0.7rem] [&_>_button]:[background:transparent] [&_>_button]:[color:inherit] [&_>_button]:text-start [&_>_button]:cursor-pointer [&_>_button]:[transition:background_160ms,_color_160ms] [&_>_button:is(:hover,_:focus-visible)]:[background:color-mix(in_srgb,_var(--site-accent-ink)_7%,_transparent)] [&_>_button:focus-visible]:[outline:2px_solid_var(--site-accent-ink)] [&_>_button:focus-visible]:[outline-offset:-2px] [&_>_button[aria-checked="true"]]:[color:var(--site-accent-ink)] [&_>_button[aria-checked="true"]]:[background:color-mix(in_srgb,_var(--site-accent-ink)_10%,_transparent)] [&_>_button[aria-checked="true"]]:[box-shadow:inset_2px_0_0_var(--site-accent-ink)] [@media_(prefers-reduced-motion:_reduce)]:[&:popover-open]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[&_>_button]:[transition:none]',
  "site-settings-title":
    "flex items-center [gap:0.5rem] [margin:0_0_0.3rem] [padding:0.6rem_0.55rem_0.8rem] [border-bottom:1px_solid_color-mix(in_srgb,_var(--site-accent-ink)_15%,_transparent)] [font-size:0.65rem] font-bold [letter-spacing:0.12em] [text-transform:uppercase] [color:var(--site-accent-ink)]",
  "site-settings-item-icon":
    "grid place-items-center [flex-shrink:0] [width:2.1rem] [height:2.1rem] [border-radius:0.6rem] [background:color-mix(in_srgb,_var(--site-accent-ink)_7%,_transparent)] [color:var(--site-accent-ink)] [&_img]:[border-radius:3px] [&_img]:[object-fit:cover]",
  "site-settings-item-copy":
    "grid [gap:0.15rem] [flex:1] [&_strong]:[font-size:0.8rem] [&_strong]:font-semibold [&_small]:[font-size:0.65rem] [&_small]:[opacity:0.6]",
  "site-graticule":
    'fixed [inset:0] [z-index:-1] overflow-hidden pointer-events-none [color:var(--site-background-ink,_var(--rl-primary-500))] [opacity:0.8] [background:radial-gradient(_ellipse_at_50%_40%,_color-mix(in_srgb,_var(--rl-primary-500)_6%,_transparent),_transparent_75%_)] [mask-image:radial-gradient(ellipse_at_center,_#0006_15%,_black_85%)] [&::before]:[content:""] [&::before]:absolute [&::before]:[inset:-20%] [&::before]:[background:radial-gradient(_ellipse_at_28%_38%,_color-mix(in_srgb,_var(--rl-primary-500)_5%,_transparent),_transparent_55%_)] [&::before]:[animation:atlas-aurora_38s_ease-in-out_infinite_alternate] [&_:is(path,_ellipse,_circle)]:[vector-effect:non-scaling-stroke] [&_:is(path,_ellipse,_circle)]:[stroke-width:1] [&_.atlas-light-tail]:[stroke-width:1.5] [&_svg]:absolute [&_svg]:[inset:-22vmax] [&_svg]:[width:calc(100%_+_44vmax)] [&_svg]:[height:calc(100%_+_44vmax)] [&_svg]:[transform:rotate(-8deg)] [&_svg]:[transform-origin:center] [@media_(prefers-reduced-motion:_reduce)]:[&_svg]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[&_svg]:[will-change:auto] [@media_(prefers-reduced-motion:_reduce)]:[&::before]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[&::before]:[will-change:auto]',
  "atlas-meridians": "[opacity:0.13]",
  "atlas-orbits": "[opacity:0.18]",
  "atlas-waypoints":
    "[opacity:0.25] [animation:atlas-beacons_12s_ease-in-out_infinite_alternate] [@media_(prefers-reduced-motion:_reduce)]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[will-change:auto]",
  "atlas-pulse-ring":
    "[transform-box:fill-box] [transform-origin:center] [animation:atlas-ripple_10s_ease-out_infinite] [&:nth-of-type(4)]:[animation-delay:-5s] [@media_(prefers-reduced-motion:_reduce)]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[will-change:auto]",
  "atlas-light-core":
    "[animation:atlas-light-shimmer_9s_ease-in-out_infinite] [@media_(prefers-reduced-motion:_reduce)]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[will-change:auto]",
  "atlas-scan-ring":
    "[transform-box:fill-box] [transform-origin:center] [opacity:0.45] [animation:atlas-scan_30s_linear_infinite] [@media_(prefers-reduced-motion:_reduce)]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[will-change:auto]",
  "atlas-scan-reverse": "[animation-direction:reverse] [animation-duration:44s]",
  "atlas-hud": "absolute [inset:0] pointer-events-none",
  "atlas-readout":
    "[font:10px/1.9_monospace] [letter-spacing:0.14em] [opacity:0.55] [&_small]:[font-size:7px] [&_small]:[letter-spacing:0.18em] [&_small]:[opacity:0.65] [@media_(max-width:_639px)]:[font-size:8px]",
  "atlas-readout-north": "absolute [left:clamp(1rem,_2vw,_2.5rem)] [top:22%]",
  "atlas-readout-east":
    "absolute [right:clamp(1rem,_2vw,_2.5rem)] [top:32%] [text-align:right] [@media_(max-width:_639px)]:hidden",
  "atlas-readout-south":
    "absolute [right:clamp(1rem,_2vw,_2.5rem)] [bottom:13%] [text-align:right] [@media_(max-width:_639px)]:hidden",
  "atlas-readout-dot":
    "inline-block [width:3px] [height:3px] [margin-right:7px] [border-radius:50%] [background:currentColor] [box-shadow:0_0_7px_currentColor]",
  "atlas-corner-station":
    "absolute [left:clamp(1rem,_2vw,_2.5rem)] [bottom:5%] grid [justify-items:start] [gap:0.8rem]",
  "atlas-compass":
    "relative [width:64px] [height:64px] [border:1px_solid_currentColor] [border-radius:50%] [opacity:0.25] [background:linear-gradient(transparent_calc(50%_-_0.5px),_currentColor_50%,_transparent_calc(50%_+_0.5px)),_linear-gradient(_90deg,_transparent_calc(50%_-_0.5px),_currentColor_50%,_transparent_calc(50%_+_0.5px)_)] [&_>_span]:absolute [&_>_span]:[top:-15px] [&_>_span]:[left:50%] [&_>_span]:[transform:translateX(-50%)] [&_>_span]:[font:8px_monospace] [&_>_i]:absolute [&_>_i]:[inset:8px] [&_>_i]:[border:1px_dashed_currentColor] [&_>_i]:[border-radius:50%] [&_>_i]:[animation:atlas-scan_90s_linear_infinite] [@media_(max-width:_639px)]:hidden [@media_(prefers-reduced-motion:_reduce)]:[&_>_i]:[animation:none]",
  "atlas-calibration":
    "[width:120px] [height:8px] [opacity:0.25] [border-bottom:1px_solid_currentColor] [background:repeating-linear-gradient(90deg,_currentColor_0_1px,_transparent_1px_10px)]",
  "atlas-route":
    "[animation:atlas-signal_60s_linear_infinite] [@media_(prefers-reduced-motion:_reduce)]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[will-change:auto]",
  "atlas-ambient":
    "[animation:atlas-breathe_24s_ease-in-out_infinite_alternate] [@media_(prefers-reduced-motion:_reduce)]:[animation:none] [@media_(prefers-reduced-motion:_reduce)]:[will-change:auto]",
  "atlas-traveller": "[@media_(prefers-reduced-motion:_reduce)]:hidden",
};
