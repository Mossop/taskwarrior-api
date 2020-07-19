import { DateTime } from "luxon";

import tw, { Status } from "../src";
import { toJSON } from "../src/utils";
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

test("Annotations", async (): Promise<void> => {
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

  task.annotations.add("hello");
  expect(task.isModified).toBeTruthy();
  expect(task.annotations).toHaveLength(1);
  expect(task.annotations[0]).toEqual({
    entry: expect.toBeCloseToDate(),
    description: "hello",
  });

  expect(toJSON(task)).toEqual({
    uuid: uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
    annotations: [{
      entry: expect.toBeCloseToDate(),
      description: "hello",
    }],
  });

  await task.save();

  expect(toJSON(task)).toEqual({
    uuid: uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
    annotations: [{
      entry: expect.toBeCloseToDate(),
      description: "hello",
    }],
  });

  expect(task.isModified).toBeFalsy();
  expect(task.annotations).toHaveLength(1);
  expect(task.annotations[0]).toEqual({
    entry: expect.toBeCloseToDate(),
    description: "hello",
  });

  task.annotations.delete(task.annotations[0]!);

  expect(task.isModified).toBeTruthy();
  expect(task.annotations).toHaveLength(0);

  expect(toJSON(task)).toEqual({
    uuid: uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
  });

  await task.save();

  expect(toJSON(task)).toEqual({
    uuid: uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
  });

  expect(task.isModified).toBeFalsy();
  expect(task.annotations).toHaveLength(0);

  task.annotations.add("foo", DateTime.utc(2020, 1, 2, 3, 4, 5));
  task.annotations.add("bar", DateTime.utc(2020, 1, 1, 3, 4, 5));
  task.annotations.add("baz", DateTime.utc(2020, 1, 3, 3, 4, 5));
  task.annotations.add("biz", DateTime.utc(2020, 1, 2, 3, 4, 5));

  expect(task.annotations).toHaveLength(4);
  expect(Array.from(task.annotations)).toEqual([{
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
    description: "bar",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
    description: "foo",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 6)),
    description: "biz",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 3, 3, 4, 5)),
    description: "baz",
  }]);

  expect(toJSON(task)).toEqual({
    uuid: uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
    annotations: [{
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
      description: "bar",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
      description: "foo",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 6)),
      description: "biz",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 3, 3, 4, 5)),
      description: "baz",
    }],
  });

  await task.save();

  expect(toJSON(task)).toEqual({
    uuid: uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
    annotations: [{
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
      description: "bar",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
      description: "foo",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 6)),
      description: "biz",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 3, 3, 4, 5)),
      description: "baz",
    }],
  });

  let found = await warrior.get(uuid);
  expect(found).toBeTruthy();
  expect(toJSON(found!)).toEqual({
    uuid: uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
    annotations: [{
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
      description: "bar",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
      description: "foo",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 6)),
      description: "biz",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 3, 3, 4, 5)),
      description: "baz",
    }],
  });

  task.annotations.delete(task.annotations[2]!);

  expect(task.isModified).toBeTruthy();
  expect(toJSON(task)).toEqual({
    uuid: uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
    annotations: [{
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
      description: "bar",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
      description: "foo",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 3, 3, 4, 5)),
      description: "baz",
    }],
  });

  await task.save();

  expect(task.isModified).toBeFalsy();
  expect(toJSON(task)).toEqual({
    uuid: uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
    annotations: [{
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
      description: "bar",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
      description: "foo",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 3, 3, 4, 5)),
      description: "baz",
    }],
  });

  found = await warrior.get(uuid);
  expect(found).toBeTruthy();
  expect(toJSON(found!)).toEqual({
    uuid: uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
    annotations: [{
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
      description: "bar",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
      description: "foo",
    }, {
      entry: expect.toEqualDate(DateTime.utc(2020, 1, 3, 3, 4, 5)),
      description: "baz",
    }],
  });
});

test("Abandon changes", async (): Promise<void> => {
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

  task.wait = DateTime.local();
  expect(task.isModified).toBeTruthy();
  expect(task.status).toBe(Status.Waiting);

  task.wait = null;
  expect(task.isModified).toBeFalsy();
  expect(task.status).toBe(Status.Pending);

  task.wait = DateTime.local();
  task.due = DateTime.local();
  task.tags.add("hello");
  task.project = null;
  expect(task.isModified).toBeTruthy();

  expect(toJSON(task)).toEqual({
    uuid,
    // We always write status as pending when waiting.
    status: "pending",
    entry: expect.toBeCloseToDate(),
    wait: expect.toBeCloseToDate(),
    due: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag", "hello"],
  });

  await task.reload();
  expect(task.isModified).toBeFalsy();

  expect(toJSON(task)).toEqual({
    uuid,
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the task",
    tags: ["MyTag", "OtherTag"],
    project: "Foo",
  });
});
