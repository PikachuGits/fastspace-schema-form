import { nullable, string, parse, safeParse, value, custom } from "valibot";
export default function ValibotDemo() {
  // 修正：custom 仅传入 1 个参数（自定义校验函数），内置错误提示
  const NonEmptyRequiredStringSchema = custom((value: unknown): any => {
    // 1. 先判断是否为字符串（排除 undefined/null/其他类型）
    if (typeof value !== "string") {
      return "值不能为空（禁止undefined、null、空字符串）"; // 校验失败：返回错误信息
    }
    // 2. 再判断是否为空字符串（含纯空白字符串）
    if (value.trim().length === 0) {
      return "值不能为空（禁止undefined、null、空字符串）"; // 校验失败：返回错误信息
    }
    // 3. 校验通过：返回 true
    return true;
  });

  // 测试示例
  const testCases = [undefined, null, "", "   ", "valibot"];

  testCases.forEach((testValue) => {
    const result = safeParse(NonEmptyRequiredStringSchema, testValue);
    if (result.success) {
      console.log(`值 ${JSON.stringify(testValue)}：校验通过`);
    } else {
      console.log(
        `值 ${JSON.stringify(testValue)}：校验失败 - ${
          result.issues[0].message
        }`
      );
    }
  });

  return <div>Valibot</div>;
}
