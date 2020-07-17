import { DateTime } from "luxon";

import tw, { Status, Task } from "../src";
import { buildTaskDb, cleanTaskDb, execTask } from "./utils";

afterEach(cleanTaskDb);

test("attributes", async (): Promise<void> => {
  let entry = DateTime.utc(2020, 11, 8, 11, 12, 13);
  await buildTaskDb([
    [
      "add",
      `entry:${entry.toISO({ suppressMilliseconds: true })}`,
      "project:Foo",
      "tag:MyTag,OtherTag",
      "the task",
    ],
  ]);

  let warrior = await tw();

  let tasks = await warrior.list();
  expect(tasks).toHaveLength(1);
  expect(tasks[0].description).toBe("the task");
  expect(tasks[0].status).toBe(Status.Pending);
  expect(tasks[0].project).toBe("Foo");
  expect([...tasks[0].tags]).toEqual(["MyTag", "OtherTag"]);
  expect(tasks[0].entry.toUTC().toISO()).toBe(entry.toISO());
  expect(tasks[0].isModified).toBeFalsy();
});

test("status", async (): Promise<void> => {
  await buildTaskDb([
    ["log", "something completed"],
  ]);

  let warrior = await tw();

  let tasks = await warrior.list();
  expect(tasks).toHaveLength(1);
  expect(tasks[0].description).toBe("something completed");
  expect(tasks[0].status).toBe(Status.Completed);
  expect(tasks[0].project).toBeUndefined();
  expect([...tasks[0].tags]).toEqual([]);
  expect(tasks[0].isModified).toBeFalsy();
});

test("depends", async (): Promise<void> => {
  await buildTaskDb([
    ["add", "base task"],
    ["add", "other task"],
  ]);

  let warrior = await tw();

  let tasks = await warrior.list();
  expect(tasks).toHaveLength(2);

  let uuids = tasks.map((t: Task): string => t.uuid);

  await execTask(["add", "tag:lookup", `depends:${uuids.join(",")}`, "needy task"]);

  tasks = await warrior.list(["+lookup"]);
  expect(tasks).toHaveLength(1);
});
