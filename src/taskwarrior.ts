import execa from "execa";

import { TasksDecoder } from "./decoders";
import { ParsedTask, CreateTask, ImportableTask } from "./interfaces";
import { Task, InternalTask, toJSON } from "./task";

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

  public async reloadConfiguration(): Promise<void> {
    return;
  }

  public async get(uuid: string): Promise<Task | null> {
    let tasks = await this.list([`uuid:${uuid}`]);
    if (tasks.length == 1) {
      return tasks[0];
    }
    return null;
  }

  public async list(filter: string[] = []): Promise<Task[]> {
    let data = await this.execTask([...filter, "export"]);
    let baseTasks = await TasksDecoder.decodePromise(JSON.parse(data));
    return baseTasks.map((base: ParsedTask): Task => this.buildTask(base));
  }

  public async count(filter: string[] = []): Promise<number> {
    let data = await this.execTask([...filter, "count"]);
    return parseInt(data.trim());
  }

  public async create(task: CreateTask): Promise<Task> {
    let created = await this.bulkCreate([task]);
    return created[0];
  }

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
}

export class InternalTaskWarrior extends TaskWarrior {
  public constructor(options: Readonly<TaskWarriorOptions>) {
    super(options);
  }

  public async execTask(args: string[], settings: Settings = {}, stdin?: string): Promise<string> {
    return super.execTask(args, settings, stdin);
  }

  protected buildTask(parsed: ParsedTask): Task {
    return new InternalTask(this, parsed);
  }
}
