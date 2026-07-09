# Review 题库覆盖矩阵

[返回首页](../../README.md)

本文件盘点当前 20 道 Review Mode 题在**判断维度**、**合并结论分布**和**技术栈**三个方向的覆盖情况，用来指导后续补题。它对照 [产品方向](./product-direction.md) 里 Review Mode 要训练的判断类型。

## 合并结论分布

去剧透改造后，题库刻意混入了"可以合并"的对照题——正确的 review 结论不总是 request changes，校准判断本身就是被训练的能力。

| 结论 | 题目 | 数量 |
| --- | --- | --- |
| 不能合并（trap，貌似合理但有阻塞问题） | 001–007、009、010、012–014、016–018、020 | 16 |
| 可以合并（改编自上游正确修复，正确结论是 approve） | 008、011、015、019 | 4 |

对照题的题面口吻和结构与 trap 题完全一致，用户无法从表面分辨题型。

## 判断维度分布

| 维度 | 含义 | 题目 | 数量 |
| --- | --- | --- | --- |
| security | 安全（鉴权绕过 / SSRF / 注入 / 算法混淆等） | 002、003、004、007、009 | 5 |
| hidden-regression | 修一个问题时破坏原有正确行为 | 001、012、014、016 | 4 |
| edge-case | 边界 / 空值 / 形状不变量 | 008、015、017、019 | 4 |
| surface-fix | 只修表面症状 / 只覆盖一个例子 | 005、006、011 | 3 |
| authorization | 权限 / 越权 | 010 | 1 |
| api-boundary | 异常边界 / 公开 API 稳定性 | 013 | 1 |
| api-contract | 可变状态 / 迭代器契约 | 020 | 1 |
| performance-semantics | 性能语义（如强制物化、丢失 laziness） | 018 | 1 |

## 技术栈分布

| 栈 | 题目数 |
| --- | --- |
| Python | 14 |
| TypeScript | 3 |
| JavaScript | 3 |

## 已知缺口（后续补题优先级）

1. **技术栈失衡**。14/20 是 Python（含大量科学计算库）。产品方向和架构文档都写明首批应"优先 TypeScript、React、Node.js"。目标用户是用 AI 交付 Web 工程的工程师，下一批题应向 TS/React/Node 倾斜，逐步下调 sympy/astropy 这类领域距离较远的题。
2. **判断维度尚未覆盖全**。对照 [产品方向](./product-direction.md) 列出的能力面，目前**缺失**：并发 / 竞态（concurrency）、兼容性破坏（backward-compat break）、过度工程 / 不可维护（over-engineering），以及"测试写了一大堆但测错了东西"这一独立形态（现有 test-quality 问题都附着在其它维度上，没有一道以它为主）。
3. **难度与维度的相关性**。security 题几乎都是 senior，edge-case 题几乎都是 mid，维度和难度耦合较紧；后续可让同一维度覆盖 junior→senior 梯度。

## 补题时的硬约束

见 [challenges/README.md](../../challenges/README.md) 的 Authoring self-check：去剧透、最小充分上下文、senior 需思考、答案不可从题面复制、测试是陷阱或证据的一部分、上游可追溯。每道新题必须逐条过关。
