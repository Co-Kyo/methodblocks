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
export declare class Registry {
    private readonly targets;
    private readonly methods;
    private readonly methodWhen;
    private readonly examples;
    private readonly exampleMaster;
    /** 定义 target：id 已存在即抛错。 */
    target(id: string, text: string): this;
    /** 定义 useMethod：id 已存在即抛错；whenToUse＝一句话适用条件（可选；空串即红——要么不给、要么非空）。 */
    useMethod(id: string, text: string, whenToUse?: string): this;
    /** 定义 example：id 已存在即抛错；master＝对齐的母版 useMethod id（对齐是纯校验，在拼装期执行，注册顺序无关）。 */
    example(id: string, text: string, master?: string): this;
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
}
/** 文档部件：一篇文档 = 若干引用（target/method/example 交错出现，顺序即正文顺序）。 */
export type DocPart = {
    target: string;
} | {
    useMethod: string;
} | {
    example: string;
};
/** 拼装：顺序走查引用，逐块取文字拼成 Markdown；引用缺席即抛错。 */
export declare function doc(reg: Registry, parts: DocPart[]): string;
/** 目录层（渐进披露的 metadata 层）：按 parts 顺序输出"块 id＋target（＋whenToUse）"清单；引用缺席即抛错。target 文字本身就是摘要，不新增概念。 */
export declare function index(reg: Registry, parts: DocPart[]): string;
/** Skill 元数据：name 即 Agent Skills 规范的 name，同时是产物目录名（契约：name≡目录名）；description 缺省取 parts 中第一个 target 的文字。 */
export interface SkillMeta {
    name: string;
    description?: string;
}
/** 打包（输出适配器，非身份定义）：SKILL.md＝frontmatter＋目录＋正文；references/＝逐块文件（kebab-case）。产物目录名＝skill.name。写法层本征输出是 doc()；装配层的接入点是名字引用与 doc() 产物，不经过本函数。frontmatter 是闭集，将来块级信息走 metadata 的 methodblocks.* 命名空间。 */
export declare function pack(reg: Registry, parts: DocPart[], skill: SkillMeta): {
    'SKILL.md': string;
    references: Record<string, string>;
};
//# sourceMappingURL=index.d.ts.map