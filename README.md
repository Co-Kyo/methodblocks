# methodblocks

把方法论做成积木：**面向执行的 markdown 积木化**。

- **method**＝方法：一套"怎么写可执行文档"的写法——目标（what）／动作（how）／例，再加四条判据（引用即文字、缺席即红、只准举例、不许更复杂）。
- **blocks**＝一块块有名字的积木：精心写的文字给名字，引用名字即引用文字；写错名字，构建即红。

范围声明：methodblocks 不做通用 markdown 工具。

## 速览

- 三部件＋`Registry`（id→文字；重复 id 即红、引用缺席即红）
- `doc(reg, parts)`：按引用顺序拼成一篇 agent 能照着做的文档
- 母版/实例对齐：example 声明 `master`，构建期保证"一字不抄、母版真进产物"
- `whenToUse`：一句话适用条件（只在目录层投影）
- `index()` / `pack()`：目录层＋按 [Agent Skills](https://agentskills.io) 开放规范打包（SKILL.md＋references/）

## 用法

```ts
import { Registry, doc } from 'methodblocks';

const reg = new Registry()
  .target('goal', '目标：帮我在预算内挑一款口碑可靠的数码产品，给一份能直接下单的结论。')
  .useMethod('steps', '动作：\n1. 定两个口碑来源。\n2. 滤广：纯宣传页不计。', '适用于价格公开可比的商品比价')
  .example('laptop', '例子：A 店标 4599 带 3 月日期；B 店无日期不计。结论：A 店入手。', 'steps');

console.log(doc(reg, [{ target: 'goal' }, { useMethod: 'steps' }, { example: 'laptop' }]));
```

## 测试

```bash
npm test   # node --test，18/18
```

## License

MIT
