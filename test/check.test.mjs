import assert from 'node:assert/strict';
import test from 'node:test';
import { Registry, check, doc, pack } from '../dist/index.js';

// check()：结构化校验入口。判据与 doc()/pack() 共用同一批函数——
// 同一处红，两条路都出；抛错文案与次序逐字不变（本文件含 parity 断言）。

function reg() {
  return new Registry()
    .target('goal', '目标：把这件事按方法做完，给出可复核的结论。')
    .useMethod('steps', '动作：\n1. 先定两个口径。\n2. 再取三处证据。\n3. 结论落到具体条目。', '适用于可公开对照的场景')
    .example('sample', '例子：上次那单——A 处 3 分钟、B 处 5 分钟；结论取 A。', 'steps');
}
const cleanBody = [{ target: 'goal' }, { useMethod: 'steps' }, { example: 'sample' }];

test('正例：干净注册表 → 无诊断（含 references 分层合法）', () => {
  assert.deepEqual(check(reg(), { body: cleanBody }), []);
  assert.deepEqual(check(reg(), { body: [{ target: 'goal' }], references: [{ useMethod: 'steps' }, { example: 'sample' }] }), []);
});

test('missing-ref（body）：引用缺席给码，且与 doc() 抛错文案一致', () => {
  const r = reg();
  const diags = check(r, { body: [{ target: 'nope' }] });
  assert.equal(diags.length, 1);
  assert.equal(diags[0].code, 'missing-ref');
  assert.equal(diags[0].target, 'nope');
  assert.throws(() => doc(r, [{ target: 'nope' }]), (e) => e.message === diags[0].message);
});

test('example-mutual-inclusion：实例与母版互相包含', () => {
  const r = new Registry()
    .useMethod('steps', '动作：\n1. 第一步。\n2. 第二步。')
    .example('bad', '动作：\n1. 第一步。\n2. 第二步。另外还有一句。', 'steps');
  const body = [{ useMethod: 'steps' }, { example: 'bad' }];
  const diags = check(r, { body });
  assert.equal(diags.length, 1);
  assert.equal(diags[0].code, 'example-mutual-inclusion');
  assert.equal(diags[0].target, 'bad');
  assert.throws(() => doc(r, body), (e) => e.message === diags[0].message);
});

test('master-not-in-body：母版未进组装正文', () => {
  const r = reg();
  const body = [{ example: 'sample' }];
  const diags = check(r, { body });
  assert.equal(diags.length, 1);
  assert.equal(diags[0].code, 'master-not-in-body');
  assert.throws(() => doc(r, body), (e) => e.message === diags[0].message);
});

test('missing-ref（母版）：实例对齐的母版 id 不存在', () => {
  const r = new Registry().example('e1', '例子：一句。', 'no-such-master');
  const diags = check(r, { body: [{ useMethod: 'no-such-master' }, { example: 'e1' }] });
  assert.equal(diags.length, 1); // 对齐相位与逐块取字各命中一次 → 去重合计一条
  assert.equal(diags[0].code, 'missing-ref');
  assert.equal(diags[0].target, 'no-such-master');
  assert.throws(() => doc(r, [{ useMethod: 'no-such-master' }, { example: 'e1' }]), (e) => e.message === diags[0].message);
});

test('double-publish：同块既在正文又进 references（须传 references 才判）', () => {
  const r = reg();
  const body = cleanBody;
  const references = [{ target: 'goal' }];
  const diags = check(r, { body, references });
  assert.equal(diags.length, 1);
  assert.equal(diags[0].code, 'double-publish');
  assert.equal(diags[0].target, 'goal');
  assert.throws(() => pack(r, body, { name: 'x' }, { references }), (e) => e.message === diags[0].message);
  // 缺省 references 时不产生该码（向后兼容）
  assert.deepEqual(check(r, { body }), []);
});

test('missing-ref（references 层）：references 引用缺席同样给码', () => {
  const r = reg();
  const diags = check(r, { body: [{ target: 'goal' }], references: [{ example: 'ghost' }] });
  assert.equal(diags.length, 1);
  assert.equal(diags[0].code, 'missing-ref');
  assert.equal(diags[0].target, 'ghost');
});

test('去重：同一处红多来源触发只报一次（重复引用同理）', () => {
  const r = reg();
  const dup = check(r, { body: [{ target: 'goal' }], references: [{ useMethod: 'ghost' }, { useMethod: 'ghost' }] });
  assert.equal(dup.length, 1);
  assert.equal(dup[0].code, 'missing-ref');
});

test('多诊断与次序：body 判据（对齐相位在前）→ 双发布 → references 取字', () => {
  const r = reg();
  // body 少了 useMethod（对齐相位先出 master-not-in-body）；references 里 goal 与 body 撞双发布、ghost 缺席
  const body = [{ target: 'goal' }, { example: 'sample' }];
  const diags = check(r, { body, references: [{ target: 'goal' }, { useMethod: 'ghost' }] });
  assert.deepEqual(diags.map((d) => d.code), ['master-not-in-body', 'double-publish', 'missing-ref']);
  // doc() 抛首条（相位次序与之一致）
  assert.throws(() => doc(r, body), (e) => e.message === diags[0].message);
});
