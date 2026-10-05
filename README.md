# methodblocks

**methodblocks 是一个「给文字片段起名字、再按名字组装成文档」的库。**

它解决一个具体问题：同一套方法论文字要出现在多份文档里，复制粘贴会越改越散。methodblocks 让你把每段文字注册一个 id，文档里只写 id 列表，组装时按 id 取回文字——改一处，所有引用它的文档一起更新；id 写错，组装当场报错。

一句话机制：`Registry` 存 id→文字，`doc()` 按 id 顺序取字拼接。

## 30 秒上手

```ts
import { Registry, doc } from 'methodblocks';

// 1. 注册文字片段（每段一个 id）
const reg = new Registry()
  .target('goal', '目标：预算内选一款口碑可靠的数码产品，给出可直接下单的结论。')
  .useMethod('steps', '动作：\n1. 定两个口碑来源。\n2. 滤掉纯宣传页。');

// 2. 用 id 列表声明一篇文档的段落顺序，拼出正文
console.log(doc(reg, [{ target: 'goal' }, { useMethod: 'steps' }]));
// → 目标：… ＋ 动作：…（两段文字按序拼成一篇）
```

id 写错（如 `rule-A` vs `rule-a`）→ `doc()` 当场报 `未定义的 useMethod: rule-A`。

## 它管什么、不管什么

| | 归属 |
|---|---|
| 文字片段的命名、复用、按 id 拼装成文档 | **methodblocks**（本库，内存查表） |
| 目标的可判定化：target＋判据（evidence），无判据的目标体检报错 | methodblocks |
| 磁盘上的文件路径是否断链（引用目标是否存在） | [markrefs](https://github.com/Co-Kyo/markrefs)（文件存在性校验） |

与 skillnomad 组合的方式见其 `docs/guide/toolchain.md`；单独使用不受影响。

## 全部 API

- **`Registry`** — `target(id, text)` / `useMethod(id, text, whenToUse?)` / `example(id, text, master?)` / `evidence(id, kind, text, targetId)`：注册文字片段；id 重复即抛
- **`doc(reg, parts)`** — 按 parts 顺序取字拼接，返回 markdown 字符串；id 未注册即抛
- **`index(reg, parts)`** — 输出目录（id＋一句话摘要），供渐进披露
- **`pack(reg, parts, skill, options?)`** — 按 [Agent Skills](https://agentskills.io) 规范打包（SKILL.md＋references/）
- **`check(reg, { body, references? })`** — 返回结构化诊断（引用缺席／实例与母版互相包含／母版未进正文／同块双发布，四个稳定码；最后一个仅在使用 `references` 分层时检查）
- **`inspectTargetShape({ targets, evidences })`** — 目标/判据形状体检：无判据的目标（口号）、判据挂到不存在的目标（悬空）等四类，返回 `ShapeNote[]`
- **`groupEvidences({ targets, evidences })`** — 判据按目标归组（渲染"目标下挂判据"时用）

## 范围声明

methodblocks 不做通用 markdown 工具，不做文件级校验，不做编排与运行时。

## 测试

```bash
npm test   # node --test，38/38
```

## License

MIT
