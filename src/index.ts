import { TaskWarrior, TaskWarriorOptions, InternalTaskWarrior } from "./taskwarrior";

export type { TaskWarriorOptions, TaskWarrior } from "./taskwarrior";
export type { Task } from "./task";
export type { BaseTask, Annotation } from "./interfaces";
export { Status } from "./interfaces";
export { annotation } from "./task";

export default async function(options: TaskWarriorOptions = {}): Promise<TaskWarrior> {
  let tw = new InternalTaskWarrior(options);
  await tw.reloadConfiguration();
  return tw;
}
