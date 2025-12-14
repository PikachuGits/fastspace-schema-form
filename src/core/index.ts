// 核心模块统一导出
export { evaluateCondition, extractDependencies } from "./engine/condition";
export type { FieldState, FieldStatesMap } from "./engine/fieldState";
export {
  computeAllFieldStates,
  computeFieldState,
  getWatchFields,
} from "./engine/fieldState";
export {
  getDownstreamFields,
  mergeDefaultValues,
  parseSchema,
} from "./parser/schemaParser";
export {
  buildValibotSchema,
  createDynamicResolver,
} from "./validation/valibotAdapter";
