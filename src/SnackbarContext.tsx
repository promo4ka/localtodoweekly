import React, { createContext, useContext, useState, ReactNode } from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

interface SnackbarContextProps {
  showSnackbar: (message: string, type?: AlertColor) => void;
}

const SnackbarContext = createContext<SnackbarContextProps | undefined>(undefined);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: AlertColor;
    open: boolean;
  }>({ message: "", type: "success", open: false });

  const showSnackbar = (message: string, type: AlertColor = "success") => {
    setSnackbar({ message, type, open: true });
  };

  const handleClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleClose}
      >
        <Alert
          severity={snackbar.type}
          variant="filled"
          sx={{ width: "100%" }}
          onClose={handleClose}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar must be used within SnackbarProvider");
  return ctx;
}
