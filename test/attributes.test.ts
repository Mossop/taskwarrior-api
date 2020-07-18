import { DateTime } from "luxon";

import tw, { Status, Task, Annotation } from "../src";
import { expect } from "./expect";
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
  expect(tasks[0].entry).toEqualDate(entry);
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
  expect(tasks[0].project).toBeNull();
  expect([...tasks[0].tags]).toEqual([]);
  expect(tasks[0].isModified).toBeFalsy();
});

test("annotations", async (): Promise<void> => {
  await buildTaskDb([
    ["add", "the task"],
    ["status:pending", "annotate", "this is the first"],
    ["status:pending", "annotate", "this is the second"],
  ]);

  let warrior = await tw();

  let tasks = await warrior.list();
  expect(tasks).toHaveLength(1);
  let annotations = [...tasks[0].annotations];
  expect(annotations).toHaveLength(2);
  expect(annotations.map((a: Annotation): string => a.description)).toEqual([
    "this is the first",
    "this is the second",
  ]);
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
