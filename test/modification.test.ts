import { DateTime } from "luxon";

import tw from "../src";
import { toJSON } from "../src/task";
import { expect, UUID_REGEX } from "./expect";
import { buildTaskDb, cleanTaskDb } from "./utils";

afterEach(cleanTaskDb);

test("Update attributes", async (): Promise<void> => {
  await buildTaskDb([
    [
      "add",
      "project:Foo",
      "tag:MyTag,OtherTag",
      "the task",
    ],
  ]);

  let warrior = await tw();

  let tasks = await warrior.list();
  expect(tasks).toHaveLength(1);

  let task = tasks[0];
  expect(task.isModified).toBeFalsy();
  let uuid = task.uuid;

  expect(toJSON(task)).toEqual({
    uuid: expect.stringMatching(UUID_REGEX),
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
  });

  task.description = "new description";
  expect(task.isModified).toBeTruthy();
  task.description = "the task";
  expect(task.isModified).toBeFalsy();
  task.description = "new description";
  task.due = DateTime.utc(2020, 8, 9, 10, 11, 12, 400);

  // Note the lack of milliseconds.
  let due = DateTime.utc(2020, 8, 9, 10, 11, 12);

  expect(toJSON(task)).toEqual({
    uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "new description",
    due: expect.toEqualDate(due),
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
  });

  await task.save();
  expect(task.isModified).toBeFalsy();

  expect(toJSON(task)).toEqual({
    uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "new description",
    due: expect.toEqualDate(due),
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
  });

  tasks = await warrior.list();
  expect(tasks).toHaveLength(1);

  task = tasks[0];
  expect(task.isModified).toBeFalsy();

  expect(toJSON(task)).toEqual({
    uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "new description",
    due: expect.toEqualDate(due),
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
  });
});

test("Tags", async (): Promise<void> => {
  await buildTaskDb([
    [
      "add",
      "project:Foo",
      "tag:MyTag,OtherTag",
      "the task",
    ],
  ]);

  let warrior = await tw();

  let tasks = await warrior.list();
  expect(tasks).toHaveLength(1);

  let task = tasks[0];
  expect(task.isModified).toBeFalsy();
  let uuid = task.uuid;

  expect(toJSON(task)).toEqual({
    uuid: expect.stringMatching(UUID_REGEX),
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
  });

  task.tags.add("foo");
  expect(task.isModified).toBeTruthy();
  task.tags.delete("foo");
  expect(task.isModified).toBeFalsy();
  task.tags.delete("MyTag");
  expect(task.isModified).toBeTruthy();
  task.tags.add("foo");

  expect(toJSON(task)).toEqual({
    uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["OtherTag", "foo"],
    project: "Foo",
  });

  await task.save();
  expect(task.isModified).toBeFalsy();

  expect(toJSON(task)).toEqual({
    uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["OtherTag", "foo"],
    project: "Foo",
  });

  tasks = await warrior.list();
  expect(tasks).toHaveLength(1);

  task = tasks[0];
  expect(task.isModified).toBeFalsy();

  expect(toJSON(task)).toEqual({
    uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["OtherTag", "foo"],
    project: "Foo",
  });
});
