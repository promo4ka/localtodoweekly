import React, { useState } from "react";
import {
  Container,
  TextField,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  AppBar,
  Toolbar,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import WeeklyPlanner from "./WeeklyPlanner";
import Todos from "./Todos";
import { Download, UploadFile } from "@mui/icons-material";
import { useSnackbar } from "./SnackbarContext";

export default function App() {
  const [nickname, setNickname] = useState<string>(localStorage.getItem("nickname") || "");
  const [enteredNick, setEnteredNick] = useState("");
  const [update, setUpdate] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { showSnackbar } = useSnackbar();

  function exportAll() {
    if (!nickname) return;
    const payload: any = { nickname };
    Object.keys(localStorage).forEach((key) => {
      if (key.split('_', 1)[0] === nickname) {
        payload[key] = localStorage[key];
      }
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nickname}_todos_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    setLoading(true);
    reader.onload = (e) => {
      try {
        const obj = JSON.parse(String(e.target?.result || ""));
        if (!obj.nickname) throw new Error("Invalid format");

        Object.keys(obj).forEach((key) => {
          if (key === 'nickname') return;

          localStorage.setItem(key, obj[key])
        });

        showSnackbar("Импорт завершён")
        setUpdate((u) => !u)
        setLoading(false);
      } catch (err) {
        setLoading(false);
        showSnackbar("Ошибка при импорте: неверный формат JSON.", "error")
      }
    };
    reader.readAsText(file);
  }

  function handleSetNickname() {
    const nick = enteredNick.trim();
    if (!nick) return;
    setNickname(nick);
    localStorage.setItem("nickname", nick);
  }

  if (loading) {
    return (<Backdrop sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
      open={loading}
    ><CircularProgress color="inherit" /></Backdrop>);
  }

  if (!nickname) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Введите никнейм</Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <TextField
            fullWidth
            value={enteredNick}
            onChange={(e) => setEnteredNick(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSetNickname(); }}
          />
          <Button variant="contained" onClick={handleSetNickname}>OK</Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Container maxWidth={false} sx={{ mt: 2 }}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {"MEMO-"}{nickname.toUpperCase()}
            </Typography>

            <input
              id="import-file" type="file" accept="application/json" style={{ display: "none" }}
              onChange={(e) => handleImportFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="import-file">
              <Button variant="outlined" component="span" color="inherit" startIcon={<UploadFile />} sx={{ mr: 2 }}>Импорт</Button>
            </label>
            <Button variant="outlined" color="inherit" onClick={exportAll} startIcon={<Download />} sx={{ mr: 2 }}>Экспорт</Button>
            <Button variant="outlined" onClick={() => { localStorage.removeItem("nickname"); setNickname(""); }}>Выйти</Button>
          </Toolbar>
        </AppBar>
      </Box>
      <Grid container spacing={2} >
        <Grid size={6}>
          {/* <Skeleton variant="rounded" height={60} /> */}
          <Todos nickname={nickname} update={update} />
        </Grid>
        <Grid size={6}>
          <WeeklyPlanner nickname={nickname} update={update} />
        </Grid>
      </Grid>
    </Container>
  );
}