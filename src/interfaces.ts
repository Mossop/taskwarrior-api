import { DateTime } from "luxon";

export interface Annotation {
  entry: DateTime;
  description: string;
}

export enum Status {
  Pending = "pending",
  Deleted = "deleted",
  Completed = "completed",
  Waiting = "waiting",
  Recurring = "recurring",
}

export interface BaseTask {
  status: Status;
  description: string;
  entry: DateTime;
  start: DateTime | null;
  end: DateTime | null;
  due: DateTime | null;
  wait: DateTime | null;
  until: DateTime | null;
  recur: string | null;
  scheduled: DateTime | null;
  project: string | null;
  tags: string[];
  annotations: Annotation[];
}

export type CreateTask = Partial<BaseTask> & {
  description: string;
};

type IntoImportable<T> =
  T extends DateTime
    ? string
    : T;

type Importable<T> = {
  [K in keyof T]: IntoImportable<T[K]>;
};

export interface ImportableAnnotation {
  entry: string;
  description: string;
}

export type ImportableTask = Importable<Omit<CreateTask, "annotations">> & {
  uuid: string;
  annotations?: ImportableAnnotation[];
};

type ReplacedFields = "tags" | "annotations" | "depends";

interface TaskRecurrence {
  parent: string | null;
  mask: string | null;
  imask: number | null;
}

interface GeneratedTaskFields {
  readonly uuid: string;
  readonly modified: DateTime;
  readonly urgency: number;
}

export type ExposedTask = Omit<BaseTask & GeneratedTaskFields, ReplacedFields>;
export type ParsedTask = BaseTask & GeneratedTaskFields & TaskRecurrence;
