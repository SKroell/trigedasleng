import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Divider,
  useMediaQuery,
  useTheme,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TranslateIcon from '@mui/icons-material/Translate';
import SchoolIcon from '@mui/icons-material/School';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SourceIcon from '@mui/icons-material/Source';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
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

interface NavItem {
    text: string;
    to: string;
    icon: React.ReactNode;
}

const navSections: { heading: string; items: NavItem[] }[] = [
    {
        heading: 'Browse',
        items: [
            { text: 'Home', to: '/', icon: <HomeIcon /> },
            { text: 'Dictionary', to: '/dictionary', icon: <MenuBookIcon /> },
            { text: 'Canon Dictionary', to: '/dictionary/canon', icon: <MenuBookIcon /> },
            { text: 'Slakkru Dictionary', to: '/dictionary/slakgedasleng', icon: <MenuBookIcon /> },
            { text: 'Noncanon Dictionary', to: '/dictionary/noncanon', icon: <MenuBookIcon /> },
            { text: 'Translations', to: '/translations', icon: <TranslateIcon /> },
        ],
    },
    {
        heading: 'Learn',
        items: [
            { text: 'A.L.I.E.', to: '/alie', icon: <AllInclusiveIcon /> },
            { text: 'Grammar', to: '/grammar', icon: <SchoolIcon /> },
            { text: 'Learn', to: '/learn', icon: <AutoStoriesIcon /> },
        ],
    },
    {
        heading: 'More',
        items: [
            { text: 'Sources', to: '/sources', icon: <SourceIcon /> },
            { text: 'Community', to: '/community', icon: <PeopleIcon /> },
        ],
    },
];

const adminItems: NavItem[] = [
    { text: 'Add Word', to: '/admin/addword', icon: <AddCircleIcon /> },
    { text: 'Add Translation', to: '/admin/addtranslation', icon: <AddCircleIcon /> },
];

const navItemSx = {
    borderRadius: 2,
    mx: 1,
    my: 0.25,
    '&.Mui-selected': {
        bgcolor: 'action.selected',
        '& .MuiListItemText-primary': { fontWeight: 600 },
        '&:hover': { bgcolor: 'action.selected' },
    },
    '&:hover': { bgcolor: 'action.hover' },
} as const;

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

    // Pick a single active route: the most specific (longest) match, so
    // "/dictionary/canon" highlights only Canon, not the base Dictionary too.
    const allTos = [...navSections.flatMap((s) => s.items), ...adminItems].map((i) => i.to);
    const activeTo = allTos
        .filter((to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/')))
        .sort((a, b) => b.length - a.length)[0];

    const renderItem = (item: NavItem) => (
        <ListItem key={item.text} disablePadding>
            <ListItemButton
                component={NavLink}
                to={item.to}
                selected={item.to === activeTo}
                sx={navItemSx}
            >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
            </ListItemButton>
        </ListItem>
    );

    const drawerContent = (
        <Box sx={{ py: 1 }}>
            {navSections.map((section) => (
                <List
                    key={section.heading}
                    subheader={
                        <ListSubheader
                            disableSticky
                            sx={{
                                bgcolor: 'transparent',
                                color: 'text.secondary',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                lineHeight: 2.5,
                            }}
                        >
                            {section.heading}
                        </ListSubheader>
                    }
                >
                    {section.items.map(renderItem)}
                </List>
            ))}

            {isAdmin && (
                <>
                    <Divider sx={{ my: 1, mx: 2 }} />
                    <List
                        subheader={
                            <ListSubheader
                                disableSticky
                                sx={{
                                    bgcolor: 'transparent',
                                    color: 'text.secondary',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    lineHeight: 2.5,
                                }}
                            >
                                Admin
                            </ListSubheader>
                        }
                    >
                        {adminItems.map(renderItem)}
                    </List>
                </>
            )}
        </Box>
    );

    return (
        <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? mobileOpen : true}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    mt: isMobile ? 0 : '64px',
                    height: isMobile ? '100%' : 'calc(100vh - 64px)',
                },
            }}
        >
            {isMobile && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 2,
                        height: 64,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                        Trigedasleng
                    </Typography>
                    <IconButton onClick={() => setMobileOpen(false)} aria-label="close navigation menu">
                        <CloseIcon />
                    </IconButton>
                </Box>
            )}
            {drawerContent}
        </Drawer>
    );
}
