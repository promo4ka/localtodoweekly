import { WeekData } from "./WeeklyPlanner";

export const TAGS_KEY = (nick: string) => `${nick}_tags`;
export const TODOS_KEY = (nick: string, tag: string) => `${nick}_todos_${tag}`;
export const WEEKLY_KEY = (nickname: string, year: number, month: number) =>
  `${nickname}_weekly_${year}_${String(month + 1).padStart(2, "0")}`;


export const copyTextToBuffer = (notes: string) => {
  return navigator.clipboard.writeText(notes).then(
    () => {
      return true;
    },
    (err) => {
      return false;
    }
  );
}

// Хелпер для вычисления диапазона текущей недели
export const getWeekRange = (date: Date): string => {
  const start = new Date(date);
  const day = start.getDay() || 7; // если воскресенье, то 7
  start.setDate(date.getDate() - (day - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const format = (d: Date) =>
    d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    });
  return `${format(start)}-${format(end)} (${date.getFullYear()})`;
}

export const loadAllWeeks = (nickname: string): WeekData[] => {
  const allWeeks: WeekData[] = [];

  // Проходим по всем ключам в localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${nickname}_weekly_`)) {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      allWeeks.push(...data);
    }
  }

  // Сортируем недели по убыванию даты (по первой дате диапазона)
  return allWeeks.sort((a, b) => {
    const parseDate = (range: string) => {
      const [start] = range.split("-"); // "08.09"
      const [day, month, year] = start.replace(/[()]/g, "").split(".");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
    };
    return parseDate(b.weekRange) - parseDate(a.weekRange);
  });
}