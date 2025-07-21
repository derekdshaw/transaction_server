import React from 'react';
import { render } from '@testing-library/react';
import { CssVarsProvider, CssBaseline, extendTheme } from '@mui/joy';
import { createTheme as createMuiTheme, ThemeProvider, THEME_ID as MATERIAL_THEME_ID } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ClientContext, GraphQLClient } from 'graphql-hooks';

const materialTheme = createMuiTheme({ palette: { mode: 'dark' } });
const theme = extendTheme({});

export const testClient = new GraphQLClient({ url: 'http://localhost/fake-graphql' });

export function renderWithProviders(
    ui: React.ReactElement,
    { client = testClient }: { client?: GraphQLClient } = {}
) {
    const result = render(
        <ClientContext.Provider value={client}>
          <ThemeProvider theme={{ [MATERIAL_THEME_ID]: materialTheme }}>
            <CssVarsProvider theme={theme} disableNestedContext>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <CssBaseline />
                {ui}
              </LocalizationProvider>
            </CssVarsProvider>
          </ThemeProvider>
        </ClientContext.Provider>
      )
    
      return result;    
}
