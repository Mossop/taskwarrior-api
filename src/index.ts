import { TaskWarrior, TaskWarriorOptions } from "./taskwarrior";

export type { TaskWarriorOptions } from "./taskwarrior";
export type { Task, Annotations, Annotation, Tags } from "./task";
export type { InputTask } from "./interfaces";

export default function(options?: TaskWarriorOptions): Promise<TaskWarrior> {
  return TaskWarrior.create(options);
}
