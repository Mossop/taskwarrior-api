import { DateTime } from "luxon";

import tw from "../src";
import { buildTaskDb, cleanTaskDb } from "./utils";

afterEach(cleanTaskDb);

test("basic listing", async (): Promise<void> => {
  let entry = DateTime.utc(2020, 11, 8, 11, 12, 13);
  await buildTaskDb([
    ["add", `entry:${entry.toISO({ suppressMilliseconds: true })}`, "basic task"],
  ]);

  let warrior = await tw();

  let tasks = await warrior.list();
  expect(tasks).toHaveLength(1);
  expect(tasks[0].description).toBe("basic task");
  expect(tasks[0].entry.toUTC().toISO()).toBe(entry.toISO());
  expect(tasks[0].isModified).toBeFalsy();
});
