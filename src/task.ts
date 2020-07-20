import { DateTime } from "luxon";

import {
  BaseTask,
  ExposedTask,
  Annotation,
  Status,
  ParsedTask,
} from "./interfaces";
import { InternalTaskWarrior } from "./taskwarrior";
import { toJSON, annotation, annotationsEqual, addAnnotation } from "./utils";

/**
 * Holds the list of annotations in sorted order.
 *
 * Operates similar to a readonly array, most array operations are provided.
 * Annotations can be added and removed with the `add` and `delete` methods.
 * Annotations are always listed in date order.
 *
 * Since Taskwarrior does not support annotations with matching dates dates may
 * be altered slightly when added to avoid collisions.
 */
export abstract class Annotations implements Iterable<Annotation> {
  private _annotations: Annotation[];

  protected constructor(annotations: Annotation[]) {
    this._annotations = [];
    for (let ann of annotations) {
      addAnnotation(this._annotations, ann);
    }
  }

  /**
   * Adds a new annotation.
   *
   * If no date is provided then the current date is used.
   *
   * Important to note is that task warrior does not support multiple
   * annotations with the same time. If you attempt to add such an annotation
   * its time will be slightly altered to avoid overlapping with existing
   * annotations.
   */
  public add(ann: Annotation): void;
  public add(description: string, dt?: DateTime): void;
  public add(arg0: string | Annotation, dt?: DateTime): void {
    let ann = typeof arg0 == "string" ? annotation(arg0, dt) : arg0;

    addAnnotation(this._annotations, ann);
  }

  /**
   * Deletes the given annotation.
   *
   * Returns true if an annotation was deleted, false if no such annotation
   * exists.
   */
  public delete(annotation: Annotation): boolean {
    for (let i = 0; i < this._annotations.length; i++) {
      if (annotationsEqual(this._annotations[i], annotation)) {
        this._annotations.splice(i, 1);
        return true;
      }
    }

    return false;
  }

  /**
   * Equivalent to the `Array.prototype.find` method.
   */
  public find(callbackfn: (value: Annotation, index: number) => boolean): Annotation | undefined {
    return this._annotations.find(callbackfn);
  }

  /**
   * Equivalent to the `Array.prototype.slice` method.
   */
  public slice(start?: number, end?: number): Annotation[] {
    return this._annotations.slice(start, end);
  }

  /**
   * Equivalent to the `Array.prototype.includes` method.
   */
  public includes(annotation: Annotation): boolean {
    return this._annotations.find(
      (a: Annotation): boolean => annotationsEqual(a, annotation),
    ) != undefined;
  }

  /**
   * Equivalent to the `Array.prototype.filter` method.
   */
  public filter(callbackfn: (value: Annotation, index: number) => boolean): Annotation[] {
    return this._annotations.filter(callbackfn);
  }

  /**
   * Equivalent to the `Array.prototype.map` method.
   */
  public map<T>(callbackfn: (value: Annotation, index: number) => T): T[] {
    return this._annotations.map(callbackfn);
  }

  /**
   * Gets the annotation at the given index.
   */
  public get(item: number): Annotation | undefined {
    return this._annotations[item];
  }

  /**
   * Returns the number of annotations.
   */
  public get length(): number {
    return this._annotations.length;
  }

  public get [Symbol.iterator](): () => Iterator<Annotation> {
    return (): Iterator<Annotation> => {
      return this._annotations[Symbol.iterator]();
    };
  }
}

const numeric = /^\d+$/;

function annotations(
  annotations: Annotations,
): Annotations & Record<number, Annotation | undefined> {
  return new Proxy(annotations, {
    get(target: Annotations, property: string | symbol): unknown {
      if (typeof property == "string" && numeric.test(property)) {
        return target.get(parseInt(property));
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return target[property];
    },
  }) as Annotations & Record<number, Annotation | undefined>;
}

/**
 * A single task.
 *
 * Modifications to this object are held in memory and not written to
 * Taskwarrior's database until the `save` or `update` method is called.
 */
export abstract class Task implements ExposedTask {
  private _annotations: Annotations & Record<number, Annotation | undefined>;
  private _tags: Set<string> = new Set();
  private _updates: Partial<BaseTask> = {};

  protected constructor(
    private readonly _warrior: InternalTaskWarrior,
    private _base: ParsedTask,
  ) {
    this._annotations = annotations(new InternalAnnotations(this._base.annotations));
    this._tags = new Set(this._base.tags);
    this._updates = {};
  }

  protected initFrom(base: ParsedTask): void {
    this._base = base;

    this._annotations = annotations(new InternalAnnotations(this._base.annotations));
    this._tags = new Set(this._base.tags);
    this._updates = {};
  }

  private getField<K extends keyof BaseTask>(field: K): BaseTask[K] {
    if (field in this._updates) {
      return this._updates[field] as BaseTask[K];
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
   * Gets the parent recurring task for a child.
   *
   * If this is not a child recurring task then this will return null.
   */
  public get parent(): Promise<Task | null> {
    if (!this._base.parent) {
      return Promise.resolve(null);
    }

    return this._warrior.get(this._base.parent);
  }

  /**
   * For a parent recurring task lists the existing child tasks.
   *
   * For a task that isn't a parent this will return null.
   */
  public get children(): Promise<Task[] | null> {
    if (this.status != Status.Recurring) {
      return Promise.resolve(null);
    }

    return this._warrior.list([`parent:${this.uuid}`]);
  }

  /**
   * The annotations on a task.
   */
  public get annotations(): Annotations & Record<number, Annotation | undefined> {
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
    return this._warrior.bulkSave([this]);
  }

  /**
   * Reloads this task from the task database bringing in any new changes and discarding any
   * unsaved modifications.
   */
  public async reload(): Promise<void> {
    let updated = await this._warrior.internalList([`uuid:${this.uuid}`]);
    if (updated.length == 0) {
      throw new Error("Missing task definition.");
    }

    this.initFrom(updated[0]);
  }

  /**
   * The task's unique identifier.
   */
  public get uuid(): string {
    return this._base.uuid;
  }

  /**
   * The task's status.
   */
  public get status(): Status {
    let status = this.getField("status");
    if (status == Status.Waiting || status == Status.Pending) {
      return this.wait ? Status.Waiting : Status.Pending;
    }
    return status;
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

// These classes exist to hide functionality to be exposed to tests from the public interface.
// Use them at your peril!

class InternalAnnotations extends Annotations {
  public constructor(annotations: Annotation[]) {
    super(annotations);
  }
}

export class InternalTask extends Task {
  public constructor(warrior: InternalTaskWarrior, base: ParsedTask) {
    super(warrior, base);
  }

  public toJSON(): Record<string, unknown> {
    return toJSON(this);
  }

  public overwrite(parsed: ParsedTask): void {
    this.initFrom(parsed);
  }
}
