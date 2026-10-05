/** 目标部件：可判定目标（claim）——指着产物能判过/不过的陈述；判据经 targetId 归属到它。 */
export interface TargetDef {
    id: string;
    /** 可判定目标（claim）。 */
    text: string;
}
/** 判据部件：支撑某个 target 的可执行检验——kind='machine'＝机器可跑（文件存在/可解析/字段…），kind='human'＝人可判（检查项，期望口径写在 text）。 */
export interface EvidenceDef {
    /** 判据标识（使用方按它回填自己的规则 id）。 */
    id: string;
    /** 'machine'＝机器判据；'human'＝人工判据。 */
    kind: 'machine' | 'human';
    /** 判据正文：怎么判（机器＝校验描述；人工＝label＋期望口径）。 */
    text: string;
    /** 归属的 target id。 */
    targetId: string;
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
export declare class Registry {
    private readonly targets;
    private readonly methods;
    private readonly methodWhen;
    private readonly examples;
    private readonly exampleMaster;
    private readonly evidences;
    /** 定义 target：id 已存在即抛错。 */
    target(id: string, text: string): this;
    /** 定义 useMethod：id 已存在即抛错；whenToUse＝一句话适用条件（可选；空串即红——要么不给、要么非空）。 */
    useMethod(id: string, text: string, whenToUse?: string): this;
    /** 定义 example：id 已存在即抛错；master＝对齐的母版 useMethod id（对齐是纯校验，在拼装期执行，注册顺序无关）。 */
    example(id: string, text: string, master?: string): this;
    /** 定义 evidence（判据）：id 已存在即抛错；targetId 指向的 target 必须已定义（缺席即抛——判据挂在不存在目标上＝悬空，同引用缺席口径）。 */
    evidence(id: string, kind: 'machine' | 'human', text: string, targetId: string): this;
    /** 取 target 文字：缺席即抛错（拼错名字构建即红）。 */
    getTarget(id: string): string;
    /** 取 useMethod 文字：缺席即抛错。 */
    getMethod(id: string): string;
    /** 取 useMethod 的适用条件：id 缺席即抛错；未声明返回 undefined。 */
    getWhenToUse(id: string): string | undefined;
    /** 取 example 文字：缺席即抛错。 */
    getExample(id: string): string;
    /** 取实例对齐的母版 id：未声明返回 undefined；实例 id 缺席即抛错。 */
    getExampleMaster(id: string): string | undefined;
    /** 取判据：缺席即抛错。 */
    getEvidence(id: string): EvidenceDef;
    /** 某目标下的全部判据（登记顺序）；目标 id 缺席即抛错。 */
    getEvidencesOf(targetId: string): EvidenceDef[];
    /** 全部判据（登记顺序，普通对象数组——纯函数体检/归组的输入形状）。 */
    getAllEvidences(): EvidenceDef[];
    /** 全部目标（登记顺序，普通对象数组）。 */
    getAllTargets(): TargetDef[];
}
/** 文档部件：一篇文档 = 若干引用（target/method/example 交错出现，顺序即正文顺序）。 */
export type DocPart = {
    target: string;
} | {
    useMethod: string;
} | {
    example: string;
};
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
/** 拼装：顺序走查引用，逐块取文字拼成 Markdown；引用缺席即抛错。 */
export declare function doc(reg: Registry, parts: DocPart[]): string;
/** 目录层（渐进披露的 metadata 层）：按 parts 顺序输出"块 id＋target（＋whenToUse）"清单；引用缺席即抛错。target 文字本身就是摘要，不新增概念。 */
export declare function index(reg: Registry, parts: DocPart[]): string;
/** Skill 元数据：name 即 Agent Skills 规范的 name，同时是产物目录名（契约：name≡目录名）；description 缺省取 parts 中第一个 target 的文字。 */
export interface SkillMeta {
    name: string;
    description?: string;
}
/** pack 选项：references＝只进 references/、不内联进正文的块（渐进披露分层）。缺省＝parts 全部（0.1.0 行为，向后兼容）。 */
export interface PackOptions {
    references?: DocPart[];
}
/** 打包（输出适配器，非身份定义）：SKILL.md＝frontmatter＋目录＋正文；references/＝逐块文件（kebab-case）。产物目录名＝skill.name。写法层本征输出是 doc()；使用方的接入点是名字引用与 doc() 产物，不经过本函数。frontmatter 是闭集。传 options.references 时分层：这些块只进 references/、不内联进正文（同时出现在两处＝双发布即红）。 */
export declare function pack(reg: Registry, parts: DocPart[], skill: SkillMeta, options?: PackOptions): {
    'SKILL.md': string;
    references: Record<string, string>;
};
/** 校验（可调用入口）：返回全部诊断，不抛错。判据与 doc()/pack() 共用同一批函数——同一处红，两条路都出。
 *
 * 覆盖：引用缺席（missing-ref，含 body 与 references 两层）、母版对齐（example-mutual-inclusion／master-not-in-body，仅 body 层）、
 * 分层双发布（double-publish，须传 references）。不在本函数范围：注册表定义期的重复 id 与空 whenToUse（由 Registry 定义时抛错）、
 * pack 专属红（name 规范／description 缺省／500 行——check 不接收 SkillMeta，设计如此）。
 * 次序：body 判据（与 doc() 抛错次序同序）→ 双发布 → references 逐块取字；同一 (code,target,message) 只报一次（同一处红多来源触发合计一条）。 */
export declare function check(reg: Registry, input: CheckInput): Diagnostic[];
/** 形状体检输入：目标与判据的普通对象数组（使用方从自己的声明结构映射而来）。 */
export interface TargetShapeInput {
    targets: TargetDef[];
    evidences: EvidenceDef[];
}
/** 形状体检诊断：code＝稳定机器码；targetId＝涉事目标；message＝人读说明。 */
export interface ShapeNote {
    /** target-slogan＝目标无判据（口号）；evidence-orphan＝判据未归属；evidence-dangling＝判据挂在不存在目标；target-duplicate＝目标 id 重复。 */
    code: 'target-slogan' | 'evidence-orphan' | 'evidence-dangling' | 'target-duplicate';
    targetId: string;
    /** 涉事判据 id（孤儿/悬空时有）。 */
    evidenceId?: string;
    message: string;
    /** 结构破了（使用方应阻断）；还是可继续的提示。 */
    blocking: boolean;
}
/**
 * 目标形状体检：口号／孤儿／悬空／重复四类，全部结构可判。
 * 语义重复（两条目标换了词说同一件事）机检不到——必须人判，不在本函数射程。
 */
export declare function inspectTargetShape(input: TargetShapeInput): ShapeNote[];
/** 归组：判据按 targetId 分组（渲染用——"目标下挂判据"由使用方渲染，这里只给分组结果）。缺席的 target id 也会成组（体检会报悬空，这里不拦）。 */
export declare function groupEvidences(input: TargetShapeInput): Map<string, EvidenceDef[]>;
//# sourceMappingURL=index.d.ts.map