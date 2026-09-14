/**
 * DOM 自动翻译层：对未被 t() 包裹的界面文案做兜底翻译。
 *
 * 原理：在 locale=zh-CN 时监听 DOM，把与词典精确匹配的文本节点/
 * placeholder/title/aria-label 替换为中文；React 重渲染把文案刷回英文时，
 * MutationObserver 会再次替换。切换回英文时整页 reload（见 provider），
 * 避免残留。
 *
 * 安全边界：
 * - 只做「整段精确匹配」，不做部分替换 → 用户数据几乎不可能误伤
 * - 跳过代码/编辑器/输入控件子树（monaco、CodeMirror、pre/code、contenteditable）
 * - 仅处理文本节点与属性，不碰 value
 */
import { zhCN } from "@/src/i18n/zh-CN";
import { autoZhCN } from "@/src/i18n/auto-zh-CN";

const DICT: Map<string, string> = new Map<string, string>([
  ...Object.entries(zhCN),
  ...Object.entries(autoZhCN),
]);

// 大小写不同但内容一致的文案（"Search Projects" vs "Search projects"）常同时存在。
// 只对足够长、且含空格的键建立小写索引，避免把 "Run"/"Start" 这类单词误匹配到用户数据。
const DICT_LOWER: Map<string, string> = new Map<string, string>(
  [...DICT.entries()]
    .filter(([key]) => key.length >= 12 && key.includes(" "))
    .map(([key, value]) => [key.toLowerCase(), value]),
);

const TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label", "alt"];

// 整个子树跳过（代码/数据展示/富文本编辑区）
const SKIP_SUBTREE_SELECTOR = [
  "pre",
  "code",
  "script",
  "style",
  "textarea",
  "select",
  ".monaco-editor",
  ".cm-editor",
  ".json-view",
  '[contenteditable="true"]',
  "[data-no-i18n]",
].join(",");

// 元素本身跳过子节点遍历，但属性仍处理（如 input 的 placeholder）
const LEAF_ONLY_TAGS = new Set(["INPUT", "IMG", "BR", "HR", "SVG", "PATH", "CANVAS", "VIDEO", "AUDIO"]);

// 页面标题形如 "<页面名> | Langfuse"，正文里常有一份用于无障碍的同名文本，
// 浏览器标签页也用它。整串匹配失败时退一步翻译竖线前的部分。
const TITLE_SUFFIX = /\s*\|\s*Langfuse$/;

function lookup(text: string): string | undefined {
  const hit = DICT.get(text) ?? DICT_LOWER.get(text.toLowerCase());
  if (hit !== undefined && hit !== text) return hit;
  if (TITLE_SUFFIX.test(text)) {
    const head = text.replace(TITLE_SUFFIX, "");
    const inner = DICT.get(head) ?? DICT_LOWER.get(head.toLowerCase());
    if (inner !== undefined) return inner + " | Langfuse";
  }
  return undefined;
}

function translateTextNode(node: Text): void {
  const raw = node.nodeValue;
  if (!raw) return;
  const trimmed = raw.trim();
  if (!trimmed) return;
  const hit = lookup(trimmed);
  if (hit === undefined) return;
  // 保留原有首尾空白，避免影响内联排版
  node.nodeValue = raw.replace(trimmed, hit);
}

function translateAttributes(el: Element): void {
  for (const attr of TRANSLATABLE_ATTRS) {
    const value = el.getAttribute(attr);
    if (!value) continue;
    const hit = lookup(value.trim());
    if (hit !== undefined) el.setAttribute(attr, hit);
  }
}

function translateElement(el: Element): void {
  if (el.matches(SKIP_SUBTREE_SELECTOR)) return;
  translateAttributes(el);
  if (LEAF_ONLY_TAGS.has(el.tagName)) return;
  for (let child = el.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === Node.TEXT_NODE) {
      translateTextNode(child as Text);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      translateElement(child as Element);
    }
  }
}

let observer: MutationObserver | null = null;
let titleObserver: MutationObserver | null = null;

// 路由切换时 next/head 会替换 <title>，body 观察不到，单独盯 head。
function translateTitle(): void {
  const raw = document.title;
  if (!raw) return;
  const hit = lookup(raw);
  if (hit !== undefined) document.title = hit;
}

export function startDomTranslator(): void {
  if (observer || typeof window === "undefined" || !document.body) return;

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        translateTextNode(mutation.target as Text);
      } else if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(node as Text);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            translateElement(node as Element);
          }
        });
      } else if (mutation.type === "attributes") {
        translateAttributes(mutation.target as Element);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: TRANSLATABLE_ATTRS,
  });

  titleObserver = new MutationObserver(translateTitle);
  titleObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
  translateTitle();

  // 首屏存量内容
  translateElement(document.body);
}

export function stopDomTranslator(): void {
  observer?.disconnect();
  observer = null;
  titleObserver?.disconnect();
  titleObserver = null;
}
