import { DateTime } from "luxon";

import { BaseTask, ExposedTask, BaseAnnotation, Status, UUID, InputTask } from "./interfaces";
import { TaskWarrior } from "./taskwarrior";

export class Annotation implements BaseAnnotation {
  protected constructor(private readonly _base: BaseAnnotation) {
  }

  public get entry(): DateTime {
    return this._base.entry;
  }

  public get description(): string {
    return this._base.description;
  }
}

export class Annotations implements Iterable<Annotation> {
  private readonly _annotations: Annotation[];

  protected constructor(annotations: BaseAnnotation[]) {
    this._annotations = annotations.map((ann: BaseAnnotation): Annotation => {
      return new InternalAnnotation(ann);
    });
  }

  public get isModified(): boolean {
    return false;
  }

  public get [Symbol.iterator](): () => Iterator<Annotation> {
    return this._annotations[Symbol.iterator];
  }
}

export class Tags implements Iterable<string> {
  protected constructor(private readonly _tags: string[]) {
  }

  public get isModified(): boolean {
    return false;
  }

  public get [Symbol.iterator](): () => Iterator<string> {
    return this._tags[Symbol.iterator];
  }
}

export class Task implements ExposedTask {
  private readonly _annotations: Annotations;
  private readonly _tags: Tags;
  private _updates: Partial<InputTask>;

  protected constructor(
    private readonly _warrior: TaskWarrior,
    private _base: BaseTask,
  ) {
    this._annotations = new InternalAnnotations(_base.annotations);
    this._tags = new InternalTags(_base.tags);
    this._updates = {};
  }

  private getField<K extends keyof ExposedTask>(field: K): ExposedTask[K] {
    if (field in this._updates) {
      // @ts-ignore: InputTask is a subset of ExposedTask
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return this._updates[field];
    }
    return this._base[field];
  }

  private setField<K extends keyof InputTask>(field: K, value: InputTask[K]): void {
    this._updates[field] = value;
  }

  /**
   * Gets the parent recurring task for a child. If this is not a child recurring task then this
   * will return null.
   */
  public get parent(): Promise<Task | null> {
    if (!this._base.parent) {
      return Promise.resolve(null);
    }

    return this._warrior.list([this._base.parent]).then((tasks: Task[]): Task | null => {
      if (tasks.length) {
        return tasks[0];
      }
      return null;
    });
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
  public get annotations(): Annotations {
    return this._annotations;
  }

  /**
   * The tags assigned to a task.
   */
  public get tags(): Tags {
    return this._tags;
  }

  /**
   * Whether there are any in-memory modifications that need to be committed to the task database.
   */
  public get isModified(): boolean {
    return Object.keys(this._updates).length > 0 ||
      this.annotations.isModified || this.tags.isModified;
  }

  /**
   * Commits modifications to the task database and then reloads any new changes for this task.
   */
  public async commit(): Promise<void> {
    return this.refresh();
  }

  /**
   * Reloads this task from the task database bringing in any new changes and discarding any
   * uncommitted modifications.
   */
  public async refresh(): Promise<void> {
    let updated = await this._warrior.list([`uuid:${this.uuid}`]);
    if (updated.length) {
      this._base = updated[0]._base;
    }
    this._updates = {};
  }

  /**
   * The task's unique identifier.
   */
  public get uuid(): UUID {
    return this.getField("uuid");
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
  public get start(): DateTime | undefined {
    return this.getField("start");
  }
  public set start(val: DateTime | undefined) {
    this.setField("start", val);
  }

  /**
   * When the task was completed or deleted, unset for other statuses.
   */
  public get end(): DateTime | undefined {
    return this.getField("end");
  }

  /**
   * When the task is due.
   */
  public get due(): DateTime | undefined {
    return this.getField("due");
  }
  public set due(val: DateTime | undefined) {
    this.setField("due", val);
  }

  /**
   * Marks a task as hidden until the wait date.
   */
  public get wait(): DateTime | undefined {
    return this.getField("wait");
  }
  public set wait(val: DateTime | undefined) {
    this.setField("wait", val);
  }

  /**
   * When recurrence will end.
   */
  public get until(): DateTime | undefined {
    return this.getField("until");
  }
  public set until(val: DateTime | undefined) {
    this.setField("until", val);
  }

  /**
   * How often to recur. Only set for parent or child recurring tasks.
   */
  public get recur(): string | undefined {
    return this.getField("recur");
  }
  public set recur(val: string | undefined) {
    this.setField("recur", val);
  }

  /**
   * When the task was last modified.
   */
  public get modified(): DateTime {
    return this.getField("modified");
  }

  /**
   * When the task is available to start.
   */
  public get scheduled(): DateTime | undefined {
    return this.getField("scheduled");
  }
  public set scheduled(val: DateTime | undefined) {
    this.setField("scheduled", val);
  }

  /**
   * The project a task belongs to.
   */
  public get project(): string | undefined {
    return this.getField("project");
  }
  public set project(val: string | undefined) {
    this.setField("project", val);
  }

  /**
   * The priority of the task.
   */
  public get priority(): string | undefined {
    return this.getField("priority");
  }
  public set priority(val: string | undefined) {
    this.setField("priority", val);
  }

  /**
   * The urgency of the task.
   */
  public get urgency(): number {
    return this.getField("urgency");
  }
}

class InternalAnnotation extends Annotation {
  public constructor(base: BaseAnnotation) {
    super(base);
  }
}

class InternalAnnotations extends Annotations {
  public constructor(annotations: BaseAnnotation[]) {
    super(annotations);
  }
}

class InternalTags extends Tags {
  public constructor(tags: string[]) {
    super(tags);
  }
}

export class InternalTask extends Task {
  public constructor(warrior: TaskWarrior, base: BaseTask) {
    super(warrior, base);
  }
}
