import tw from ".";
import { buildTaskDb, cleanTaskDb } from "../test";

afterEach(cleanTaskDb);

test("basic listing", async (): Promise<void> => {
  await buildTaskDb([
    ["add", "basic task"],
  ]);

  let warrior = await tw();

  let tasks = await warrior.list();
  expect(tasks).toHaveLength(1);
  expect(tasks[0].description).toBe("basic task");
  expect(tasks[0].isModified).toBeFalsy();
});
