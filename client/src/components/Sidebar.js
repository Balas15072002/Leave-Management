"use client"

import { useContext } from "react"
import { Link, useLocation } from "react-router-dom"
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Box, Typography, Avatar } from "@mui/material"
import {
  Dashboard as DashboardIcon,
  EventNote as EventNoteIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
} from "@mui/icons-material"
import { AuthContext } from "../context/AuthContext"

const drawerWidth = 240

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext)
  const location = useLocation()

  const isAdmin = user && user.role === "admin"

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: isAdmin ? "/admin-dashboard" : "/employee-dashboard",
      admin: false,
    },
    {
      text: "Leave Requests",
      icon: <EventNoteIcon />,
      path: "/leave-requests",
      admin: false,
    },
    {
      text: "Leave Types",
      icon: <CategoryIcon />,
      path: "/leave-types",
      admin: true,
    },
    {
      text: "Employees",
      icon: <PeopleIcon />,
      path: "/employees",
      admin: true,
    },
    {
      text: "Profile",
      icon: <PersonIcon />,
      path: "/profile",
      admin: false,
    },
  ]

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Avatar sx={{ width: 64, height: 64, mb: 1 }}>{user && user.name ? user.name.charAt(0) : "U"}</Avatar>
        <Typography variant="h6">{user ? user.name : "User"}</Typography>
        <Typography variant="body2" color="textSecondary">
          {user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Role"}
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map(
          (item) =>
            (!item.admin || (item.admin && isAdmin)) && (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.light",
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ),
        )}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={logout}>
          <ListItemIcon>
            <ExitToAppIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Drawer>
  )
}

export default Sidebar

