import { DateTime } from "luxon";

export interface BaseAnnotation {
  readonly entry: DateTime;
  readonly description: string;
}

export type UUID = string;

export enum Status {
  Pending = "pending",
  Deleted = "deleted",
  Completed = "completed",
  Waiting = "waiting",
  Recurring = "recurring",
}

export interface BaseTask {
  readonly uuid: UUID;
  readonly status: Status;
  description: string;
  entry: DateTime;
  start?: DateTime;
  readonly end?: DateTime;
  due?: DateTime;
  wait?: DateTime;
  until?: DateTime;
  recur?: string;
  parent?: string;
  mask?: string;
  imask?: number;
  readonly modified: DateTime;
  scheduled?: DateTime;
  project?: string;
  priority?: string;
  depends: string[];
  tags: string[];
  readonly urgency: number;
  readonly annotations: BaseAnnotation[];
}

type RecurrenceFields = "parent" | "mask" | "imask";
type GeneratedFields = "uuid" | "status" | "modified" | "urgency";
export type ExposedTask = Omit<BaseTask, RecurrenceFields | "depends" | "annotations" | "tags">;
export type InputTask = Omit<ExposedTask, GeneratedFields | "end">;
