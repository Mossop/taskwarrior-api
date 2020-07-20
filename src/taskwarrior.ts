import execa from "execa";

import { TasksDecoder } from "./decoders";
import { ParsedTask, CreateTask, ImportableTask } from "./interfaces";
import { Task, InternalTask } from "./task";
import { toJSON } from "./utils";

export interface TaskWarriorOptions {
  /**
   * The path to the taskwarrior binary. By default `task` in the system path is used.
   */
  taskwarrior?: string;
  /**
   * The path to the `.taskrc` file. Normal Taskwarrior defaults apply.
   */
  taskRc?: string;
  /**
   * The path to the tasks directory. Normal Taskwarrior defaults apply.
   */
  taskDirectory?: string;
}

type Settings = Record<string, string | number>;

function defaultSettings(): Settings {
  return {
    confirmation: "no",
    ["allow.empty.filter"]: "yes",
    bulk: 0,
    ["recurrence.confirmation"]: "yes",
    ["rc.json.array"]: "on",
  };
}

/**
 * Accesses a Taskwarrior database.
 */
export abstract class TaskWarrior {
  private settings: Settings;

  protected constructor(private readonly options: Readonly<TaskWarriorOptions>) {
    this.settings = defaultSettings();
  }

  protected async execTask(
    args: string[],
    settings: Settings = {},
    stdin?: string,
  ): Promise<string> {
    settings = Object.assign({}, this.settings, settings);
    let allArgs = [...args];
    for (let [name, value] of Object.entries(settings)) {
      allArgs.unshift(`rc.${name}=${value}`);
    }

    let env: Record<string, string> = {};
    if (this.options.taskRc) {
      env["TASKRC"] = this.options.taskRc;
    }
    if (this.options.taskDirectory) {
      env["TASKDATA"] = this.options.taskDirectory;
    }
    let results = await execa(this.options.taskwarrior ?? "task", allArgs, {
      input: stdin,
      env,
    });

    return results.stdout;
  }

  protected abstract buildTask(parsed: ParsedTask): Task;

  /**
   * Reloads the task configuration from the database.
   */
  public async reloadConfiguration(): Promise<void> {
    return;
  }

  /**
   * Gets the task with the given uuid or null if there is no such task.
   */
  public async get(uuid: string): Promise<Task | null> {
    let tasks = await this.list([`uuid:${uuid}`]);
    if (tasks.length == 1) {
      return tasks[0];
    }
    return null;
  }

  /**
   * Lists tasks based on a filter.
   *
   * The filter strings are arguments to the task binary.
   */
  public async list(filter: string[] = []): Promise<Task[]> {
    let baseTasks = await this.internalList(filter);
    return baseTasks.map((base: ParsedTask): Task => this.buildTask(base));
  }

  protected async internalList(filter: string[] = []): Promise<ParsedTask[]> {
    let data = await this.execTask([...filter, "export"]);
    return TasksDecoder.decodePromise(JSON.parse(data));
  }

  /**
   * Counts tasks based on a filter.
   *
   * The filter strings are arguments to the task binary.
   */
  public async count(filter: string[] = []): Promise<number> {
    let data = await this.execTask([...filter, "count"]);
    return parseInt(data.trim());
  }

  /**
   * Creates a new task.
   */
  public async create(task: CreateTask): Promise<Task> {
    let created = await this.bulkCreate([task]);
    return created[0];
  }

  /**
   * Creates a list of tasks.
   *
   * The returned task objects are in the same order as the objects provided.
   */
  public async bulkCreate(tasks: CreateTask[]): Promise<Task[]> {
    let json = tasks.map(toJSON);
    await this.execTask(["import"], undefined, JSON.stringify(json));
    let uuids = json.map((item: ImportableTask): string => item.uuid);

    let imported = await this.list(uuids);
    return uuids.map((wanted: string, index: number): Task => {
      let found = imported.find((task: Task): boolean => task.uuid == wanted);
      if (found) {
        return found;
      }

      throw new Error(`Failed to import task: ${JSON.stringify(tasks[index])}`);
    });
  }

  /**
   * Saves a list of tasks.
   *
   * Equivalent to calling `save()` on each task object but reduces the number
   * of operations required.
   */
  public async bulkSave(tasks: Task[]): Promise<void> {
    let internals = tasks.map((task: Task): InternalTask => {
      if (task instanceof InternalTask) {
        return task;
      }
      throw new Error("Custom task implementations are not supported.");
    });

    await this.execTask(["import"], undefined, JSON.stringify(internals));
    let uuids = internals.map((item: Task): string => item.uuid);

    let imported = await this.internalList(uuids);
    for (let task of internals) {
      let found = imported.find((t: ParsedTask): boolean => t.uuid == task.uuid);
      if (found) {
        task.overwrite(found);
      } else {
        throw new Error(`Failed to save task ${task.uuid}`);
      }
    }
  }
}

export class InternalTaskWarrior extends TaskWarrior {
  public constructor(options: Readonly<TaskWarriorOptions>) {
    super(options);
  }

  public async execTask(args: string[], settings: Settings = {}, stdin?: string): Promise<string> {
    return super.execTask(args, settings, stdin);
  }

  public async internalList(filter: string[] = []): Promise<ParsedTask[]> {
    return super.internalList(filter);
  }

  protected buildTask(parsed: ParsedTask): Task {
    return new InternalTask(this, parsed);
  }
}
