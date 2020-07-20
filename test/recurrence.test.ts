import { DateTime } from "luxon";

import tw, { Status, Task } from "../src";
import { toJSON } from "../src/utils";
import { expect, UUID_REGEX } from "./expect";
import { cleanTaskDb, buildTaskDb } from "./utils";

afterEach(cleanTaskDb);

function dtCompare(a: DateTime | null, b: DateTime | null): number {
  return (a?.toSeconds() ?? 0) - (b?.toSeconds() ?? 0);
}

test("Basic lookup", async (): Promise<void> => {
  await buildTaskDb([
    [
      "add",
      "recur:monthly",
      "due:2030-08-01T07:00:00Z",
      "the recurring task",
    ],
  ], {
    "recurrence.limit": "3",
  });

  let warrior = await tw();

  let tasks = await warrior.list();

  expect(tasks).toHaveLength(4);
  let parent = tasks.find((task: Task): boolean => task.status == Status.Recurring)!;
  expect(parent).not.toBeUndefined();

  expect(toJSON(parent)).toEqual({
    uuid: expect.stringMatching(UUID_REGEX),
    status: "recurring",
    entry: expect.toBeCloseToDate(),
    description: "the recurring task",
    recur: "monthly",
    due: expect.toEqualDate(DateTime.utc(2030, 8, 1, 7, 0, 0)),
  });

  let children = tasks.filter((task: Task): boolean => task != parent);
  children.sort((a: Task, b: Task): number => dtCompare(a.due, b.due));

  expect(children.map(toJSON)).toEqual([{
    uuid: expect.stringMatching(UUID_REGEX),
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the recurring task",
    recur: "monthly",
    due: expect.toEqualDate(DateTime.utc(2030, 8, 1, 7, 0, 0)),
  }, {
    uuid: expect.stringMatching(UUID_REGEX),
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the recurring task",
    recur: "monthly",
    due: expect.toEqualDate(DateTime.utc(2030, 9, 1, 7, 0, 0)),
  }, {
    uuid: expect.stringMatching(UUID_REGEX),
    status: "pending",
    entry: expect.toBeCloseToDate(),
    description: "the recurring task",
    recur: "monthly",
    due: expect.toEqualDate(DateTime.utc(2030, 10, 1, 7, 0, 0)),
  }]);

  let parents = await Promise.all(children.map((task: Task): Promise<Task | null> => task.parent));
  let uuids = parents.map((task: Task | null): string | undefined => task?.uuid);
  expect(uuids).toEqual([
    parent.uuid,
    parent.uuid,
    parent.uuid,
  ]);

  let foundChildren = await parent.children;
  foundChildren?.sort((a: Task, b: Task): number => dtCompare(a.due, b.due));
  expect(foundChildren?.map((task: Task): string => task.uuid)).toEqual([
    children[0].uuid,
    children[1].uuid,
    children[2].uuid,
  ]);
});
