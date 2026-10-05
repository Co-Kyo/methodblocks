import assert from 'node:assert/strict';
import test from 'node:test';
import { Registry, inspectTargetShape, groupEvidences } from '../dist/index.js';

test('evidence：正常登记与归属校验', () => {
  const reg = new Registry()
    .target('t1', '文件已落盘且可解析')
    .evidence('e1', 'machine', 'json-parse: a.json', 't1')
    .evidence('e2', 'human', '人工确认非空', 't1');
  assert.equal(reg.getEvidencesOf('t1').length, 2);
  assert.equal(reg.getEvidence('e1').kind, 'machine');
});

test('evidence：挂在不存在目标上即抛（悬空口径同引用缺席）', () => {
  const reg = new Registry().target('t1', 'ok');
  assert.throws(() => reg.evidence('e1', 'machine', 'x', 'ghost'), /归属的 target 未定义/);
});

test('evidence：重复 id 即抛', () => {
  const reg = new Registry().target('t1', 'ok').evidence('e1', 'machine', 'x', 't1');
  assert.throws(() => reg.evidence('e1', 'human', 'y', 't1'), /已存在/);
});

test('inspectTargetShape：口号（目标无判据）即红', () => {
  const notes = inspectTargetShape({
    targets: [{ id: 't1', text: '只有目标' }],
    evidences: [],
  });
  assert.equal(notes.length, 1);
  assert.equal(notes[0].code, 'target-slogan');
  assert.equal(notes[0].blocking, true);
});

test('inspectTargetShape：悬空归属即红', () => {
  const notes = inspectTargetShape({
    targets: [{ id: 't1', text: '正常目标' }],
    evidences: [{ id: 'e1', kind: 'machine', text: 'x', targetId: 'ghost' }],
  });
  assert.equal(notes[0].code, 'evidence-dangling');
  assert.equal(notes[0].blocking, true);
});

test('inspectTargetShape：未归属判据（targetId 空串）即红', () => {
  const notes = inspectTargetShape({
    targets: [{ id: 't1', text: '正常' }],
    evidences: [{ id: 'e1', kind: 'human', text: 'x', targetId: '' }],
  });
  assert.equal(notes[0].code, 'evidence-dangling');
});

test('inspectTargetShape：目标 id 重复即红', () => {
  const notes = inspectTargetShape({
    targets: [
      { id: 't1', text: '甲' },
      { id: 't1', text: '乙' },
    ],
    evidences: [{ id: 'e1', kind: 'machine', text: 'x', targetId: 't1' }],
  });
  assert.ok(notes.filter((n) => n.code === 'target-duplicate').length >= 1);
});

test('inspectTargetShape：全归组干净 → 零诊断', () => {
  const notes = inspectTargetShape({
    targets: [
      { id: 't1', text: '甲' },
      { id: 't2', text: '乙' },
    ],
    evidences: [
      { id: 'e1', kind: 'machine', text: 'x', targetId: 't1' },
      { id: 'e2', kind: 'human', text: 'y', targetId: 't2' },
    ],
  });
  assert.deepEqual(notes, []);
});

test('groupEvidences：判据按 targetId 归组，缺席目标也成组（悬空由体检报）', () => {
  const groups = groupEvidences({
    targets: [{ id: 't1', text: '甲' }],
    evidences: [
      { id: 'e1', kind: 'machine', text: 'x', targetId: 't1' },
      { id: 'e2', kind: 'human', text: 'y', targetId: 'ghost' },
    ],
  });
  assert.equal(groups.get('t1').length, 1);
  assert.equal(groups.get('ghost').length, 1);
});

test('Registry.getAllTargets/getAllEvidences：纯数据出口（装配层映射用）', () => {
  const reg = new Registry()
    .target('t1', '甲')
    .evidence('e1', 'machine', 'x', 't1');
  assert.deepEqual(reg.getAllTargets(), [{ id: 't1', text: '甲' }]);
  assert.deepEqual(reg.getAllEvidences(), [{ id: 'e1', kind: 'machine', text: 'x', targetId: 't1' }]);
});
