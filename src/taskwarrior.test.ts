import path from "path";

import { dir as tmpdir, DirectoryResult } from "tmp-promise";

import tw from ".";
import { buildTaskRc, execTask } from "../test";

let tmp: DirectoryResult | undefined;
async function getTemp(): Promise<string> {
  if (!tmp) {
    tmp = await tmpdir({
      unsafeCleanup: true,
    });
  }
  return tmp.path;
}

afterEach(async (): Promise<void> => {
  if (tmp) {
    await tmp.cleanup();
  }
});

test("basic listing", async (): Promise<void> => {
  let tmpd = await getTemp();
  let taskRc = path.join(tmpd, ".taskrc");
  let taskD = path.join(tmpd, "tasks");
  await buildTaskRc(taskRc, {
    ["data.location"]: taskD,
  });

  await execTask(["add", "basic task"], {
    TASKRC: taskRc,
  });

  let warrior = await tw({
    taskRc,
  });

  let tasks = await warrior.list();
  expect(tasks).toHaveLength(1);
  expect(tasks[0].description).toBe("basic task");
});
