import assert from 'node:assert/strict';
import test from 'node:test';
import { Registry, pack } from '../dist/index.js';

// 打包（白板稿 §3 v2）：SKILL.md＝frontmatter＋目录＋正文，references/ 逐块文件；契约 P1–P5。
function reg() {
  return new Registry()
    .target('compare-goal', '目标：帮我在预算内挑一款口碑可靠的数码产品，给一份能直接下单的结论。')
    .useMethod('compare-steps', '动作：\n1. 定两个口碑来源。\n2. 滤广：纯宣传页不计。\n3. 结论落到具体型号。', '适用于价格公开可比、评价可查的实体商品比价')
    .example('laptop-one', '例子：笔记本比价——A 店标 4599 带 3 月日期；B 店标 4299 无日期不计。结论：A 店入手。', 'compare-steps');
}
const parts = [
  { target: 'compare-goal' },
  { useMethod: 'compare-steps' },
  { example: 'laptop-one' },
];

test('P5：产物结构——frontmatter、目录、正文、references kebab-case', () => {
  const out = pack(reg(), parts, { name: 'compare-net' });
  const sk = out['SKILL.md'];
  assert.ok(sk.startsWith('---\nname: compare-net\ndescription: "'));
  assert.ok(sk.includes('description: "目标：帮我在预算内挑一款口碑可靠的数码产品，给一份能直接下单的结论。"'));
  assert.ok(sk.includes('# 目录'));
  assert.ok(sk.includes('- useMethod compare-steps（适用：适用于价格公开可比、评价可查的实体商品比价）'));
  assert.ok(sk.includes('# 正文'));
  assert.ok(sk.includes('4599'));
  assert.deepEqual(Object.keys(out.references).sort(), [
    'references/example-laptop-one.md',
    'references/target-compare-goal.md',
    'references/use-method-compare-steps.md',
  ]);
  assert.ok(out.references['references/example-laptop-one.md'].includes('4599'));
});

test('P1：name 不合规范即红（大写／连续连字符／连字符开头结尾／超 64）', () => {
  const r = reg();
  assert.throws(() => pack(r, parts, { name: 'Compare-Net' }), /不合 Agent Skills 规范/);
  assert.throws(() => pack(r, parts, { name: 'compare--net' }), /不合 Agent Skills 规范/);
  assert.throws(() => pack(r, parts, { name: '-compare' }), /不合 Agent Skills 规范/);
  assert.throws(() => pack(r, parts, { name: 'compare-' }), /不合 Agent Skills 规范/);
  assert.throws(() => pack(r, parts, { name: 'a'.repeat(65) }), /不合 Agent Skills 规范/);
});

test('P2：description 显式覆盖缺省；显式空串即红；无 target 且缺 description 即红', () => {
  const out = pack(reg(), parts, { name: 'compare-net', description: '比价技能：先看 when to use，再照动作做。' });
  assert.ok(out['SKILL.md'].includes('description: "比价技能：先看 when to use，再照动作做。"'));
  assert.throws(() => pack(reg(), parts, { name: 'compare-net', description: '' }), /description 为空串/);
  assert.throws(
    () => pack(new Registry().useMethod('m1', '动作：x'), [{ useMethod: 'm1' }], { name: 'x1' }),
    /缺 description 且 parts 中没有 target/,
  );
});

test('P3：引用缺席即红（沿用）', () => {
  const r = new Registry().target('t1', '目标：x。');
  assert.throws(() => pack(r, [{ target: 'nope' }], { name: 'x1' }), /未定义的 target/);
});

test('P4：SKILL.md 超 500 行即红', () => {
  const r = new Registry();
  const partsBig = [];
  for (let i = 0; i < 260; i++) {
    r.target(`t${i}`, `目标：第 ${i} 行的长文内容，用来撑行数。`);
    partsBig.push({ target: `t${i}` });
  }
  assert.throws(() => pack(r, partsBig, { name: 'x1' }), /500 行上限/);
});

test('P2/M2：打包同样触发母版对齐校验（一字不抄）', () => {
  const r = new Registry()
    .useMethod('m1', '动作：第一步查三家，第二步比日期。')
    .example('e1', '例子：动作：第一步查三家，第二步比日期。', 'm1');
  assert.throws(
    () => pack(r, [{ useMethod: 'm1' }, { example: 'e1' }], { name: 'x1', description: '比价技能测试用。' }),
    /互相包含/,
  );
});
