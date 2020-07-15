import { promises as fs } from "fs";

import execa from "execa";

export async function buildTaskRc(
  file: string,
  settings: Record<string, string> = {},
): Promise<void> {
  let content = Object.entries(settings)
    .map(([key, value]: [string, string]): string => `${key}=${value}`)
    .join("\n");

  await fs.writeFile(file, content);
}

export async function execTask(args: string[], env: Record<string, string>): Promise<void> {
  await execa("task", args, {
    env,
  });
}
