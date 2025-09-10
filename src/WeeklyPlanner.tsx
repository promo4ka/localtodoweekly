import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Box,
} from "@mui/material";

interface WeekData {
  weekRange: string;
  notes: string;
}

interface WeeklyPlannerProps {
  nickname: string;
}

// localStorage key helpers
const WEEKLY_KEY = (nickname: string, year: number, month: number) =>
  `${nickname}_weekly_${year}_${String(month + 1).padStart(2, "0")}`;

// Хелпер для вычисления диапазона текущей недели
function getWeekRange(date: Date): string {
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

function loadAllWeeks(nickname: string): WeekData[] {
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


export default function WeeklyPlanner({ nickname }: WeeklyPlannerProps) {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const currentWeek = getWeekRange(new Date());

  useEffect(() => {
    nickname && setWeeks(loadAllWeeks(nickname));
  }, [nickname]);

  const saveWeeks = (data: WeekData[]) => {
    const now = new Date();
    const key = WEEKLY_KEY(nickname, now.getFullYear(), now.getMonth());
    localStorage.setItem(key, JSON.stringify(data));
    setWeeks(data);
  };

  const current = weeks.find((w) => w.weekRange === currentWeek) || {
    weekRange: currentWeek,
    notes: "",
  };

  const handleChange = (val: string) => {
    const newWeeks = weeks.some((w) => w.weekRange === currentWeek)
      ? weeks.map((w) =>
        w.weekRange === currentWeek ? { ...w, notes: val } : w
      )
      : [...weeks, { weekRange: currentWeek, notes: val }];
    saveWeeks(newWeeks);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">{currentWeek}</Typography>
        <TextField
          multiline
          minRows={10}
          fullWidth
          value={current.notes}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Заметки на неделю..."
        />
      </Paper>

      {weeks.length > 1 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            История
          </Typography>
          {weeks
            .filter((w) => w.weekRange !== currentWeek)
            .sort((a, b) => (a.weekRange > b.weekRange ? -1 : 1))
            .map((w) => (
              <Paper key={w.weekRange} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">{w.weekRange}</Typography>
                <Box sx={{ whiteSpace: "pre-line", mt: 1 }}>{w.notes}</Box>
              </Paper>
            ))}
        </>
      )}
    </Container>
  );
}