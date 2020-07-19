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
    entry: rounded(time),
    description: text,
  };
}

export function annotationsEqual(a: Annotation, b: Annotation): boolean {
  return a.entry == b.entry && a.description == b.description;
}

export function addAnnotation(annotations: Annotation[], ann: Annotation): void {
  let i = 0;
  while (i < annotations.length && annotations[i].entry < ann.entry) {
    i++;
  }

  // Did we hit the end of the array?
  if (i == annotations.length) {
    annotations.push(ann);
    return;
  }

  // Can we just insert here?
  if (annotations[i].entry > ann.entry) {
    annotations.splice(i, 0, ann);
    return;
  }

  // If the dates are the same then increment this one and insert it afterwards.
  ann.entry = ann.entry.plus({ second: 1 });
  annotations.splice(i + 1, 0, ann);

  // Maybe increase the remainder.
  i += 2;
  while (i < annotations.length) {
    // Should never be less than but for safety...
    if (annotations[i].entry <= annotations[i - 1].entry) {
      annotations[i].entry = annotations[i - 1].entry.plus({ second: 1 });
    } else {
      // Nothing more to do now.
      return;
    }

    i++;
  }
}

export function toJSON(task: CreateTask | Task): ImportableTask {
  let annotations: Annotation[] | undefined = undefined;
  if (task instanceof Task) {
    if (task.annotations.length) {
      annotations = [...task.annotations];
    }
  } else if (task.annotations?.length) {
    annotations = [];
    for (let ann of task.annotations) {
      addAnnotation(annotations, ann);
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
