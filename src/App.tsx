import { useState } from "react";
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
} from "@mui/material";
import WeeklyPlanner from "./WeeklyPlanner";
import Todos from "./Todos";

export default function App() {
  const [nickname, setNickname] = useState<string>(localStorage.getItem("nickname") || "");
  const [enteredNick, setEnteredNick] = useState("");

  function handleSetNickname() {
    const nick = enteredNick.trim();
    if (!nick) return;
    setNickname(nick);
    localStorage.setItem("nickname", nick);
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
            {nickname.toUpperCase()}
          </Typography>
          <Button color="inherit" onClick={() => { localStorage.removeItem("nickname"); setNickname(""); }}>Выйти</Button>
        </Toolbar>
      </AppBar>
    </Box>
      <Grid container spacing={2} >
        <Grid size={6}>
          <Todos nickname={nickname} />
        </Grid>
        <Grid size={6}>
          <WeeklyPlanner nickname={nickname} />
        </Grid>
      </Grid>
    </Container>
  );
}