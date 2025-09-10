import { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  Container,
  TextField,
  IconButton,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Dialog,
  DialogActions,
  DialogTitle,
  Button,
  Box,
  InputAdornment,
  Divider,
  Input,
  Grid,
} from "@mui/material";
import { Delete, Add, DragIndicator, UploadFile, Download } from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}


interface TodosProps {
  nickname: string;
}

// localStorage key helpers
const TAGS_KEY = (nick: string) => `${nick}_tags`;
const TODOS_KEY = (nick: string, tag: string) => `${nick}_todos_${tag}`;

export default function Todos({ nickname }: TodosProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState<string>("");
  const [activeTodos, setActiveTodos] = useState<Todo[]>([]);
  const [doneTodos, setDoneTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [todoToToggle, setTodoToToggle] = useState<Todo | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");
  // const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!nickname) return;
    const saved = JSON.parse(localStorage.getItem(TAGS_KEY(nickname)) || "null");
    if (!saved) {
      const initial = ["default"];
      localStorage.setItem(TAGS_KEY(nickname), JSON.stringify(initial));
      setTags(initial);
      setCurrentTag(initial[0]);
    } else {
      setTags(saved);
      if (saved.length) setCurrentTag(saved[0]);
    }
  }, [nickname]);

  useEffect(() => {
    if (!nickname || !currentTag) return;
    const raw = JSON.parse(localStorage.getItem(TODOS_KEY(nickname, currentTag)) || "[]");
    const todos: Todo[] = raw;
    setActiveTodos(todos.filter((t) => !t.completed));
    setDoneTodos(todos.filter((t) => t.completed));
  }, [nickname, currentTag]);

  function saveTodos(todos: Todo[]) {
    if (!nickname || !currentTag) return;
    localStorage.setItem(TODOS_KEY(nickname, currentTag), JSON.stringify(todos));
  }

  function saveTags(newTags: string[]) {
    if (!nickname) return;
    localStorage.setItem(TAGS_KEY(nickname), JSON.stringify(newTags));
    setTags(newTags);
    if (!newTags.includes(currentTag)) setCurrentTag(newTags[0] || "");
  }

  function addTodo() {
    if (!inputValue.trim() || !nickname || !currentTag) return;
    const t: Todo = { id: Date.now().toString(), text: inputValue.trim(), completed: false };
    const newActive = [...activeTodos, t];
    setActiveTodos(newActive);
    saveTodos([...newActive, ...doneTodos]);
    setInputValue("");
  }

  function deleteTodo(id: string) {
    const all = [...activeTodos, ...doneTodos].filter((t) => t.id !== id);
    setActiveTodos(all.filter((t) => !t.completed));
    setDoneTodos(all.filter((t) => t.completed));
    saveTodos(all);
  }

  function requestToggle(todo: Todo) {
    setTodoToToggle(todo);
    setConfirmOpen(true);
  }

  function confirmToggle(doMove: boolean) {
    if (!todoToToggle || !nickname || !currentTag) {
      setConfirmOpen(false);
      return;
    }
    if (!doMove) {
      setConfirmOpen(false);
      setTodoToToggle(null);
      return;
    }
    const toggled = { ...todoToToggle, completed: !todoToToggle.completed };
    const all = [...activeTodos.filter((t) => t.id !== todoToToggle.id), ...doneTodos.filter((t) => t.id !== todoToToggle.id), toggled];
    setActiveTodos(all.filter((t) => !t.completed));
    setDoneTodos(all.filter((t) => t.completed));
    saveTodos(all);
    setConfirmOpen(false);
    setTodoToToggle(null);
  }

  function onDragEnd(result: any) {
    if (!result.destination) return;
    const sourceId = result.source.droppableId;
    const destId = result.destination.droppableId;
    const srcIdx = result.source.index;
    const dstIdx = result.destination.index;

    // helper to reorder within a list
    function reorder(list: Todo[], startIndex: number, endIndex: number) {
      const result = Array.from(list);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    }

    if (sourceId === destId) {
      if (sourceId === "active") {
        const newActive = reorder(activeTodos, srcIdx, dstIdx);
        setActiveTodos(newActive);
        saveTodos([...newActive, ...doneTodos]);
      } else {
        const newDone = reorder(doneTodos, srcIdx, dstIdx);
        setDoneTodos(newDone);
        saveTodos([...activeTodos, ...newDone]);
      }
    }
  }

  // Export all todos for current nickname
  function exportAll() {
    if (!nickname) return;
    const savedTags = JSON.parse(localStorage.getItem(TAGS_KEY(nickname)) || "[]");
    const payload: any = { nickname, tags: {} };
    savedTags.forEach((tag: string) => {
      payload.tags[tag] = JSON.parse(localStorage.getItem(TODOS_KEY(nickname, tag)) || "[]");
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nickname}_todos_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import JSON file - will replace existing data for this nickname (explicit replace)
  function handleImportFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const obj = JSON.parse(String(e.target?.result || ""));
        if (!obj.nickname || !obj.tags) throw new Error("Invalid format");
        if (obj.nickname !== nickname) {
          // If different nickname, import under that nickname
          const importNick = obj.nickname;
          const importedTags = Object.keys(obj.tags);
          localStorage.setItem(TAGS_KEY(importNick), JSON.stringify(importedTags));
          importedTags.forEach((tag) => {
            localStorage.setItem(TODOS_KEY(importNick, tag), JSON.stringify(obj.tags[tag] || []));
          });
          alert(`Импорт завершён: данные сохранены под никнеймом '${importNick}'.`);
        } else {
          const importedTags = Object.keys(obj.tags);
          localStorage.setItem(TAGS_KEY(nickname), JSON.stringify(importedTags));
          importedTags.forEach((tag) => {
            localStorage.setItem(TODOS_KEY(nickname, tag), JSON.stringify(obj.tags[tag] || []));
          });
          // reload
          setTags(importedTags);
          setCurrentTag(importedTags[0] || "");
          alert("Импорт завершён и данные заменены для текущего пользователя.");
        }
      } catch (err) {
        alert("Ошибка при импорте: неверный формат JSON.");
      }
    };
    reader.readAsText(file);
  }

  function startEditing(todo: Todo) {
    setEditingId(todo.id);
    setEditText(todo.text);
  }

  function saveEditing() {
    if (!editingId) return;
    const all = [...activeTodos, ...doneTodos].map((t) =>
      t.id === editingId ? { ...t, text: editText } : t
    );
    setActiveTodos(all.filter((t) => !t.completed));
    setDoneTodos(all.filter((t) => t.completed));
    saveTodos(all);
    setEditingId(null);
    setEditText("");
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Grid container spacing={0} sx={{ alignItems: "center", display: "flex"}}>
        <Grid size={10}>
          <Tabs
            value={tags.includes(currentTag) ? currentTag : "__add__"}
            onChange={(e, v) => {
              if (v === "__add__") return;
              setCurrentTag(v)
            }
            }
          >
            {tags.map((t) => (
              <Tab key={t} label={t} value={t} />
            ))}
            <Tab label="+" value="__add__" onClick={() => {
              const newTag = prompt("Название нового тега:");
              if (!newTag) return;
              const cleaned = newTag.trim();
              if (!cleaned) return;
              if (tags.includes(cleaned)) return alert("Тег уже существует");
              const newTags = [...tags, cleaned];
              saveTags(newTags);
              localStorage.setItem(TODOS_KEY(nickname, cleaned), JSON.stringify([]));
              setCurrentTag(cleaned);
            }} />
          </Tabs>
        </Grid>
        <Grid size={2} sx={{ justifyContent: "flex-end", display: "flex" }}>
          <input
            id="import-file"
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => handleImportFile(e.target.files?.[0] || null)}
          />
          <label htmlFor="import-file">
            <IconButton component="span" color="inherit"><UploadFile /></IconButton>
          </label>
          <IconButton color="inherit" onClick={exportAll}><Download /></IconButton>
        </Grid>
      </Grid>

      {currentTag && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <TextField
              fullWidth
              placeholder="Новая задача"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTodo(); }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={addTodo}><Add /></IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <DragDropContext onDragEnd={onDragEnd}>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Активные</Typography>
            <Droppable droppableId="active">
              {(provided) => (
                <List ref={provided.innerRef} {...provided.droppableProps}>
                  {activeTodos.map((todo, idx) => (
                    <Draggable key={todo.id} draggableId={todo.id} index={idx}>
                      {(prov) => (
                        <ListItem
                          disableGutters
                          disablePadding
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          secondaryAction={
                            <>
                              <IconButton edge="end" {...prov.dragHandleProps} sx={{ marginRight: 0 }}><DragIndicator /></IconButton>
                              <IconButton edge="end" onClick={() => deleteTodo(todo.id)}><Delete /></IconButton>
                            </>
                          }>
                          <Checkbox checked={todo.completed} onChange={() => requestToggle(todo)} />
                          {editingId === todo.id ? (
                            <Input
                              value={editText}

                              onChange={(e) => setEditText(e.target.value)}
                              onBlur={saveEditing}
                              onKeyDown={(e) => e.key === "Enter" && saveEditing()}
                              size="small"
                              autoFocus
                              sx={{ flex: 1, fontSize: 12, mr: 8 }}
                            />
                          ) : (
                            <ListItemText
                              onDoubleClick={() => startEditing(todo)}
                              primary={todo.text}
                              sx={{ mr: 8, cursor: 'pointer', textDecoration: todo.completed ? 'line-through' : 'none' }}
                              slotProps={{ primary: { fontSize: 12 } }}
                            />
                          )}
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>

            <Divider />

            <Typography variant="subtitle1" sx={{ mt: 2 }}>Выполненные</Typography>
            <Droppable droppableId="done">
              {(provided) => (
                <List ref={provided.innerRef} {...provided.droppableProps}>
                  {doneTodos.map((todo, idx) => (
                    <Draggable key={todo.id} draggableId={todo.id} index={idx}>
                      {(prov) => (
                        <ListItem disableGutters disablePadding ref={prov.innerRef} {...prov.draggableProps} secondaryAction={
                          <>
                            <IconButton edge="end" {...prov.dragHandleProps} sx={{ marginRight: 0 }}><DragIndicator /></IconButton>
                            <IconButton edge="end" onClick={() => deleteTodo(todo.id)}><Delete /></IconButton>
                          </>
                        }>
                          <Checkbox checked={todo.completed} onChange={() => requestToggle(todo)} />

                          <ListItemText
                            primary={todo.text}
                            sx={{ mr: 8, textDecoration: 'line-through' }}
                            slotProps={{ primary: { fontSize: 12 } }}
                          />
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>

        </Paper>
      )}

      <Dialog open={confirmOpen} onClose={() => confirmToggle(false)} onKeyDown={(e) => e.key === "Enter" && confirmToggle(true)}>
        <DialogTitle>Переместить задачу?</DialogTitle>
        <DialogActions>
          <Button onClick={() => confirmToggle(false)}>Нет</Button>
          <Button onClick={() => confirmToggle(true)}>Да</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}