// import React from "react";
// import { SchemaFormExample } from "../../../src-next-trea/SchemaForm.example";
import { Typography, Box, Paper } from "@mui/material";
import {
  email,
  endsWith,
  pipe,
  minLength,
  object,
  string,
  parse,
  safeParse,
} from "valibot";
import { SchemaFormExample } from "../../../package/SchemaForm.example";
import * as v from "valibot";

/**
 * 模拟数据库中的邮箱
 */
const existingEmails = new Set(["jane@example.com", "john@example.com"]);

/**
 * 模拟异步数据库校验
 * true  = 校验通过
 * false = 校验失败
 */
async function isEmailPresent(email: string): Promise<boolean> {
  // 模拟 I/O 延迟
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return existingEmails.has(email);
}

/**
 * Schema 定义（异步校验）
 */
const StoredEmailSchema = v.pipeAsync(
  v.string(),
  v.email(),
  v.checkAsync(isEmailPresent, "The email is not in the database.")
);

/**
 * 执行校验
 */
async function main() {
  const result = await v.safeParseAsync(
    StoredEmailSchema,
    "jane@example.com2"
    // 你也可以试试：
    // 'not-exist@example.com'
    // 'invalid-email'
  );

  if (result.success) {
    const storedEmail: string = result.output;
    console.log("✅ 校验成功:", storedEmail);
  } else {
    console.error("❌ 校验失败:");
    console.error(result.issues);
  }
}

export default function NextDemo() {
  // const EmailSchema = object({
  //   email: pipe(string(), email("Invalid email format"), endsWith("@example.com")),
  // });
  // const result = safeParse(EmailSchema, { email: '123@example' });

  // if (result.success) {
  //   const email = result.output;
  //   console.log(email);
  // } else {
  //   console.log(result.issues);
  // }
  main().catch(console.error);
  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          TanStack Form Rewrite Demo (src-next)
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Testing the new 3-layer architecture: Compiler -&gt; Runtime -&gt; UI
        </Typography>

        <SchemaFormExample />
      </Paper>
    </Box>
  );
}
