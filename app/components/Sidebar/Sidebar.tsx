import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Box,
  IconButton,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TranslateIcon from '@mui/icons-material/Translate';
import SchoolIcon from '@mui/icons-material/School';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SourceIcon from '@mui/icons-material/Source';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import { useMobileDrawer } from '../../contexts/MobileDrawerContext';

interface SidebarProps {
    user?: any;
    isLoggedIn?: boolean;
    isAdmin?: boolean;
}

const drawerWidth = 280;

export default function Sidebar({ isAdmin }: SidebarProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const location = useLocation();
    const { mobileOpen, setMobileOpen } = useMobileDrawer();

    useEffect(() => {
        if (isMobile && mobileOpen) {
            setMobileOpen(false);
        }
    }, [location.pathname, isMobile]);

    const menuItems = [
        { text: 'Home', to: '/', icon: <HomeIcon /> },
        { text: 'Dictionary', to: '/dictionary', icon: <MenuBookIcon /> },
        { text: 'Canon Dictionary', to: '/dictionary/canon', icon: <MenuBookIcon /> },
        { text: 'Slakkru Dictionary', to: '/dictionary/slakgedasleng', icon: <MenuBookIcon /> },
        { text: 'Noncanon Dictionary', to: '/dictionary/noncanon', icon: <MenuBookIcon /> },
        { text: 'Translations', to: '/translations', icon: <TranslateIcon /> },
        { text: 'Grammar', to: '/grammar', icon: <SchoolIcon /> },
        { text: 'Learn', to: '/learn', icon: <AutoStoriesIcon /> },
        { text: 'Sources', to: '/sources', icon: <SourceIcon /> },
        { text: 'Community', to: '/community', icon: <PeopleIcon /> },
    ];

    const adminItems = [
        { text: 'Add Word', to: '/admin/addword', icon: <AddCircleIcon /> },
        { text: 'Add Translation', to: '/admin/addtranslation', icon: <AddCircleIcon /> },
    ];

    const drawerContent = (
        <Box sx={{ pt: 2 }}>
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            component={NavLink}
                            to={item.to}
                            selected={location.pathname === item.to || 
                                (item.to !== '/' && location.pathname.startsWith(item.to))}
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.main',
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: 'primary.contrastText',
                                    },
                                },
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                },
                            }}
                        >
                            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                                {item.icon}
                            </Box>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            
            {isAdmin && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <List>
                        {adminItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    component={NavLink}
                                    to={item.to}
                                    selected={location.pathname === item.to}
                                    sx={{
                                        '&.Mui-selected': {
                                            backgroundColor: 'secondary.main',
                                            color: 'secondary.contrastText',
                                            '&:hover': {
                                                backgroundColor: 'secondary.dark',
                                            },
                                            '& .MuiListItemIcon-root': {
                                                color: 'secondary.contrastText',
                                            },
                                        },
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                                        {item.icon}
                                    </Box>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
        </Box>
    );

    return (
        <>
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? mobileOpen : true}
                onClose={() => setMobileOpen(false)}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        mt: isMobile ? 0 : '64px',
                        height: isMobile ? '100vh' : 'calc(100vh - 64px)',
                    },
                }}
            >
                {isMobile && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                        <IconButton onClick={() => setMobileOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                )}
                {drawerContent}
            </Drawer>
        </>
    );
}
