import { promises as fs } from "fs";
import path from "path";

import execa from "execa";
import { dir as tmpdir, DirectoryResult } from "tmp-promise";

import { Task } from "../src";

export async function buildTaskRc(
  file: string,
  settings: Record<string, string> = {},
): Promise<void> {
  let content = Object.entries(settings)
    .map(([key, value]: [string, string]): string => `${key}=${value}`)
    .join("\n");

  await fs.writeFile(file, content);
}

export async function execTask(args: string[], env: Record<string, string> = {}): Promise<void> {
  await execa("task", [
    "rc.confirmation=no",
    "rc.allow.empty.filter=yes",
    "rc.bulk=0",
    "rc.recurrence.confirmation=yes",
    "rc.json.array=on",
    ...args,
  ], {
    env,
  });
}

let tmp: DirectoryResult | undefined;
export async function buildTaskDb(
  commands: string[][] = [],
  settings: Record<string, string> = {},
): Promise<string> {
  tmp = await tmpdir({
    unsafeCleanup: true,
  });

  let taskRc = path.join(tmp.path, ".taskrc");
  await buildTaskRc(taskRc, {
    ...settings,
    ["data.location"]: path.join(tmp.path, ".tasks"),
  });

  process.env["TASKRC"] = taskRc;

  for (let command of commands) {
    await execTask(command);
  }

  return taskRc;
}

export async function cleanTaskDb(): Promise<void> {
  if (tmp) {
    await tmp.cleanup();
  }
}

export function checkTaskDescriptions(tasks: Task[], expected: string[]): void {
  let found = tasks.map((t: Task): string => t.description);
  found.sort();
  expected.sort();

  expect(found).toEqual(expected);
}
