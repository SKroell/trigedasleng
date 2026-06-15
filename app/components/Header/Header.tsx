import React, { useState } from 'react';
import { Link, useNavigate, useSubmit } from 'react-router';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Autocomplete,
  createFilterOptions,
  TextField,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useMobileDrawer } from '../../contexts/MobileDrawerContext';
import { useColorMode } from '../../contexts/ColorModeContext';

interface HeaderProps {
    userIsLoggedIn: boolean;
    dictionary: any[];
    translations: any[];
}

// Cap suggestions so the dropdown stays fast — the combined word + translation
// list is several thousand entries and rendering them all freezes the UI.
const searchFilter = createFilterOptions<any>({
    limit: 8,
    stringify: (option) => option.label,
});

export default function Header({ userIsLoggedIn, dictionary, translations }: HeaderProps) {
    const [searchValue, setSearchValue] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { setMobileOpen } = useMobileDrawer();
    const { mode, toggleColorMode } = useColorMode();

    const navigate = useNavigate();
    const submit = useSubmit();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Combine dictionary and translations for autocomplete
    const searchOptions = [
        ...(dictionary || []).map((item: any) => ({
            label: item.value || item.word,
            type: 'word',
            id: item.id,
            value: item.value || item.word,
        })),
        ...(translations || []).map((item: any) => ({
            label: `${item.trigedasleng || item.word} (${item.english || item.translation})`,
            type: 'translation',
            id: item.id,
            value: item.trigedasleng || item.word,
        })),
    ];

    const handleSearch = (value: string) => {
        if (value) {
            navigate('/search?q=' + encodeURIComponent(value));
            setSearchValue('');
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const logOut = () => {
        submit(null, { method: "post", action: "/logout" });
        handleMenuClose();
    };

    return (
        <AppBar
            position="fixed"
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
            <Toolbar sx={{ gap: 1 }}>
                {isMobile && (
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="open navigation menu"
                        onClick={() => setMobileOpen(true)}
                    >
                        <MenuIcon />
                    </IconButton>
                )}

                <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    sx={{
                        flexGrow: { xs: 1, md: 0 },
                        mr: { xs: 1, md: 4 },
                        textDecoration: 'none',
                        color: 'text.primary',
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        Trigedasleng Dictionary
                    </Box>
                    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                        Trigedasleng
                    </Box>
                </Typography>

                <Box
                    sx={{
                        flexGrow: 1,
                        maxWidth: { md: 440 },
                        ml: { md: 'auto' },
                    }}
                >
                    <Autocomplete
                        freeSolo
                        blurOnSelect
                        options={searchOptions}
                        filterOptions={searchFilter}
                        getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                        inputValue={searchValue}
                        onInputChange={(event, newInputValue) => {
                            setSearchValue(newInputValue);
                        }}
                        onChange={(event, newValue) => {
                            // Handles both selecting a suggestion (object) and
                            // pressing Enter on free text (string) — one path,
                            // so there's no double navigation.
                            if (!newValue) return;
                            const query = typeof newValue === 'string' ? newValue.trim() : newValue.value;
                            if (query) handleSearch(query);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Search words & translations…"
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'action.hover',
                                        borderRadius: 2,
                                        '& fieldset': { borderColor: 'transparent' },
                                        '&:hover fieldset': { borderColor: 'divider' },
                                        '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                    },
                                }}
                            />
                        )}
                    />
                </Box>

                <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                    <IconButton color="inherit" onClick={toggleColorMode} aria-label="toggle color mode">
                        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Tooltip>

                <IconButton
                    edge="end"
                    color="inherit"
                    aria-label="account menu"
                    aria-controls="account-menu"
                    aria-haspopup="true"
                    onClick={handleMenuOpen}
                >
                    <AccountCircle />
                </IconButton>
                <Menu
                    id="account-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    {userIsLoggedIn ? (
                        <MenuItem onClick={logOut}>Logout</MenuItem>
                    ) : (
                        [
                            <MenuItem key="login" component={Link} to="/login" onClick={handleMenuClose}>
                                Login
                            </MenuItem>,
                            <MenuItem key="signup" component={Link} to="/signup" onClick={handleMenuClose}>
                                Signup
                            </MenuItem>
                        ]
                    )}
                </Menu>
            </Toolbar>
        </AppBar>
    );
}
