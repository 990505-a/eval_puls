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

function lookup(text: string): string | undefined {
  const hit = DICT.get(text);
  return hit !== undefined && hit !== text ? hit : undefined;
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

  // 首屏存量内容
  translateElement(document.body);
}

export function stopDomTranslator(): void {
  observer?.disconnect();
  observer = null;
}
