import { questions } from "../data/catalog";
import type { Lecture } from "./syllabus-data";
import { lectures } from "./syllabus-data";
import type { Question } from "../types";

export function lectureOfQuestion(question: Question): Lecture | undefined {
  return lectures.find((lecture) =>
    lecture.sources.some((source) => source.book === question.book && source.chapter === question.chapter),
  );
}

export function questionsForLecture(lecture: Lecture): Question[] {
  return questions.filter((question) =>
    lecture.sources.some((source) => source.book === question.book && source.chapter === question.chapter),
  );
}
