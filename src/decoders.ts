import { DateTime } from "luxon";
import { JsonDecoder, Result, Ok, ok, err } from "ts.data.json";

import { Status, Annotation, ParsedTask } from "./interfaces";

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

function DefaultDecoder<A, B>(
  decoder: JsonDecoder.Decoder<A>,
  fallback: B,
  decoderName: string,
): JsonDecoder.Decoder<A | B> {
  return JsonDecoder.oneOf<A | B>([
    decoder,
    JsonDecoder.isNull(fallback),
    JsonDecoder.isUndefined(fallback),
  ], decoderName);
}

// const DependsDecoder = JsonDecoder.oneOf([
//   MappingDecoder(JsonDecoder.string, (data: string): string[] => {
//     return data.split(",");
//   }, "Depends"),
//   JsonDecoder.isUndefined([]),
// ], "Depends");

const TagsDecoder = DefaultDecoder(JsonDecoder.array(JsonDecoder.string, "Tags"), [], "Tags");

const AnnotationDecoder = JsonDecoder.object<Annotation>({
  entry: DateTimeDecoder,
  description: JsonDecoder.string,
}, "Annotation");

const AnnotationsDecoder = DefaultDecoder(
  JsonDecoder.array(AnnotationDecoder, "Annotations"),
  [],
  "Annotations",
);

export const TaskDecoder = JsonDecoder.object<ParsedTask>({
  uuid: JsonDecoder.string,
  status: StatusDecoder,
  description: JsonDecoder.string,
  entry: DateTimeDecoder,
  start: DefaultDecoder(DateTimeDecoder, null, "start"),
  end: DefaultDecoder(DateTimeDecoder, null, "end"),
  due: DefaultDecoder(DateTimeDecoder, null, "due"),
  wait: DefaultDecoder(DateTimeDecoder, null, "wait"),
  until: DefaultDecoder(DateTimeDecoder, null, "until"),
  recur: DefaultDecoder(JsonDecoder.string, null, "recur"),
  parent: DefaultDecoder(JsonDecoder.string, null, "parent"),
  mask: DefaultDecoder(JsonDecoder.string, null, "mask"),
  imask: DefaultDecoder(JsonDecoder.number, null, "imask"),
  modified: DateTimeDecoder,
  scheduled: DefaultDecoder(DateTimeDecoder, null, "scheduled"),
  project: DefaultDecoder(JsonDecoder.string, null, "project"),
  // depends: DependsDecoder,
  tags: TagsDecoder,
  urgency: JsonDecoder.number,
  annotations: AnnotationsDecoder,
}, "BaseTask");

export const TasksDecoder = JsonDecoder.array(TaskDecoder, "Tasks");
