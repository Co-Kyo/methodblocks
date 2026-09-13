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
/** 部件注册表：id → 文字；重复 id 即抛错（引用关系从口头约定变机器可查）。 */
export class Registry {
    targets = new Map();
    methods = new Map();
    methodWhen = new Map();
    examples = new Map();
    exampleMaster = new Map();
    /** 定义 target：id 已存在即抛错。 */
    target(id, text) {
        if (this.targets.has(id)) {
            throw new Error(`methodblocks: target 已存在: ${id}`);
        }
        this.targets.set(id, text);
        return this;
    }
    /** 定义 useMethod：id 已存在即抛错；whenToUse＝一句话适用条件（可选；空串即红——要么不给、要么非空）。 */
    useMethod(id, text, whenToUse) {
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
    example(id, text, master) {
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
    getTarget(id) {
        const hit = this.targets.get(id);
        if (hit === undefined) {
            throw new Error(`methodblocks: 未定义的 target: ${id}`);
        }
        return hit;
    }
    /** 取 useMethod 文字：缺席即抛错。 */
    getMethod(id) {
        const hit = this.methods.get(id);
        if (hit === undefined) {
            throw new Error(`methodblocks: 未定义的 useMethod: ${id}`);
        }
        return hit;
    }
    /** 取 useMethod 的适用条件：id 缺席即抛错；未声明返回 undefined。 */
    getWhenToUse(id) {
        this.getMethod(id);
        return this.methodWhen.get(id);
    }
    /** 取 example 文字：缺席即抛错。 */
    getExample(id) {
        const hit = this.examples.get(id);
        if (hit === undefined) {
            throw new Error(`methodblocks: 未定义的 example: ${id}`);
        }
        return hit;
    }
    /** 取实例对齐的母版 id：未声明返回 undefined；实例 id 缺席即抛错。 */
    getExampleMaster(id) {
        this.getExample(id);
        return this.exampleMaster.get(id);
    }
}
/** 母版对齐校验（M1–M3）：实例对齐的母版必须存在、实例与母版"一字不抄"、母版必须真进产物。对齐是纯校验，拼装不改一字。 */
function assertMasters(reg, parts) {
    for (const p of parts) {
        if (!('example' in p))
            continue;
        const masterId = reg.getExampleMaster(p.example);
        if (masterId === undefined)
            continue;
        const masterText = reg.getMethod(masterId);
        const exampleText = reg.getExample(p.example);
        if (exampleText.includes(masterText) || masterText.includes(exampleText)) {
            throw new Error(`methodblocks: 实例 ${p.example} 与母版 ${masterId} 文字互相包含（一字不抄）`);
        }
        const masterReferenced = parts.some((q) => 'useMethod' in q && q.useMethod === masterId);
        if (!masterReferenced) {
            throw new Error(`methodblocks: 实例 ${p.example} 对齐的母版 ${masterId} 未进入文档（母版必须真引用）`);
        }
    }
}
/** 拼装：顺序走查引用，逐块取文字拼成 Markdown；引用缺席即抛错。 */
export function doc(reg, parts) {
    assertMasters(reg, parts);
    return parts
        .map((p) => 'target' in p
        ? reg.getTarget(p.target)
        : 'useMethod' in p
            ? reg.getMethod(p.useMethod)
            : reg.getExample(p.example))
        .join('\n\n');
}
/** 目录层（渐进披露的 metadata 层）：按 parts 顺序输出"块 id＋target（＋whenToUse）"清单；引用缺席即抛错。target 文字本身就是摘要，不新增概念。 */
export function index(reg, parts) {
    return parts
        .map((p) => {
        if ('target' in p)
            return `- target ${p.target}：${reg.getTarget(p.target)}`;
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
/** Agent Skills 的 name 规范：小写字母数字＋单连字符、≤64、不以连字符开头结尾（agentskills.io specification）。 */
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** YAML 双引号标量：转义反斜杠、双引号与换行。 */
function yamlDoubleQuoted(s) {
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}
/** 打包（输出适配器，非身份定义）：SKILL.md＝frontmatter＋目录＋正文；references/＝逐块文件（kebab-case）。产物目录名＝skill.name。写法层本征输出是 doc()；装配层的接入点是名字引用与 doc() 产物，不经过本函数。frontmatter 是闭集，将来块级信息走 metadata 的 methodblocks.* 命名空间。 */
export function pack(reg, parts, skill) {
    // P1：name 合 Agent Skills 规范
    if (skill.name.length === 0 || skill.name.length > 64 || !SKILL_NAME_RE.test(skill.name)) {
        throw new Error(`methodblocks: skill name 不合 Agent Skills 规范（小写字母数字＋单连字符、≤64）: ${JSON.stringify(skill.name)}`);
    }
    // P2：description 缺省＝parts 中第一个 target（缺席即红），显式传入则覆盖
    let description = skill.description;
    if (description === undefined) {
        const firstTarget = parts.find((p) => 'target' in p);
        if (firstTarget === undefined) {
            throw new Error('methodblocks: pack 缺 description 且 parts 中没有 target（缺省取字失败）');
        }
        description = reg.getTarget(firstTarget.target);
    }
    else if (description === '') {
        throw new Error('methodblocks: description 为空串（要么不给走缺省、要么非空）');
    }
    const toc = index(reg, parts); // P3：引用缺席即红（沿用）
    const body = doc(reg, parts); // M1–M4 全套在此触发
    const skillMd = `---\nname: ${skill.name}\ndescription: ${yamlDoubleQuoted(description)}\n---\n\n# 目录\n\n${toc}\n\n# 正文\n\n${body}\n`;
    // P4：规范建议主文件 500 行内——本地硬闸（skills-ref 之外的兜底）
    const lineCount = skillMd.split('\n').length;
    if (lineCount > 500) {
        throw new Error(`methodblocks: SKILL.md ${lineCount} 行，超过 Agent Skills 的 500 行上限`);
    }
    const references = {};
    for (const p of parts) {
        if ('target' in p)
            references[`references/target-${p.target}.md`] = `${reg.getTarget(p.target)}\n`;
        else if ('useMethod' in p)
            references[`references/use-method-${p.useMethod}.md`] = `${reg.getMethod(p.useMethod)}\n`;
        else
            references[`references/example-${p.example}.md`] = `${reg.getExample(p.example)}\n`;
    }
    return { 'SKILL.md': skillMd, references };
}
//# sourceMappingURL=index.js.map