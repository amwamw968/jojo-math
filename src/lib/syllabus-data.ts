import raw from "../../data/syllabus.json";

export interface LectureSource {
  book: string;
  chapter: string;
}

export interface Lecture {
  id: string;
  number: number | null;
  title: string | null;
  focus: string | null;
  status: "已收录" | "待补";
  note?: string;
  sources: LectureSource[];
  knowledge_points: string[];
  engines: string[];
}

export interface Track {
  id: string;
  title: string;
  publisher: string;
  grade: number;
  term: string | null;
  class_type: string | null;
  note?: string;
  lectures: Lecture[];
}

export const tracks = raw.tracks as Track[];
export const lectures = tracks.flatMap((track) => track.lectures);

export function trackOfLecture(lectureId: string): Track | undefined {
  return tracks.find((track) => track.lectures.some((lecture) => lecture.id === lectureId));
}

export function lectureById(id: string): Lecture | undefined {
  return lectures.find((lecture) => lecture.id === id);
}

export function lectureLabel(lecture: Lecture): string {
  if (lecture.status === "待补" || !lecture.title) return "待补";
  const prefix = lecture.number ? `第 ${lecture.number} 讲` : "讲次";
  return lecture.focus ? `${prefix} ${lecture.title}（${lecture.focus}）` : `${prefix} ${lecture.title}`;
}
