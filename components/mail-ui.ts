import { defineComponent, h, type PropType } from "vue";
import { FR_STRINGS } from "~/lib/i18n";

const s = {
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "square",
  "stroke-linejoin": "miter",
} as const;

function svg(paths: string[], attrs: Record<string, unknown> = {}) {
  return defineComponent({
    name: "SvgIcon",
    render() {
      return h(
        "svg",
        { width: 18, height: 18, viewBox: "0 0 24 24", ...s, ...attrs },
        paths.map((d) =>
          d.startsWith("<") ? h("g", { innerHTML: d }) : h("path", { d }),
        ),
      );
    },
  });
}

export const MenuIcon = svg(["M3 6h18M3 12h18M3 18h18"]);
export const SearchIcon = svg(["<circle cx=\"11\" cy=\"11\" r=\"7\" /><path d=\"m20 20-3.5-3.5\" />"]);
export const FilterIcon = svg(["M3 5h18M6 12h12M10 19h4"]);
export const PencilIcon = svg(["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"]);
export const PlusIcon = svg(["M12 5v14M5 12h14"]);
export const StarIcon = svg(["m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.8l6.5-.9z"]);
export const StarFilledIcon = svg(["m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.8l6.5-.9z"], {
  fill: "#000000",
  stroke: "#000000",
  "stroke-width": 1,
  class: "star-filled",
});
export const TrashIcon = svg(["M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"]);
export const SpamIcon = svg(["M12 2 2 20h20z", "M12 9v5M12 17h.01"]);
export const FolderIcon = svg(["M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"]);
export const InboxIcon = svg(
  ["M3 12h5l2 3h4l2-3h5", "M5 5h14l2 7v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"],
  { width: 72, height: 72, class: "text-neutral-300" },
);
export const PaperclipIcon = svg(["M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7"], {
  width: 16,
  height: 16,
});
export const ReplyIcon = svg(["M9 10 4 15l5 5", "M4 15h9a7 7 0 0 0 7-7V6"]);
export const CloseIcon = svg(["M6 6l12 12M18 6 6 18"]);
export const ExpandIcon = svg(["M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"]);
export const ShrinkIcon = svg(["M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5"]);
export const ClockIcon = svg(["<circle cx=\"12\" cy=\"12\" r=\"9\" /><path d=\"M12 7v5l3.5 2\" />"]);
export const ReloadIcon = svg(["M21 4v6h-6", "M3 20v-6h6", "M20.5 10a8.5 8.5 0 0 0-14.8-3.4L3 9", "M3.5 14a8.5 8.5 0 0 0 14.8 3.4L21 15"]);
export const RestoreIcon = svg(["M9 14 4 9l5-5", "M4 9h10a6 6 0 0 1 0 12h-3"]);

export const BoxIcon = defineComponent({
  name: "BoxIcon",
  props: { kind: { type: String, required: true } },
  render() {
    const kind = this.kind as string;
    const paths: Record<string, string[]> = {
      "\\Sent": ["m22 2-7 20-4-9-9-4z"],
      "\\Drafts": ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"],
      "\\Junk": ["M12 9v4M12 17h.01", "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"],
      "\\Trash": ["M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", "M10 11v5M14 11v5"],
      "\\Archive": ["M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4", "<rect x=\"3\" y=\"4\" width=\"18\" height=\"4\" />"],
    };
    const d = paths[kind] ?? [
      "M22 12h-6l-2 3h-4l-2-3H2",
      "M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z",
    ];
    return h(
      "svg",
      { width: 18, height: 18, viewBox: "0 0 24 24", ...s },
      d.map((p) => (p.startsWith("<") ? h("g", { innerHTML: p }) : h("path", { d: p }))),
    );
  },
});

export const MailOpenIcon = defineComponent({
  name: "MailOpenIcon",
  props: { seen: { type: Boolean, required: true } },
  render() {
    const paths = this.seen
      ? ["<rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" />", "m3 7 9 6 9-6"]
      : ["M21 8.5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9", "m3 7 9 6 4.5-3", "M19 3v6M16 6h6"];
    return h(
      "svg",
      { width: 18, height: 18, viewBox: "0 0 24 24", ...s },
      paths.map((p) => (p.startsWith("<") ? h("g", { innerHTML: p }) : h("path", { d: p }))),
    );
  },
});

export const EyeIcon = svg(["M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z", "<circle cx=\"12\" cy=\"12\" r=\"2.5\" />"]);
export const EyeClosedIcon = svg([
  "M4 4l16 16",
  "M10.6 6.2A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.7",
  "M6.6 6.6C4 8.3 2 12 2 12s3.5 6 10 6c1.5 0 2.9-.3 4.1-.8",
]);

const AVATAR_COLORS = ["#000000"];

function avatarColor(seed: string): [string, number] {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  const i = hash % AVATAR_COLORS.length;
  return [AVATAR_COLORS[i]!, i];
}

export const Avatar = defineComponent({
  name: "Avatar",
  props: { name: { type: String, required: true }, size: { type: Number, default: 32 } },
  render() {
    const name = this.name as string;
    const size = this.size as number;
    const initial = (name.match(/[A-Za-zÀ-ÿ]/) ?? ["?"])[0].toUpperCase();
    const [bg, shade] = avatarColor(name);
    return h(
      "span",
      {
        "aria-hidden": true,
        "data-shade": shade,
        class: "avatar flex shrink-0 items-center justify-center rounded-full font-medium text-white",
        style: { width: size + "px", height: size + "px", background: bg, fontSize: size * 0.45 + "px" },
      },
      initial,
    );
  },
});

export const Badge = defineComponent({
  name: "Badge",
  props: { count: { type: Number, required: true }, floating: { type: Boolean, default: false } },
  render() {
    return h(
      "span",
      {
        class: (this.floating ? "absolute left-9 top-1 " : "") + "inline-flex min-w-4 items-center justify-center border border-neutral-300 px-1.5 py-0.5 text-[11px] font-medium leading-none",
        style: { fontVariantNumeric: "tabular-nums" },
      },
      String(this.count),
    );
  },
});

export const IconBtn = defineComponent({
  name: "IconBtn",
  props: { label: { type: String, required: true }, onClick: { type: Function as PropType<() => void>, required: true } },
  render() {
    return h(
      "button",
      {
        onClick: (e: Event) => {
          e.stopPropagation();
          (this.onClick as () => void)();
        },
        title: this.label,
        "aria-label": this.label,
        class: "cursor-pointer rounded-full p-2 text-black hover:bg-neutral-100",
      },
      this.$slots.default?.(),
    );
  },
});

export const CheckboxAll = defineComponent({
  name: "CheckboxAll",
  props: {
    count: { type: Number, required: true },
    checkedCount: { type: Number, required: true },
    onToggle: { type: Function as PropType<() => void>, required: true },
    label: { type: String, default: FR_STRINGS.selectAll },
  },
  render() {
    const state = this.count > 0 && this.checkedCount === this.count ? true : this.checkedCount > 0 ? "mixed" : false;
    return h("input", {
      type: "checkbox",
      "aria-label": this.label as string,
      checked: state === true,
      ref: (el: unknown) => {
        if (el && typeof el === "object") (el as HTMLInputElement).indeterminate = state === "mixed";
      },
      onChange: this.onToggle,
      class: "wm-check",
    });
  },
});
