// ============================================================
// methodblocks — 把方法论做成积木：面向执行的 markdown 积木化
//
// 只解决两件事：
// 1. 多个 Markdown 的引用问题：精心写的文字给名字，引用名字即引用文字，写错名字构建即红；
// 2. 原语 API 的描述问题：target/useMethod/example/doc，外加 index/pack（目录与打包，对齐 Agent Skills 渐进披露）；包住散文，不翻译散文。
//
// 不认识任何编排与运行时概念（step、pipeline、任务组等）——那不是这里的职责。
// 文字还是文字，只给名字，能被引用，能被组合。
// ============================================================

/** 目标部件：一到两句话的简洁陈述，只说做什么＋做到什么算好，不展开。 */
export interface TargetDef {
  id: string;
  text: string;
}

/** 动作部件：母版（master）——一块精心写的动作逻辑文字（分步＋判定全塞此处）；散文原样保留。whenToUse＝一句话适用条件（散文，可选，写给读它的人/agent，不做机器判定）。 */
export interface MethodDef {
  id: string;
  text: string;
  whenToUse?: string;
}

/** 实例部件：一个填好数字的具体例子（只许写实例，不许写规则），给抽象规则做参照口；master＝对齐的母版 useMethod id（可选，"一字不抄"由构建期校验保证）。 */
export interface ExampleDef {
  id: string;
  text: string;
  master?: string;
}

/** 部件注册表：id → 文字；重复 id 即抛错（引用关系从口头约定变机器可查）。 */
export class Registry {
  private readonly targets = new Map<string, string>();
  private readonly methods = new Map<string, string>();
  private readonly methodWhen = new Map<string, string>();
  private readonly examples = new Map<string, string>();
  private readonly exampleMaster = new Map<string, string>();

  /** 定义 target：id 已存在即抛错。 */
  target(id: string, text: string): this {
    if (this.targets.has(id)) {
      throw new Error(`methodblocks: target 已存在: ${id}`);
    }
    this.targets.set(id, text);
    return this;
  }

  /** 定义 useMethod：id 已存在即抛错；whenToUse＝一句话适用条件（可选；空串即红——要么不给、要么非空）。 */
  useMethod(id: string, text: string, whenToUse?: string): this {
    if (this.methods.has(id)) {
      throw new Error(`methodblocks: useMethod 已存在: ${id}`);
    }
    this.methods.set(id, text);
    if (whenToUse !== undefined) {
      if (whenToUse === '') {
        throw new Error(`methodblocks: useMethod ${id} 的 whenToUse 为空串（要么不给、要么非空）`);
      }
      this.methodWhen.set(id, whenToUse);
    }
    return this;
  }

  /** 定义 example：id 已存在即抛错；master＝对齐的母版 useMethod id（对齐是纯校验，在拼装期执行，注册顺序无关）。 */
  example(id: string, text: string, master?: string): this {
    if (this.examples.has(id)) {
      throw new Error(`methodblocks: example 已存在: ${id}`);
    }
    this.examples.set(id, text);
    if (master !== undefined) {
      this.exampleMaster.set(id, master);
    }
    return this;
  }

  /** 取 target 文字：缺席即抛错（拼错名字构建即红）。 */
  getTarget(id: string): string {
    const hit = this.targets.get(id);
    if (hit === undefined) {
      throw new Error(`methodblocks: 未定义的 target: ${id}`);
    }
    return hit;
  }

  /** 取 useMethod 文字：缺席即抛错。 */
  getMethod(id: string): string {
    const hit = this.methods.get(id);
    if (hit === undefined) {
      throw new Error(`methodblocks: 未定义的 useMethod: ${id}`);
    }
    return hit;
  }

  /** 取 useMethod 的适用条件：id 缺席即抛错；未声明返回 undefined。 */
  getWhenToUse(id: string): string | undefined {
    this.getMethod(id);
    return this.methodWhen.get(id);
  }

  /** 取 example 文字：缺席即抛错。 */
  getExample(id: string): string {
    const hit = this.examples.get(id);
    if (hit === undefined) {
      throw new Error(`methodblocks: 未定义的 example: ${id}`);
    }
    return hit;
  }

  /** 取实例对齐的母版 id：未声明返回 undefined；实例 id 缺席即抛错。 */
  getExampleMaster(id: string): string | undefined {
    this.getExample(id);
    return this.exampleMaster.get(id);
  }
}

/** 文档部件：一篇文档 = 若干引用（target/method/example 交错出现，顺序即正文顺序）。 */
export type DocPart = { target: string } | { useMethod: string } | { example: string };

/** 诊断：结构化校验结果。code＝稳定机器码；target＝块标识；message＝人读说明（与 doc()/pack() 抛错文案逐字一致）。 */
export interface Diagnostic {
  /** missing-ref＝引用缺席；example-mutual-inclusion＝实例与母版互相包含（一字不抄）；master-not-in-body＝母版未进组装正文；double-publish＝同块双发布。 */
  code: 'missing-ref' | 'example-mutual-inclusion' | 'master-not-in-body' | 'double-publish';
  /** 出问题的块标识（实例 id／母版 id／target id 等）。 */
  target: string;
  /** 人读说明；与构建期抛错文案同源。 */
  message: string;
}

/** check() 输入：body＝正文层引用（母版对齐只作用于本层）；references＝只进 references/ 的块（可选）。 */
export interface CheckInput {
  body: DocPart[];
  references?: DocPart[];
}

/** 逐块取字预检：引用缺席转成诊断（不抛错）。 */
function refResolutionProblem(reg: Registry, part: DocPart): Diagnostic | null {
  const id = 'target' in part ? part.target : 'useMethod' in part ? part.useMethod : part.example;
  try {
    if ('target' in part) reg.getTarget(id);
    else if ('useMethod' in part) reg.getMethod(id);
    else reg.getExample(id);
    return null;
  } catch (e) {
    return { code: 'missing-ref', target: id, message: (e as Error).message };
  }
}

/** 判据收集（与 doc() 的抛错次序严格同序）：相位一＝母版对齐（M1–M3，逐 example）；相位二＝正文逐块取字。 */
function collectProblems(reg: Registry, parts: DocPart[]): Diagnostic[] {
  const out: Diagnostic[] = [];
  const resolved = new Set<number>();
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!('example' in p)) continue;
    const exampleProblem = refResolutionProblem(reg, p);
    if (exampleProblem !== null) {
      out.push(exampleProblem);
      resolved.add(i);
      continue;
    }
    const masterId = reg.getExampleMaster(p.example);
    if (masterId === undefined) {
      resolved.add(i);
      continue;
    }
    const masterProblem = refResolutionProblem(reg, { useMethod: masterId });
    if (masterProblem !== null) {
      out.push(masterProblem);
      resolved.add(i);
      continue;
    }
    const masterText = reg.getMethod(masterId);
    const exampleText = reg.getExample(p.example);
    if (exampleText.includes(masterText) || masterText.includes(exampleText)) {
      out.push({
        code: 'example-mutual-inclusion',
        target: p.example,
        message: `methodblocks: 实例 ${p.example} 与母版 ${masterId} 文字互相包含（一字不抄）`,
      });
    } else if (!parts.some((q) => 'useMethod' in q && q.useMethod === masterId)) {
      out.push({
        code: 'master-not-in-body',
        target: p.example,
        message: `methodblocks: 实例 ${p.example} 对齐的母版 ${masterId} 未进入文档（母版必须真引用）`,
      });
    }
    resolved.add(i);
  }
  for (let i = 0; i < parts.length; i++) {
    if (resolved.has(i)) continue;
    const problem = refResolutionProblem(reg, parts[i]);
    if (problem !== null) out.push(problem);
  }
  return out;
}

/** 双发布诊断（分层产出：同块不得既在正文又进 references/）。 */
function doublePublishProblems(parts: DocPart[], refParts: DocPart[]): Diagnostic[] {
  const out: Diagnostic[] = [];
  const inBody = new Set(parts.map((p) => JSON.stringify(p)));
  for (const r of refParts) {
    if (inBody.has(JSON.stringify(r))) {
      const key = 'target' in r ? r.target : 'useMethod' in r ? r.useMethod : r.example;
      out.push({ code: 'double-publish', target: key, message: `methodblocks: 块 ${key} 同时出现在正文与 references（双发布）` });
    }
  }
  return out;
}

/** 母版对齐校验（M1–M3）：委托判据收集器——首条即抛（文案与历史逐字一致）。 */
function assertMasters(reg: Registry, parts: DocPart[]): void {
  const problems = collectProblems(reg, parts);
  if (problems.length > 0) {
    throw new Error(problems[0].message);
  }
}

/** 拼装：顺序走查引用，逐块取文字拼成 Markdown；引用缺席即抛错。 */
export function doc(reg: Registry, parts: DocPart[]): string {
  assertMasters(reg, parts);
  return parts
    .map((p) =>
      'target' in p
        ? reg.getTarget(p.target)
        : 'useMethod' in p
          ? reg.getMethod(p.useMethod)
          : reg.getExample(p.example),
    )
    .join('\n\n');
}

/** 目录层（渐进披露的 metadata 层）：按 parts 顺序输出"块 id＋target（＋whenToUse）"清单；引用缺席即抛错。target 文字本身就是摘要，不新增概念。 */
export function index(reg: Registry, parts: DocPart[]): string {
  return parts
    .map((p) => {
      if ('target' in p) return `- target ${p.target}：${reg.getTarget(p.target)}`;
      if ('useMethod' in p) {
        const whenToUse = reg.getWhenToUse(p.useMethod);
        return whenToUse === undefined
          ? `- useMethod ${p.useMethod}`
          : `- useMethod ${p.useMethod}（适用：${whenToUse}）`;
      }
      return `- example ${p.example}`;
    })
    .join('\n');
}

/** Skill 元数据：name 即 Agent Skills 规范的 name，同时是产物目录名（契约：name≡目录名）；description 缺省取 parts 中第一个 target 的文字。 */
export interface SkillMeta {
  name: string;
  description?: string;
}

/** Agent Skills 的 name 规范：小写字母数字＋单连字符、≤64、不以连字符开头结尾（agentskills.io specification）。 */
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** YAML 双引号标量：转义反斜杠、双引号与换行。 */
function yamlDoubleQuoted(s: string): string {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

/** pack 选项：references＝只进 references/、不内联进正文的块（渐进披露分层）。缺省＝parts 全部（0.1.0 行为，向后兼容）。 */
export interface PackOptions {
  references?: DocPart[];
}

/** 打包（输出适配器，非身份定义）：SKILL.md＝frontmatter＋目录＋正文；references/＝逐块文件（kebab-case）。产物目录名＝skill.name。写法层本征输出是 doc()；装配层的接入点是名字引用与 doc() 产物，不经过本函数。frontmatter 是闭集，将来块级信息走 metadata 的 methodblocks.* 命名空间。传 options.references 时分层：这些块只进 references/、不内联进正文（同时出现在两处＝双发布即红）。 */
export function pack(reg: Registry, parts: DocPart[], skill: SkillMeta, options: PackOptions = {}): { 'SKILL.md': string; references: Record<string, string> } {
  // P1：name 合 Agent Skills 规范
  if (skill.name.length === 0 || skill.name.length > 64 || !SKILL_NAME_RE.test(skill.name)) {
    throw new Error(`methodblocks: skill name 不合 Agent Skills 规范（小写字母数字＋单连字符、≤64）: ${JSON.stringify(skill.name)}`);
  }
  // P2：description 缺省＝parts 中第一个 target（缺席即红），显式传入则覆盖
  let description = skill.description;
  if (description === undefined) {
    const firstTarget = parts.find((p): p is { target: string } => 'target' in p);
    if (firstTarget === undefined) {
      throw new Error('methodblocks: pack 缺 description 且 parts 中没有 target（缺省取字失败）');
    }
    description = reg.getTarget(firstTarget.target);
  } else if (description === '') {
    throw new Error('methodblocks: description 为空串（要么不给走缺省、要么非空）');
  }
  const toc = index(reg, parts); // P3：引用缺席即红（沿用）
  const body = doc(reg, parts);  // M1–M4 全套在此触发
  // 分层：references 缺省＝parts 全部（0.1.0 行为）；显式传入时先守双发布
  const refParts = options.references ?? parts;
  if (options.references) {
    const doublePublish = doublePublishProblems(parts, refParts);
    if (doublePublish.length > 0) {
      throw new Error(doublePublish[0].message);
    }
  }
  const skillMd = `---\nname: ${skill.name}\ndescription: ${yamlDoubleQuoted(description)}\n---\n\n# 目录\n\n${toc}\n\n# 正文\n\n${body}\n`;
  // P4：规范建议主文件 500 行内——本地硬闸（skills-ref 之外的兜底）
  const lineCount = skillMd.split('\n').length;
  if (lineCount > 500) {
    throw new Error(`methodblocks: SKILL.md ${lineCount} 行，超过 Agent Skills 的 500 行上限`);
  }
  const references: Record<string, string> = {};
  for (const p of refParts) {
    if ('target' in p) references[`references/target-${p.target}.md`] = `${reg.getTarget(p.target)}\n`;
    else if ('useMethod' in p) references[`references/use-method-${p.useMethod}.md`] = `${reg.getMethod(p.useMethod)}\n`;
    else references[`references/example-${p.example}.md`] = `${reg.getExample(p.example)}\n`;
  }
  return { 'SKILL.md': skillMd, references };
}

/** 校验（可调用入口）：返回全部诊断，不抛错。判据与 doc()/pack() 共用同一批函数——同一处红，两条路都出。
 *
 * 覆盖：引用缺席（missing-ref，含 body 与 references 两层）、母版对齐（example-mutual-inclusion／master-not-in-body，仅 body 层）、
 * 分层双发布（double-publish，须传 references）。不在本函数范围：注册表定义期的重复 id 与空 whenToUse（由 Registry 定义时抛错）、
 * pack 专属红（name 规范／description 缺省／500 行——check 不接收 SkillMeta，设计如此）。
 * 次序：body 判据（与 doc() 抛错次序同序）→ 双发布 → references 逐块取字；同一 (code,target,message) 只报一次（同一处红多来源触发合计一条）。 */
export function check(reg: Registry, input: CheckInput): Diagnostic[] {
  const out = collectProblems(reg, input.body);
  if (input.references !== undefined) {
    out.push(...doublePublishProblems(input.body, input.references));
    for (const r of input.references) {
      const problem = refResolutionProblem(reg, r);
      if (problem !== null) out.push(problem);
    }
  }
  const seen = new Set<string>();
  return out.filter((d) => {
    const key = JSON.stringify([d.code, d.target, d.message]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
