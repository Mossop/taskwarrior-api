import { DateTime } from "luxon";
import { JsonDecoder, Result, Ok, ok, err } from "ts.data.json";

import { Status, BaseTask, BaseAnnotation } from "./interfaces";

function MappingDecoder<A, B>(
  decoder: JsonDecoder.Decoder<A>,
  mapper: (data: A) => B,
  name: string,
): JsonDecoder.Decoder<B> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new JsonDecoder.Decoder<B>((json: any): Result<B> => {
    let result = decoder.decode(json);
    if (result instanceof Ok) {
      try {
        return ok<B>(mapper(result.value));
      } catch (e) {
        return err<B>(`Error decoding ${name}: ${e}`);
      }
    } else {
      return err<B>(result.error);
    }
  });
}

const DateTimeDecoder = MappingDecoder(JsonDecoder.string, (data: string): DateTime => {
  return DateTime.fromISO(data);
}, "DateTime");

const StatusDecoder = MappingDecoder(JsonDecoder.string, (data: string): Status => {
  // An enum is just an object mapping the representation to the value.
  let values = Object.values(Status) as string[];
  if (values.includes(data)) {
    return data as Status;
  }
  throw new Error(`${data} is not a valid status.`);
}, "Status");

const DependsDecoder = MappingDecoder(JsonDecoder.string, (data: string): string[] => {
  return data.split(",");
}, "Depends");

const TagsDecoder = JsonDecoder.oneOf([
  JsonDecoder.array(JsonDecoder.string, "Tags"),
  JsonDecoder.isUndefined([]),
], "Tags");

const AnnotationDecoder = JsonDecoder.object<BaseAnnotation>({
  entry: DateTimeDecoder,
  description: JsonDecoder.string,
}, "Annotation");

const AnnotationsDecoder = JsonDecoder.oneOf([
  JsonDecoder.array(AnnotationDecoder, "Annotations"),
  JsonDecoder.isUndefined([]),
], "Annotations");

export const TaskDecoder = JsonDecoder.object<BaseTask>({
  uuid: JsonDecoder.string,
  status: StatusDecoder,
  description: JsonDecoder.string,
  entry: DateTimeDecoder,
  start: JsonDecoder.optional(DateTimeDecoder),
  end: JsonDecoder.optional(DateTimeDecoder),
  due: JsonDecoder.optional(DateTimeDecoder),
  wait: JsonDecoder.optional(DateTimeDecoder),
  until: JsonDecoder.optional(DateTimeDecoder),
  recur: JsonDecoder.optional(JsonDecoder.string),
  parent: JsonDecoder.optional(JsonDecoder.string),
  mask: JsonDecoder.optional(JsonDecoder.string),
  imask: JsonDecoder.optional(JsonDecoder.number),
  modified: DateTimeDecoder,
  scheduled: JsonDecoder.optional(DateTimeDecoder),
  project: JsonDecoder.optional(JsonDecoder.string),
  priority: JsonDecoder.optional(JsonDecoder.string),
  depends: DependsDecoder,
  tags: TagsDecoder,
  urgency: JsonDecoder.number,
  annotations: AnnotationsDecoder,
}, "BaseTask");

export const TasksDecoder = JsonDecoder.array(TaskDecoder, "Tasks");
