import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";

import {
  BaseTask,
  ExposedTask,
  Annotation,
  Status,
  UUID,
  ParsedTask,
  CreateTask,
  ImportableTask,
} from "./interfaces";
import { InternalTaskWarrior } from "./taskwarrior";

function iso(dt: DateTime | null | undefined): string | undefined {
  if (!dt) {
    return undefined;
  }

  return dt.toISO({ suppressMilliseconds: true });
}

export abstract class Task implements ExposedTask {
  private readonly _annotations: Annotation[];
  private readonly _tags: Set<string>;
  private _updates: Partial<BaseTask>;

  protected constructor(
    private readonly _warrior: InternalTaskWarrior,
    private _base: ParsedTask,
  ) {
    this._annotations = [..._base.annotations];
    this._tags = new Set(_base.tags);
    this._updates = {};
  }

  private getField<K extends keyof BaseTask>(field: K): BaseTask[K] {
    let updated = this._updates[field] as BaseTask[K] | undefined;
    if (updated) {
      return updated;
    }
    return this._base[field];
  }

  private setField<K extends keyof BaseTask>(field: K, value: BaseTask[K]): void {
    if (this._base[field] == value) {
      delete this._updates[field];
    } else {
      this._updates[field] = value;
    }
  }

  /**
   * Gets the parent recurring task for a child. If this is not a child recurring task then this
   * will return null.
   */
  public get parent(): Promise<Task | null> {
    if (!this._base.parent) {
      return Promise.resolve(null);
    }

    return this._warrior.get(this._base.parent);
  }

  /**
   * For a parent recurring task the existing child tasks. For a task that isn't a parent this will
   * throw an exception.
   */
  public get children(): Promise<Task[]> {
    if (this.status != Status.Recurring) {
      throw new Error("Task is not a recurring parent.");
    }

    return this._warrior.list([`parent:${this.uuid}`]);
  }

  /**
   * The annotations on a task.
   */
  public get annotations(): Annotation[] {
    return this._annotations;
  }

  /**
   * The tags assigned to a task.
   */
  public get tags(): Set<string> {
    return this._tags;
  }

  /**
   * Whether there are any in-memory modifications that need to be committed to the task database.
   */
  public get isModified(): boolean {
    if (Object.keys(this._updates).length) {
      return true;
    }

    if (this._tags.size != this._base.tags.length) {
      return true;
    }

    if (this._annotations.length != this._base.annotations.length) {
      return true;
    }

    for (let tag of this._base.tags) {
      if (!this._tags.has(tag)) {
        return true;
      }
    }

    // Not perfect, but good enough.
    for (let annotation of this._base.annotations) {
      if (!this._annotations.includes(annotation)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Pushes local modifications to the task database and then reloads any new changes for this task.
   */
  public async update(): Promise<void> {
    return this.reload();
  }

  /**
   * Writes the current state of this task to the task database overwriting any changes that may
   * have been made there since this task was retrieved.
   */
  public async save(): Promise<void> {
    return this.reload();
  }

  /**
   * Reloads this task from the task database bringing in any new changes and discarding any
   * uncommitted modifications.
   */
  public async reload(): Promise<void> {
    let updated = await this._warrior.get(this.uuid);
    if (updated) {
      this._base = updated._base;
    }
    this._updates = {};
  }

  /**
   * The task's unique identifier.
   */
  public get uuid(): UUID {
    return this._base.uuid;
  }

  /**
   * The task's status.
   */
  public get status(): Status {
    return this.getField("status");
  }

  /**
   * The task's description.
   */
  public get description(): string {
    return this.getField("description");
  }
  public set description(val: string) {
    this.setField("description", val);
  }

  /**
   * The date the task was created.
   */
  public get entry(): DateTime {
    return this.getField("entry");
  }
  public set entry(val: DateTime) {
    this.setField("entry", val);
  }

  /**
   * When the task was started.
   */
  public get start(): DateTime | null {
    return this.getField("start");
  }
  public set start(val: DateTime | null) {
    this.setField("start", val);
  }

  /**
   * When the task was completed or deleted, unset for other statuses.
   */
  public get end(): DateTime | null {
    return this.getField("end");
  }
  public set end(val: DateTime | null) {
    this.setField("end", val);
  }

  /**
   * When the task is due.
   */
  public get due(): DateTime | null {
    return this.getField("due");
  }
  public set due(val: DateTime | null) {
    this.setField("due", val);
  }

  /**
   * Marks a task as hidden until the wait date.
   */
  public get wait(): DateTime | null {
    return this.getField("wait");
  }
  public set wait(val: DateTime | null) {
    this.setField("wait", val);
  }

  /**
   * When recurrence will end.
   */
  public get until(): DateTime | null {
    return this.getField("until");
  }
  public set until(val: DateTime | null) {
    this.setField("until", val);
  }

  /**
   * How often to recur. Only set for parent or child recurring tasks.
   */
  public get recur(): string | null {
    return this.getField("recur");
  }
  public set recur(val: string | null) {
    this.setField("recur", val);
  }

  /**
   * When the task was last modified.
   */
  public get modified(): DateTime {
    return this._base.modified;
  }

  /**
   * When the task is available to start.
   */
  public get scheduled(): DateTime | null {
    return this.getField("scheduled");
  }
  public set scheduled(val: DateTime | null) {
    this.setField("scheduled", val);
  }

  /**
   * The project a task belongs to.
   */
  public get project(): string | null {
    return this.getField("project");
  }
  public set project(val: string | null) {
    this.setField("project", val);
  }

  /**
   * The urgency of the task.
   */
  public get urgency(): number {
    return this._base.urgency;
  }
}

export function toJSON(task: CreateTask | Task): ImportableTask {
  let result: ImportableTask = {
    uuid: task instanceof Task ? task.uuid : uuid(),
    status: task.status == Status.Waiting ? Status.Pending : task.status,
    description: task.description,
    entry: iso(task.entry),
    start: iso(task.start),
    end: iso(task.end),
    due: iso(task.due),
    wait: iso(task.wait),
    until: iso(task.until),
    recur: task.recur,
    scheduled: iso(task.scheduled),
    project: task.project,
    tags: task.tags ? [...task.tags] : undefined,
    annotations: task.annotations ? [...task.annotations] : undefined,
  };

  // Taskwarrior dislikes nulls and undefineds so strip out those properties.
  return Object.fromEntries(
    Object.entries(result)
      .filter(([_key, value]: [string, unknown]): boolean => {
        return value !== undefined && value !== null;
      }),
  ) as ImportableTask;
}

// These classes exist to hide functionality to be exposed to tests from the public interface.
// Use them at your peril!

export class InternalTask extends Task {
  public constructor(warrior: InternalTaskWarrior, base: ParsedTask) {
    super(warrior, base);
  }

  public toJSON(): Record<string, unknown> {
    return toJSON(this);
  }

  public updateArguments(): string[] {
    return [];
  }
}
