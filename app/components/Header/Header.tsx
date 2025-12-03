import React, { useState } from 'react';
import { Link, useNavigate, useSubmit } from 'react-router';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Autocomplete,
  TextField,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useMobileDrawer } from '../../contexts/MobileDrawerContext';

interface HeaderProps {
    userIsLoggedIn: boolean;
    dictionary: any[];
    translations: any[];
}

export default function Header({ userIsLoggedIn, dictionary, translations }: HeaderProps) {
    const [searchValue, setSearchValue] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { setMobileOpen } = useMobileDrawer();
    
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
            sx={{ 
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: '#232323 !important',
                color: '#ffffff !important',
                '& .MuiToolbar-root': {
                    color: '#ffffff',
                },
            }}
        >
            <Toolbar sx={{ color: '#ffffff' }}>
                {isMobile && (
                    <IconButton
                        edge="start"
                        sx={{ 
                            mr: 2,
                            color: '#ffffff',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                        }}
                        aria-label="menu"
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
                        color: '#ffffff !important',
                        fontWeight: 600,
                        '&:hover': {
                            color: '#ffffff',
                        },
                    }}
                >
                    Trigedasleng Dictionary
                </Typography>

                <Box sx={{ flexGrow: { xs: 1, md: 0 }, width: { xs: '100%', md: '400px' }, minWidth: { md: '400px' }, ml: { md: 'auto' }, mr: { md: 2 } }}>
                    <Autocomplete
                        freeSolo
                        options={searchOptions}
                        getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                        inputValue={searchValue}
                        onInputChange={(event, newInputValue) => {
                            setSearchValue(newInputValue);
                        }}
                        onChange={(event, newValue) => {
                            if (newValue && typeof newValue !== 'string') {
                                handleSearch(newValue.value);
                            }
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && searchValue) {
                                handleSearch(searchValue);
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Search..."
                                variant="outlined"
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 1 }} />,
                                }}
                                sx={{
                                    width: '100%',
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: '#f5f5f5',
                                        height: '40px',
                                        color: '#000000',
                                        '& input': {
                                            color: '#000000',
                                            padding: '5px 10px',
                                            fontSize: '14px',
                                            '&::placeholder': {
                                                color: 'rgba(0, 0, 0, 0.5)',
                                                opacity: 1,
                                            },
                                        },
                                        '& fieldset': {
                                            borderColor: 'transparent',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'transparent',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'transparent',
                                        },
                                    },
                                }}
                            />
                        )}
                        sx={{ width: '100%' }}
                    />
                </Box>

                <Box sx={{ ml: 2 }}>
                    <IconButton
                        size="large"
                        edge="end"
                        aria-label="account menu"
                        aria-controls="account-menu"
                        aria-haspopup="true"
                        onClick={handleMenuOpen}
                        sx={{
                            color: '#ffffff',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                        }}
                    >
                        <AccountCircle />
                    </IconButton>
                    <Menu
                        id="account-menu"
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
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
                </Box>
            </Toolbar>
        </AppBar>
    );
}
