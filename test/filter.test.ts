import tw, { TaskWarrior } from "../src";
import { buildTaskDb, cleanTaskDb, checkTaskDescriptions } from "./utils";

afterEach(cleanTaskDb);

async function checkFilter(tw: TaskWarrior, filter: string[], expected: string[]): Promise<void> {
  let tasks = await tw.list(filter);
  await expect(tw.count(filter)).resolves.toBe(tasks.length);
  checkTaskDescriptions(tasks, expected);
}

test("simple filters", async (): Promise<void> => {
  await buildTaskDb([
    ["add", "task 1"],
    ["add", "project:home", "task 2"],
    ["add", "project:work", "task 3"],
    ["add", "project:home", "tags:foob", "task 4"],
    ["log", "project:work", "task 5"],
  ]);

  let warrior = await tw();

  await checkFilter(warrior, [], [
    "task 1",
    "task 2",
    "task 3",
    "task 4",
    "task 5",
  ]);

  await checkFilter(warrior, ["+foob"], [
    "task 4",
  ]);

  await checkFilter(warrior, ["-foob"], [
    "task 1",
    "task 2",
    "task 3",
    "task 5",
  ]);

  await checkFilter(warrior, ["-foob"], [
    "task 1",
    "task 2",
    "task 3",
    "task 5",
  ]);

  await checkFilter(warrior, ["project:home"], [
    "task 2",
    "task 4",
  ]);

  await checkFilter(warrior, ["project:work"], [
    "task 3",
    "task 5",
  ]);

  await checkFilter(warrior, ["project:"], [
    "task 1",
  ]);

  await checkFilter(warrior, ["status:pending"], [
    "task 1",
    "task 2",
    "task 3",
    "task 4",
  ]);

  await checkFilter(warrior, ["status:completed"], [
    "task 5",
  ]);

  await checkFilter(warrior, ["status:pending", "-foob"], [
    "task 1",
    "task 2",
    "task 3",
  ]);

  await checkFilter(warrior, ["status:pending", "+foob"], [
    "task 4",
  ]);

  await checkFilter(warrior, ["status:completed", "+foob"], [
  ]);
});
