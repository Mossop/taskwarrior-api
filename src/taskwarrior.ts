import execa from "execa";

import { TasksDecoder } from "./decoders";
import { BaseTask } from "./interfaces";
import { Task, InternalTask } from "./task";

export interface TaskWarriorOptions {
  taskwarrior?: string;
  taskRc?: string;
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

export class TaskWarrior {
  private settings: Settings;

  private constructor(private readonly options: Readonly<TaskWarriorOptions>) {
    this.settings = defaultSettings();
  }

  private async execTask(args: string[], settings: Settings = {}, stdin?: string): Promise<string> {
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

  private async reloadConfiguration(): Promise<void> {
    return;
  }

  public async list(filter: string[] = []): Promise<Task[]> {
    let data = await this.execTask([...filter, "export"]);
    let baseTasks = await TasksDecoder.decodePromise(JSON.parse(data));
    return baseTasks.map((base: BaseTask): Task => new InternalTask(this, base));
  }

  public static async create(options: TaskWarriorOptions = {}): Promise<TaskWarrior> {
    let tw = new TaskWarrior(options);
    await tw.reloadConfiguration();
    return tw;
  }
}
