import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Box,
  IconButton,
  Grid,
} from "@mui/material";
import { copyTextToBuffer, getWeekRange, loadAllWeeks, WEEKLY_KEY } from "./utils";
import { useSnackbar } from "./SnackbarContext";
import { CopyAllRounded } from "@mui/icons-material";

export interface WeekData {
  weekRange: string;
  notes: string;
}

interface WeeklyPlannerProps {
  nickname: string;
  update: boolean;
}

export default function WeeklyPlanner({ nickname, update }: WeeklyPlannerProps) {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const currentWeek = getWeekRange(new Date());

  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    nickname && setWeeks(loadAllWeeks(nickname));
  }, [nickname, update]);

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
        <Grid container>
          <Grid size={11}>
            <Typography variant="caption">{currentWeek}</Typography>
          </Grid>
          <Grid size={1} sx={{ justifyContent: "flex-end", display: "flex" }}>
            <IconButton size="small" onClick={() => {
              copyTextToBuffer(`#итого #${currentWeek}\n${current.notes}`).then((status) => {
                showSnackbar(status ? 'Скопированно' : 'Ошибка', status ? "success" : "error")
              });
            }}><CopyAllRounded /></IconButton>
          </Grid>
        </Grid>
        <TextField
          multiline
          minRows={10}
          fullWidth
          slotProps={{ htmlInput: { sx: { fontSize: 12 } } }}
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