import assert from 'node:assert/strict';
import test from 'node:test';
import { Registry, doc, index } from '../dist/index.js';

// 适用条件（白板稿 §2 v2）：单字段 whenToUse，一句话散文，声明不是逻辑；投影只在目录层，正文不隐藏任何块。
function whenRegistry() {
  return new Registry()
    .target('compare-goal', '目标：帮我在预算内挑一款口碑可靠的数码产品，给一份能直接下单的结论。')
    .useMethod('compare-steps', '动作：\n1. 定两个口碑来源。\n2. 滤广：纯宣传页不计。\n3. 结论落到具体型号。', '适用于价格公开可比、评价可查的实体商品比价')
    .example('laptop-one', '例子：笔记本比价——A 店标 4599 带 3 月日期；B 店标 4299 无日期不计。结论：A 店入手。', 'compare-steps');
}

test('W1：whenToUse 空串即红（注册期）', () => {
  const reg = new Registry();
  assert.throws(() => reg.useMethod('m1', '动作：x', ''), /whenToUse 为空串/);
});

test('whenToUse 已声明：index() 目录层输出"适用：…"', () => {
  const reg = whenRegistry();
  const toc = index(reg, [
    { target: 'compare-goal' },
    { useMethod: 'compare-steps' },
    { example: 'laptop-one' },
  ]);
  assert.ok(toc.includes('适用：适用于价格公开可比、评价可查的实体商品比价'));
  assert.ok(toc.includes('- target compare-goal：'));
  assert.ok(toc.includes('- example laptop-one'));
});

test('whenToUse 未声明：index() 不输出适用行（getWhenToUse 返回 undefined）', () => {
  const reg = new Registry().useMethod('m1', '动作：x');
  assert.equal(reg.getWhenToUse('m1'), undefined);
  const toc = index(reg, [{ useMethod: 'm1' }]);
  assert.ok(toc.includes('- useMethod m1'));
  assert.ok(!toc.includes('适用：'));
});

test('getWhenToUse：id 缺席即抛错', () => {
  const reg = new Registry();
  assert.throws(() => reg.getWhenToUse('nope'), /未定义的 useMethod/);
});

test('doc() 正文不受 whenToUse 影响：块不隐藏、文字不改', () => {
  const reg = whenRegistry();
  const md = doc(reg, [
    { target: 'compare-goal' },
    { useMethod: 'compare-steps' },
    { example: 'laptop-one' },
  ]);
  assert.ok(md.includes('滤广：纯宣传页不计'));
  assert.ok(!md.includes('适用：'));
});
