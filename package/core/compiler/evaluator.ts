import jsep from "jsep";
import type { EvalScope } from "../../types";

// ============================================================================
// 安全表达式求值器 (V4 - Enhanced)
// 基于 jsep AST 解释执行，完全禁止 eval/new Function
// ============================================================================

/** 危险的属性名黑名单 */
const FORBIDDEN_PROPERTIES = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

/** 危险的全局对象黑名单 */
const FORBIDDEN_GLOBALS = new Set([
  "eval",
  "Function",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "require",
  "import",
  "process",
  "global",
  "globalThis",
  "window",
  "document",
]);

/**
 * 安全的表达式求值器
 * 基于 AST 解释执行，禁止 eval/new Function
 */
export class SafeEvaluator {
  private allowedGlobals: Readonly<Record<string, any>>;

  constructor() {
    // 白名单全局对象 (Object.freeze 防止运行时修改)
    this.allowedGlobals = Object.freeze({
      // 安全的内置对象 (只暴露静态方法)
      Math: Math,
      Number: Number,
      String: String,
      Boolean: Boolean,
      Array: Array,
      Object: Object.freeze({
        keys: Object.keys,
        values: Object.values,
        entries: Object.entries,
        fromEntries: Object.fromEntries,
        assign: Object.assign, // 注意：返回值为新对象时是安全的
      }),
      Date: Date,
      JSON: Object.freeze({
        parse: JSON.parse,
        stringify: JSON.stringify,
      }),
      // 常用工具函数
      isNaN: isNaN,
      isFinite: isFinite,
      parseFloat: parseFloat,
      parseInt: parseInt,
      // 常用常量
      NaN: NaN,
      Infinity: Infinity,
      undefined: undefined,
      null: null,
      true: true,
      false: false,
    });
  }

  /**
   * 编译表达式为可执行函数
   * @param expr 表达式字符串
   * @returns 执行函数
   * @throws Error 如果表达式无效或包含危险代码
   */
  compile(expr: string): (scope: EvalScope) => any {
    try {
      const ast = jsep(expr);

      // 编译时安全验证
      this.validateNode(ast);

      // 返回闭包，捕获 AST
      return (scope: EvalScope) => this.evaluate(ast, scope);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[SafeEvaluator] Compilation failed for "${expr}": ${message}`
      );
      throw new Error(`Invalid expression "${expr}": ${message}`);
    }
  }

  /**
   * 尝试编译表达式，不抛出异常
   * @param expr 表达式字符串
   * @returns 编译结果或 null
   */
  tryCompile(expr: string): ((scope: EvalScope) => any) | null {
    try {
      return this.compile(expr);
    } catch {
      return null;
    }
  }

  /**
   * 递归评估 AST 节点
   */
  private evaluate(node: jsep.Expression, scope: EvalScope): any {
    switch (node.type) {
      case "Literal":
        return (node as jsep.Literal).value;

      case "Identifier": {
        const name = (node as jsep.Identifier).name;

        // 0. 安全检查：禁止访问危险全局对象
        if (FORBIDDEN_GLOBALS.has(name)) {
          throw new Error(
            `[SafeEvaluator] Security violation: accessing '${name}' is forbidden`
          );
        }

        // 1. 查找作用域变量 (优先级：values > meta > context)
        if (Object.prototype.hasOwnProperty.call(scope.values, name)) {
          return scope.values[name];
        }
        if (Object.prototype.hasOwnProperty.call(scope.meta, name)) {
          return scope.meta[name];
        }
        if (Object.prototype.hasOwnProperty.call(scope.context, name)) {
          return scope.context[name];
        }

        // 2. 查找白名单全局变量
        if (Object.prototype.hasOwnProperty.call(this.allowedGlobals, name)) {
          return this.allowedGlobals[name];
        }

        // 3. 特殊关键字
        if (name === "undefined") return undefined;
        if (name === "null") return null;
        if (name === "true") return true;
        if (name === "false") return false;

        // 4. 未定义变量处理
        // 在表单场景中，字段可能尚未初始化，返回 undefined 而不是抛错
        return undefined;
      }

      case "BinaryExpression": {
        const binNode = node as jsep.BinaryExpression;
        const left = this.evaluate(binNode.left, scope);
        const right = this.evaluate(binNode.right, scope);
        switch (binNode.operator) {
          case "+":
            return left + right;
          case "-":
            return left - right;
          case "*":
            return left * right;
          case "/":
            return left / right;
          case "%":
            return left % right;
          case "==":
            return left == right;
          case "!=":
            return left != right;
          case "===":
            return left === right;
          case "!==":
            return left !== right;
          case ">":
            return left > right;
          case "<":
            return left < right;
          case ">=":
            return left >= right;
          case "<=":
            return left <= right;
          case "&&":
            return left && right;
          case "||":
            return left || right;
          default:
            throw new Error(`Unknown binary operator: ${binNode.operator}`);
        }
      }

      case "UnaryExpression": {
        const unaryNode = node as jsep.UnaryExpression;
        const arg = this.evaluate(unaryNode.argument, scope);
        switch (unaryNode.operator) {
          case "!":
            return !arg;
          case "-":
            return -arg;
          case "+":
            return +arg;
          default:
            throw new Error(`Unknown unary operator: ${unaryNode.operator}`);
        }
      }

      case "MemberExpression": {
        const memberNode = node as jsep.MemberExpression;
        const object = this.evaluate(memberNode.object, scope);

        if (object === undefined || object === null) {
          // 安全访问：如果对象为空，返回 undefined (类似 Optional Chaining)
          return undefined;
        }

        let property: any;
        if (memberNode.computed) {
          property = this.evaluate(memberNode.property, scope);
        } else {
          property = (memberNode.property as jsep.Identifier).name;
        }

        // 安全性检查：禁止访问危险属性
        if (FORBIDDEN_PROPERTIES.has(String(property))) {
          throw new Error(
            `[SafeEvaluator] Security violation: accessing '${property}' is forbidden`
          );
        }

        // 使用 Object.prototype.hasOwnProperty 确保只访问自有属性
        // 防止原型链污染攻击
        if (typeof object === "object" && object !== null) {
          if (
            !Object.prototype.hasOwnProperty.call(object, property) &&
            !(property in object)
          ) {
            return undefined; // 属性不存在
          }
        }

        const value = object[property];

        // 如果是函数，需要绑定上下文
        if (typeof value === "function") {
          // 额外检查：禁止调用危险方法
          const funcName = String(property);
          if (funcName.startsWith("__") || funcName === "constructor") {
            throw new Error(
              `[SafeEvaluator] Security violation: calling '${funcName}' is forbidden`
            );
          }
          return value.bind(object);
        }
        return value;
      }

      case "CallExpression": {
        const callNode = node as jsep.CallExpression;
        const callee = this.evaluate(callNode.callee, scope);

        if (typeof callee !== "function") {
          throw new Error(`Callee is not a function`);
        }

        const args = callNode.arguments.map((arg) => this.evaluate(arg, scope));
        return callee(...args);
      }

      case "ConditionalExpression": {
        // 三元运算符 a ? b : c
        const condNode = node as jsep.ConditionalExpression;
        const test = this.evaluate(condNode.test, scope);
        return test
          ? this.evaluate(condNode.consequent, scope)
          : this.evaluate(condNode.alternate, scope);
      }

      case "ArrayExpression": {
        const arrNode = node as jsep.ArrayExpression;
        return arrNode.elements.map((el) => {
          if (!el) return null; // 处理稀疏数组
          return this.evaluate(el, scope);
        });
      }

      case "Compound": {
        // 多语句表达式 (如 a, b, c)，返回最后一个的值
        const compoundNode = node as jsep.Compound;
        let result: any = undefined;
        for (const expr of compoundNode.body) {
          result = this.evaluate(expr, scope);
        }
        return result;
      }

      default:
        throw new Error(
          `[SafeEvaluator] Unsupported expression type: ${node.type}`
        );
    }
  }

  /**
   * 从表达式中提取变量依赖
   * @param expr 表达式字符串
   * @returns 依赖的变量名数组 (去重)
   */
  extractDependencies(expr: string): string[] {
    const deps = new Set<string>();
    const reservedKeywords = new Set([
      "undefined",
      "null",
      "true",
      "false",
      "NaN",
      "Infinity",
    ]);

    try {
      const ast = jsep(expr);
      this.visitIdentifiers(ast, (name) => {
        // 过滤掉白名单全局变量、保留关键字和危险全局对象
        if (
          !Object.prototype.hasOwnProperty.call(this.allowedGlobals, name) &&
          !reservedKeywords.has(name) &&
          !FORBIDDEN_GLOBALS.has(name)
        ) {
          deps.add(name);
        }
      });
    } catch (e) {
      console.warn(
        `[SafeEvaluator] Dependency extraction failed for "${expr}"`,
        e
      );
    }
    return Array.from(deps);
  }

  /**
   * 验证表达式是否安全
   * @param expr 表达式字符串
   * @returns 验证结果
   */
  validate(expr: string): { valid: boolean; error?: string } {
    try {
      const ast = jsep(expr);
      this.validateNode(ast);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 递归验证 AST 节点的安全性
   */
  private validateNode(node: jsep.Expression): void {
    if (node.type === "Identifier") {
      const name = (node as jsep.Identifier).name;
      if (FORBIDDEN_GLOBALS.has(name)) {
        throw new Error(`Forbidden identifier: ${name}`);
      }
    } else if (node.type === "MemberExpression") {
      const memberNode = node as jsep.MemberExpression;
      this.validateNode(memberNode.object);
      if (!memberNode.computed) {
        const propName = (memberNode.property as jsep.Identifier).name;
        if (FORBIDDEN_PROPERTIES.has(propName)) {
          throw new Error(`Forbidden property access: ${propName}`);
        }
      } else {
        this.validateNode(memberNode.property);
      }
    } else if (node.type === "BinaryExpression") {
      const binNode = node as jsep.BinaryExpression;
      this.validateNode(binNode.left);
      this.validateNode(binNode.right);
    } else if (node.type === "UnaryExpression") {
      this.validateNode((node as jsep.UnaryExpression).argument);
    } else if (node.type === "CallExpression") {
      const callNode = node as jsep.CallExpression;
      this.validateNode(callNode.callee);
      callNode.arguments.forEach((arg) => this.validateNode(arg));
    } else if (node.type === "ConditionalExpression") {
      const condNode = node as jsep.ConditionalExpression;
      this.validateNode(condNode.test);
      this.validateNode(condNode.consequent);
      this.validateNode(condNode.alternate);
    } else if (node.type === "ArrayExpression") {
      (node as jsep.ArrayExpression).elements.forEach((el) => {
        if (el) this.validateNode(el);
      });
    } else if (node.type === "Compound") {
      (node as jsep.Compound).body.forEach((expr) => this.validateNode(expr));
    }
    // Literal 类型无需验证
  }

  private visitIdentifiers(
    node: jsep.Expression,
    callback: (name: string) => void
  ) {
    if (node.type === "Identifier") {
      callback((node as jsep.Identifier).name);
    } else if (node.type === "BinaryExpression") {
      const bin = node as jsep.BinaryExpression;
      this.visitIdentifiers(bin.left, callback);
      this.visitIdentifiers(bin.right, callback);
    } else if (node.type === "UnaryExpression") {
      this.visitIdentifiers((node as jsep.UnaryExpression).argument, callback);
    } else if (node.type === "MemberExpression") {
      // 只收集对象名的依赖，如 user.name -> user
      // 这是一个简化策略，更复杂的场景可能需要分析路径
      const member = node as jsep.MemberExpression;
      this.visitIdentifiers(member.object, callback);
      // 如果是 computed 属性 (a[b])，b 也是依赖
      if (member.computed) {
        this.visitIdentifiers(member.property, callback);
      }
    } else if (node.type === "CallExpression") {
      const call = node as jsep.CallExpression;
      this.visitIdentifiers(call.callee, callback);
      call.arguments.forEach((arg) => this.visitIdentifiers(arg, callback));
    } else if (node.type === "ConditionalExpression") {
      const cond = node as jsep.ConditionalExpression;
      this.visitIdentifiers(cond.test, callback);
      this.visitIdentifiers(cond.consequent, callback);
      this.visitIdentifiers(cond.alternate, callback);
    } else if (node.type === "ArrayExpression") {
      (node as jsep.ArrayExpression).elements.forEach((el) => {
        if (el) this.visitIdentifiers(el, callback);
      });
    }
  }
}

export const safeEvaluator = new SafeEvaluator();
