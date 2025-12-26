import type { SchemaRule } from "../../types";

type Graph = Map<string, Set<string>>; // Node -> Adjacency List (Dependents)

/**
 * 静态分析报告
 */
export type StaticAnalysisReport = {
  /** 循环依赖 (SCC with size > 1) */
  cycles: string[][];
  /** 孤立字段 (无入边也无出边的节点，即没有依赖也不被依赖) */
  isolatedFields: string[];
  /** 警告信息 */
  warnings: string[];
};

/**
 * 分析结果
 */
export type AnalysisResult = {
  /** 反向依赖索引: Dep -> Rules */
  dependencyMap: Map<string, SchemaRule[]>;
  /** 拓扑排序序列 */
  topologicalOrder: string[];
  /** 所有检测到的循环 */
  cycles: string[][];
  /** 孤立字段 */
  isolatedFields: string[];
  /** 静态分析报告 */
  report: StaticAnalysisReport;
};

/**
 * 依赖分析器 (V4 Enhanced)
 * 负责检测循环依赖、孤立字段并生成拓扑排序
 */
export class DependencyAnalyzer {
  /** 是否启用严格模式 (循环依赖时抛出异常) */
  private strictMode: boolean;

  constructor(options: { strictMode?: boolean } = {}) {
    this.strictMode = options.strictMode ?? true;
  }

  /**
   * 分析规则集合，返回拓扑排序和反向依赖索引
   * @param rules 扁平化的规则列表
   * @param allFieldNames 所有字段名 (用于检测孤立字段)
   * @returns 分析结果
   */
  analyze(rules: SchemaRule[], allFieldNames?: string[]): AnalysisResult {
    // 1. 构建依赖图 (Adjacency List)
    // Edge: Dep -> Target (Dep 变化触发 Target 更新)
    const graph: Graph = new Map();
    const reverseGraph: Graph = new Map(); // Target -> Deps (入边)
    const allNodes = new Set<string>();
    const targetNodes = new Set<string>(); // 被规则影响的节点
    const sourceNodes = new Set<string>(); // 规则依赖的节点

    // 反向索引: Dep -> Rules
    const dependencyMap = new Map<string, SchemaRule[]>();
    const warnings: string[] = [];

    for (const rule of rules) {
      const target = "target" in rule ? rule.target : null;
      if (!target) {
        // Effect rule without target
        if (rule.type === "effect") {
          for (const dep of rule.deps) {
            allNodes.add(dep);
            sourceNodes.add(dep);
            if (!dependencyMap.has(dep)) dependencyMap.set(dep, []);
            dependencyMap.get(dep)!.push(rule);
          }
        }
        continue;
      }

      allNodes.add(target);
      targetNodes.add(target);

      // 空依赖规则警告
      if (rule.deps.length === 0 && rule.type !== "options") {
        warnings.push(
          `Rule for "${target}" has no dependencies - it will only run on initialization`
        );
      }

      // 记录反向索引
      for (const dep of rule.deps) {
        allNodes.add(dep);
        sourceNodes.add(dep);

        // Graph edge: Dep -> Target (正向图)
        if (!graph.has(dep)) graph.set(dep, new Set());
        graph.get(dep)!.add(target);

        // Reverse Graph edge: Target -> Dep (反向图)
        if (!reverseGraph.has(target)) reverseGraph.set(target, new Set());
        reverseGraph.get(target)!.add(dep);

        // Dependency Map
        if (!dependencyMap.has(dep)) dependencyMap.set(dep, []);
        dependencyMap.get(dep)!.push(rule);
      }
    }

    // 2. 检测循环依赖 (Tarjan's Algorithm)
    const cycles = this.findCycles(graph);
    if (cycles.length > 0) {
      const cycleInfo = cycles.map((c) => c.join(" -> ")).join("\n  ");
      const message = `[DependencyAnalyzer] Cyclic dependencies detected:\n  ${cycleInfo}`;

      if (this.strictMode) {
        throw new Error(message);
      } else {
        warnings.push(message);
      }
    }

    // 3. 检测孤立字段
    const isolatedFields = this.findIsolatedFields(
      allFieldNames ? new Set(allFieldNames) : allNodes,
      sourceNodes,
      targetNodes
    );

    // 注意: 孤立字段在表单场景中很常见（纯输入字段），不作为警告输出
    // 如果需要调试，可以在 staticAnalysisReport.isolatedFields 中查看

    // 4. 生成拓扑排序
    const topologicalOrder = this.topologicalSort(graph, allNodes);

    return {
      dependencyMap,
      topologicalOrder,
      cycles,
      isolatedFields,
      report: {
        cycles,
        isolatedFields,
        warnings,
      },
    };
  }

  /**
   * 检测孤立字段
   * 孤立字段：既不依赖其他字段，也不被其他字段依赖
   */
  private findIsolatedFields(
    allFields: Set<string>,
    sourceNodes: Set<string>,
    targetNodes: Set<string>
  ): string[] {
    const connectedNodes = new Set([...sourceNodes, ...targetNodes]);
    const isolated: string[] = [];

    for (const field of allFields) {
      if (!connectedNodes.has(field)) {
        isolated.push(field);
      }
    }

    return isolated;
  }

  /**
   * Tarjan's algorithm for finding SCCs (Strongly Connected Components)
   * Only components with size > 1 or self-loops are cycles.
   */
  private findCycles(graph: Graph): string[][] {
    let index = 0;
    const stack: string[] = [];
    const indices = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const onStack = new Set<string>();
    const sccs: string[][] = [];

    const strongconnect = (v: string) => {
      indices.set(v, index);
      lowlink.set(v, index);
      index++;
      stack.push(v);
      onStack.add(v);

      const neighbors = graph.get(v) || new Set();
      for (const w of neighbors) {
        if (!indices.has(w)) {
          strongconnect(w);
          lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
        } else if (onStack.has(w)) {
          lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
        }
      }

      if (lowlink.get(v) === indices.get(v)) {
        const scc: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          scc.push(w);
        } while (w !== v);

        // Filter trivial SCCs (single node without self-loop)
        if (scc.length > 1 || graph.get(v)?.has(v)) {
          sccs.push(scc);
        }
      }
    };

    for (const node of graph.keys()) {
      if (!indices.has(node)) {
        strongconnect(node);
      }
    }

    return sccs;
  }

  /**
   * Topological Sort (DFS based)
   */
  private topologicalSort(graph: Graph, nodes: Set<string>): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);

      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        visit(neighbor);
      }

      order.push(node); // Post-order
    };

    for (const node of nodes) {
      visit(node);
    }

    // Reverse to get topological order (Source -> Sink)
    return order.reverse();
  }
}

export const dependencyAnalyzer = new DependencyAnalyzer();
