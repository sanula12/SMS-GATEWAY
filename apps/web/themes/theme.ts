import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#f26f2e',
            dark: '#d9581f',
            light: '#f99d63',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#1a1f36',
            contrastText: '#ffffff',
        },
        background: {
            default: '#f0f2f9',
            paper: '#ffffff',
        },
        success: {
            main: '#4caf50',
            contrastText: '#ffffff',
        },
        error: {
            main: '#f44336',
            contrastText: '#ffffff',
        },
        warning: {
            main: '#ff9800',
            contrastText: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        h4: { fontWeight: 800 },
        h5: { fontWeight: 800 },
        h6: { fontWeight: 700 },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #f0f2f9',
                },
            },
        },
    },
});

export default theme;