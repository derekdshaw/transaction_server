import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ClientContext } from "graphql-hooks";
import { client } from "./graphqlClient"; // Adjust the import path if needed
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { CssVarsProvider, extendTheme, useColorScheme } from '@mui/joy/styles';
import InitColorSchemeScript from '@mui/joy/InitColorSchemeScript';
import CssBaseline from '@mui/joy/CssBaseline';
import '@fontsource/inter';
import {
  createTheme,
  ThemeProvider,
  THEME_ID as MATERIAL_THEME_ID,
} from '@mui/material/styles';


const materialTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// Create a Joy UI theme (customize as needed)
const theme = extendTheme({
  colorSchemes: {
    dark: {
      palette: {
        mode: 'dark',
      },
    },
  },
});

function Main() {

  return (
    <ClientContext.Provider value={client}>
      <CssVarsProvider theme={theme} defaultMode="system" disableNestedContext>
        <ThemeProvider theme={{ [MATERIAL_THEME_ID]: materialTheme }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <CssBaseline />
            <App />
          </LocalizationProvider>
        </ThemeProvider>
        </CssVarsProvider>
    </ClientContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);