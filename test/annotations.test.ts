import { DateTime } from "luxon";

import { addAnnotation, annotation } from "../src/utils";
import { expect } from "./expect";

test("Annotation sorting", (): void => {
  let annotations = [];

  addAnnotation(annotations, annotation("test 1", DateTime.utc(2020, 1, 2, 3, 4, 5)));
  expect(annotations).toEqual([{
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
    description: "test 1",
  }]);

  addAnnotation(annotations, annotation("test 2", DateTime.utc(2020, 2, 2, 3, 4, 5)));
  expect(annotations).toEqual([{
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
    description: "test 1",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 2, 2, 3, 4, 5)),
    description: "test 2",
  }]);

  addAnnotation(annotations, annotation("test 3", DateTime.utc(2020, 1, 1, 3, 4, 5)));
  expect(annotations).toEqual([{
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
    description: "test 3",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
    description: "test 1",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 2, 2, 3, 4, 5)),
    description: "test 2",
  }]);

  addAnnotation(annotations, annotation("test 4", DateTime.utc(2020, 1, 2, 3, 4, 5)));
  expect(annotations).toEqual([{
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
    description: "test 3",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
    description: "test 1",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 6)),
    description: "test 4",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 2, 2, 3, 4, 5)),
    description: "test 2",
  }]);

  addAnnotation(annotations, annotation("test 5", DateTime.utc(2020, 1, 2, 3, 4, 5)));
  expect(annotations).toEqual([{
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
    description: "test 3",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
    description: "test 1",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 6)),
    description: "test 5",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 7)),
    description: "test 4",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 2, 2, 3, 4, 5)),
    description: "test 2",
  }]);

  addAnnotation(annotations, annotation("test 6", DateTime.utc(2020, 1, 2, 3, 4, 5, 200)));
  expect(annotations).toEqual([{
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
    description: "test 3",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
    description: "test 1",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 6)),
    description: "test 6",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 7)),
    description: "test 5",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 8)),
    description: "test 4",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 2, 2, 3, 4, 5)),
    description: "test 2",
  }]);

  addAnnotation(annotations, annotation("test 7", DateTime.utc(2020, 1, 2, 3, 4, 6, 700)));
  expect(annotations).toEqual([{
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 1, 3, 4, 5)),
    description: "test 3",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 5)),
    description: "test 1",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 6)),
    description: "test 6",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 7)),
    description: "test 5",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 8)),
    description: "test 7",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 1, 2, 3, 4, 9)),
    description: "test 4",
  }, {
    entry: expect.toEqualDate(DateTime.utc(2020, 2, 2, 3, 4, 5)),
    description: "test 2",
  }]);
});
