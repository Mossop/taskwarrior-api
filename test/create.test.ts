import { DateTime } from "luxon";

import tw, { Status } from "../src";
import { toJSON, annotation } from "../src/utils";
import { expect, UUID_REGEX } from "./expect";
import { buildTaskDb, cleanTaskDb } from "./utils";

afterEach(cleanTaskDb);

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
  });

  let found = await warrior.list();
  expect(found).toHaveLength(1);

  expect(toJSON(found[0])).toEqual(toJSON(built));
});

test("create completed", async (): Promise<void> => {
  await buildTaskDb();

  let warrior = await tw();

  let list = await warrior.list();
  expect(list).toHaveLength(0);

  let built = await warrior.create({
    status: Status.Completed,
    description: "done task",
  });

  expect(toJSON(built)).toEqual({
    uuid: expect.stringMatching(UUID_REGEX),
    entry: expect.toBeCloseToDate(DateTime.local()),
    status: Status.Completed,
    end: expect.toBeCloseToDate(DateTime.local()),
    description: "done task",
  });

  let found = await warrior.list();
  expect(found).toHaveLength(1);

  expect(toJSON(found[0])).toEqual(toJSON(built));
});

test("tags and annotations", async (): Promise<void> => {
  await buildTaskDb();

  let warrior = await tw();

  let list = await warrior.list();
  expect(list).toHaveLength(0);

  let [withTags, withAnnotations] = await warrior.bulkCreate([{
    description: "with tags task",
    tags: ["a", "foo", "bar"],
  }, {
    description: "with annotations",
    annotations: [
      annotation("foo"),
      annotation("bar"),
    ],
  }]);

  expect(toJSON(withTags)).toEqual({
    uuid: expect.stringMatching(UUID_REGEX),
    entry: expect.toBeCloseToDate(DateTime.local()),
    status: Status.Pending,
    description: "with tags task",
    tags: ["a", "foo", "bar"],
  });

  expect(toJSON(withAnnotations)).toEqual({
    uuid: expect.stringMatching(UUID_REGEX),
    entry: expect.toBeCloseToDate(DateTime.local()),
    status: Status.Pending,
    description: "with annotations",
    annotations: [{
      entry: expect.toBeCloseToDate(DateTime.local()),
      description: "foo",
    }, {
      entry: expect.toBeCloseToDate(DateTime.local()),
      description: "bar",
    }],
  });
});
