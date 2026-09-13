import { Registry, doc, index, pack } from '../dist/index.js';

// 演示：一块母版＋两块实例（对齐不复制）＋whenToUse＋Agent Skills 打包。
// 引用关系：两实例各对齐母版 compare-steps（一字不抄，构建期红）；母版带 whenToUse 适用条件。
export function compareNetRegistry(): Registry {
  return new Registry()
    .target('compare-goal', '目标：帮我在预算内挑一款口碑可靠的数码产品，给一份能直接下单的结论。')
    .useMethod(
      'compare-steps',
      '动作：\n1. 定两个口碑来源：一个比价站、一个真实用户评价区。\n2. 每处找三条带价格带日期的记录。\n3. 滤广：纯宣传页不计。\n4. 同型号跨来源比价，差价超两成标记存疑。\n5. 结论落到具体型号＋价格区间＋取舍理由。',
      '适用于价格公开可比、评价可查的实体商品比价',
    )
    .example('laptop-compare', '例子：笔记本比价——A 店 i5/16G 标 4599 带 3 月购买日期；B 店同配置标 4299 但页面只有宣传语无日期，不采信。结论：A 店 4599 入手，标价与口碑都更实。', 'compare-steps')
    .example('monitor-compare', '例子：显示器比价——比价站 27 寸 4K 三条：X 标 1899 带 6 月日期，Y 标 1750 无日期不计，Z 标 2100 有现货。结论：X 1899 值；急用且预算松可看 Z。', 'compare-steps');
}

export function compareNetDoc(): string {
  return doc(compareNetRegistry(), [
    { target: 'compare-goal' },
    { useMethod: 'compare-steps' },
    { example: 'laptop-compare' },
    { example: 'monitor-compare' },
  ]);
}

export function compareNetIndex(): string {
  return index(compareNetRegistry(), [
    { target: 'compare-goal' },
    { useMethod: 'compare-steps' },
    { example: 'laptop-compare' },
    { example: 'monitor-compare' },
  ]);
}

export function compareNetSkill(): { 'SKILL.md': string; references: Record<string, string> } {
  return pack(compareNetRegistry(), [
    { target: 'compare-goal' },
    { useMethod: 'compare-steps' },
    { example: 'laptop-compare' },
    { example: 'monitor-compare' },
  ], { name: 'compare-net' });
}
