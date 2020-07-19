import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";

import { Annotation, Status, CreateTask, ImportableTask, ImportableAnnotation } from "./interfaces";
import { Task } from "./task";

function iso(dt: DateTime): string;
function iso(dt: DateTime | null | undefined): string | undefined;
function iso(dt: DateTime | null | undefined): string | undefined {
  if (!dt) {
    return undefined;
  }

  return dt.set({ millisecond: 0 }).toISO({ suppressMilliseconds: true });
}

/**
 * Taskwarrior doesn't support millisecond precision so this rounds a date as needed.
 */
function rounded(dt: DateTime): DateTime {
  if (dt.millisecond == 0) {
    return dt;
  }

  if (dt.millisecond >= 500) {
    dt = dt.plus({ second: 1 });
  }
  return dt.set({ millisecond: 0 });
}

export function annotation(text: string, time: DateTime = DateTime.local()): Annotation {
  return {
    entry: time,
    description: text,
  };
}

export function toJSON(task: CreateTask | Task): ImportableTask {
  let annotations: Annotation[] | undefined = undefined;
  if (task.annotations?.length) {
    annotations = task.annotations.map((a: Annotation): Annotation => ({ ...a }));
    annotations.sort((a: Annotation, b: Annotation): number => {
      return a.entry.valueOf() - b.entry.valueOf();
    });

    annotations[0].entry = rounded(annotations[0].entry);
    for (let i = 1; i < annotations.length; i++) {
      annotations[i].entry = rounded(annotations[i].entry);

      // Taskwarrior doesn't support annotations with the same time, push dates forward a second
      // to make sure they don't conflict.
      if (annotations[i].entry <= annotations[i - 1].entry) {
        annotations[i].entry = annotations[i - 1].entry.plus({ second: 1 });
      }
    }
  }

  let tags = task.tags ? [...task.tags] : [];

  let result: ImportableTask = {
    uuid: task instanceof Task ? task.uuid : uuid(),
    // Taskwarrior will correctly set the status to waiting if there is a wait date.
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
    tags: tags.length ? tags : undefined,
    annotations: annotations?.map((a: Annotation): ImportableAnnotation => {
      return {
        entry: iso(a.entry),
        description: a.description,
      };
    }),
  };

  let optionalAttributes = [
    "status",
    "entry",
    "start",
    "end",
    "due",
    "wait",
    "until",
    "recur",
    "scheduled",
    "project",
    "tags",
    "annotations",
  ];

  for (let key of optionalAttributes) {
    if (result[key] === undefined || result[key] === null) {
      delete result[key];
    }
  }

  return result;
}
