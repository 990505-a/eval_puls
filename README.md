# eval_puls — Langfuse 中文增强版（DeepEval × Langfuse 智能体测评栈）

基于 [langfuse/langfuse](https://github.com/langfuse/langfuse) **v3.225.4** 的增强 fork（上游原 README 见 [UPSTREAM_README.md](./UPSTREAM_README.md)）：

- 🇨🇳 **Web 界面中英文切换**（原版仅英文）：侧边栏导航、页面标题、
  标签页、面包屑、全部分析表格的列头、筛选工具栏均已汉化，
  未覆盖文案自动回退英文，不影响功能。
- 🔗 **DeepEval 集成**（`integrations/deepeval-langfuse/`）：DeepEval 出指标、
  Langfuse 出轨迹与看板，组合开源替代 Confident AI。

> Confident AI（Langfuse 官方云平台）的仪表盘/轨迹回放/团队协作是闭源 SaaS；
> 本项目走「Langfuse 自托管 + 中文化 + DeepEval 指标引擎」的私有化路线。

## 一、中文界面构建与部署

### 构建镜像

```bash
git clone https://github.com/990505-a/eval_puls.git
cd eval_puls
docker build -f web/Dockerfile -t langfuse/langfuse:3.225.4-zh \
  --build-arg http_proxy= --build-arg https_proxy= \
  --build-arg HTTP_PROXY= --build-arg HTTPS_PROXY= .
```

> `--build-arg xxx=` 用于清空 Docker Desktop 注入的本地代理，
> 无代理环境可去掉；Apple Silicon 原生 arm64 构建即可。

### 替换现有部署（docker-compose）

以 eval-platform 的 compose 为例，只换 web 镜像，其余组件（worker /
postgres / clickhouse / minio / redis）与数据卷完全不动：

```yaml
langfuse-web:
  image: langfuse/langfuse:3.225.4-zh   # 原为 docker.io/langfuse/langfuse:3
  # 其余配置保持不变
```

```bash
docker compose --profile langfuse up -d langfuse-web
```

### 切换语言

登录后点左下角**头像 → Language（语言）→ 中 / EN**。
选择存于浏览器 localStorage，刷新后保持；首次访问按浏览器语言自动选择。

## 二、i18n 实现说明（二次开发必读）

设计原则：**英文原文即 key，中文走字典，未翻译自动回退英文。**

两层机制：

1. **t() 包裹层**（精确）：咽喉组件里显式 `t("English")`，
   覆盖侧边栏/页面标题/表格列头/筛选工具栏等。
2. **DOM 兜底层**（广覆盖）：locale=zh-CN 时 `i18n/dom-translator.ts`
   监听 DOM，把与词典精确匹配的文本节点/placeholder/title/aria-label
   替换为中文；React 重渲染刷回英文时自动再次替换。
   于是**任意未包裹的页面、弹窗、动态表格都能翻译**——词典里有多少
   词条就有多少覆盖，无需改组件代码。跳代码编辑器（monaco/codemirror/
   pre/code）与可编辑区，纯精确匹配不误伤用户数据。

| 文件 | 作用 |
|---|---|
| `web/src/i18n/config.ts` | locale 定义、存储 key |
| `web/src/i18n/provider.tsx` | `I18nProvider`（挂载于 `pages/_app.tsx` 最外层）、`useI18n()` |
| `web/src/i18n/zh-CN.ts` | 人工精校词典（导航/表头等） |
| `web/src/i18n/auto-zh-CN.ts` | 批量补充词典（源码抽取＋翻译，持续扩充） |
| `web/src/i18n/dom-translator.ts` | DOM 兜底翻译层 |
| `web/src/components/nav/language-toggle.tsx` | 用户菜单里的语言切换器 |

### 补充翻译（两种方式，都不用重建镜像）

- **加词条**：往 `auto-zh-CN.ts` 加一行 `"English原文": "中文"`，
  重新构建镜像即可生效——**不需要碰任何组件代码**（DOM 层自动生效）。
- **精确包裹**（可选）：在组件里 `const { t } = useI18n();` 后用 `{t("English")}`。

### 同步上游

```bash
git remote add upstream https://github.com/langfuse/langfuse.git
git fetch upstream --tags
git merge upstream/main   # 冲突一般只在上述咽喉文件，量很小
```

## 三、DeepEval × Langfuse 评估集成

见 [`integrations/deepeval-langfuse/README.md`](./integrations/deepeval-langfuse/README.md)。
核心流程：被测 agent 用 `@observe` 打轨迹 → DeepEval 指标（相关性/
忠实度/GEval 自定义）→ 分数与评判理由写回同一条轨迹，在 Langfuse UI
的轨迹详情页直接查看，等价于 Confident AI 的「轨迹 + 评估」体验。

## 四、版本对应

| 组件 | 版本 |
|---|---|
| 上游基线 | langfuse v3.225.4（`ed58b88e`） |
| worker 等其余组件 | 官方镜像 `langfuse/langfuse-worker:3` 不变即可 |

## License

上游 Apache 2.0，本 fork 保持一致。
