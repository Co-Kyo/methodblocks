import assert from 'node:assert/strict';
import test from 'node:test';
import { Registry, doc } from '../dist/index.js';

// 母版/实例对齐（白板稿 §1 v2）：母版写一遍，实例对齐母版、一字不抄；core 只校验，不改一字。
function masterRegistry() {
  return new Registry()
    .target('compare-goal', '目标：帮我在预算内挑一款口碑可靠的数码产品，给一份能直接下单的结论。')
    .useMethod(
      'compare-steps',
      '动作：\n1. 定两个口碑来源：一个比价站、一个真实用户评价区。\n2. 每处找三条带价格带日期的记录。\n3. 滤广：纯宣传页不计。\n4. 同型号跨来源比价，差价超两成标记存疑。\n5. 结论落到具体型号＋价格区间。',
    )
    .example('laptop-one', '例子：笔记本比价——A 店 i5/16G 标 4599 带 3 月购买日期；B 店同配置标 4299 但只有宣传语无日期，不采信。结论：A 店 4599 入手。', 'compare-steps')
    .example('monitor-one', '例子：显示器比价——比价站 27 寸 4K 三条：X 标 1899 带 6 月日期，Y 标 1750 无日期不计，Z 标 2100 现货。结论：X 1899 值。', 'compare-steps');
}

test('对齐：一块母版＋两实例正常拼装（一对多合法）', () => {
  const md = doc(masterRegistry(), [
    { target: 'compare-goal' },
    { useMethod: 'compare-steps' },
    { example: 'laptop-one' },
    { example: 'monitor-one' },
  ]);
  assert.ok(md.includes('4599'));
  assert.ok(md.includes('1899'));
  assert.ok(md.includes('滤广：纯宣传页不计'));
});

test('对齐：注册顺序无关（example 先于母版注册也能拼装）', () => {
  const reg = new Registry()
    .example('e1', '例子：笔记本 4599 带 3 月日期。', 'm1')
    .useMethod('m1', '动作：查三家带日期的记录，比价给结论。');
  const md = doc(reg, [{ useMethod: 'm1' }, { example: 'e1' }]);
  assert.ok(md.includes('4599'));
});

test('M1：实例对齐缺席的母版即红', () => {
  const reg = new Registry().example('e1', '例子：x 的比价记录。', 'no-such-master');
  assert.throws(() => doc(reg, [{ example: 'e1' }]), /未定义的 useMethod/);
});

test('M2：实例复制母版文字即红（一字不抄）', () => {
  const reg = new Registry()
    .useMethod('m1', '动作：第一步查三家，第二步比日期。')
    .example('e1', '例子：动作：第一步查三家，第二步比日期。', 'm1');
  assert.throws(() => doc(reg, [{ useMethod: 'm1' }, { example: 'e1' }]), /互相包含/);
});

test('M2：母版包含实例文字同样即红（双向互不包含）', () => {
  const reg = new Registry()
    .useMethod('m1', '动作：第一步查三家，第二步比日期。例子：笔记本 4599 带 3 月日期。')
    .example('e1', '例子：笔记本 4599 带 3 月日期。', 'm1');
  assert.throws(() => doc(reg, [{ useMethod: 'm1' }, { example: 'e1' }]), /互相包含/);
});

test('M3：实例对齐的母版未进文档即红（母版必须真引用）', () => {
  const reg = new Registry()
    .useMethod('m1', '动作：第一步查三家带日期的记录。')
    .example('e1', '例子：笔记本 4599 带 3 月日期。', 'm1');
  assert.throws(() => doc(reg, [{ example: 'e1' }]), /未进入文档/);
});

test('M4：重复 id 即红（沿用，注册期即抛）', () => {
  const reg = new Registry().example('e1', 'a');
  assert.throws(() => reg.example('e1', 'b'), /已存在/);
});
