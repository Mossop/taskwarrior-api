import { DateTime } from "luxon";

import tw, { Status } from "../src";
import { toJSON } from "../src/task";
import { expect } from "./expect";
import { buildTaskDb, cleanTaskDb } from "./utils";

afterEach(cleanTaskDb);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

test("basic create", async (): Promise<void> => {
  await buildTaskDb();

  let warrior = await tw();

  let list = await warrior.list();
  expect(list).toHaveLength(0);

  let built = await warrior.create({
    description: "new task",
  });

  expect(toJSON(built)).toEqual({
    uuid: expect.stringMatching(UUID_REGEX),
    entry: expect.toBeCloseToDate(DateTime.local()),
    status: Status.Pending,
    description: "new task",
    annotations: [],
    tags: [],
  });

  let found = await warrior.list();
  expect(found).toHaveLength(1);

  expect(toJSON(found[0])).toEqual(toJSON(built));
});
