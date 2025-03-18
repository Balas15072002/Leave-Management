"use client"

import { useState, useEffect, useContext } from "react"
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material"
import axios from "axios"
import Sidebar from "../components/Sidebar"
import { AuthContext } from "../context/AuthContext"

const Profile = () => {
  const { user, setUser } = useContext(AuthContext)
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  const [profileSuccess, setProfileSuccess] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/profile")
        setProfileData({
          name: res.data.name,
          email: res.data.email,
          department: res.data.department,
          position: res.data.position,
        })
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData({
      ...profileData,
      [name]: value,
    })
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData({
      ...passwordData,
      [name]: value,
    })
  }

  const validateProfileForm = () => {
    const newErrors = {}

    if (!profileData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!profileData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!profileData.department.trim()) {
      newErrors.department = "Department is required"
    }

    if (!profileData.position.trim()) {
      newErrors.position = "Position is required"
    }

    setProfileErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = () => {
    const newErrors = {}

    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required"
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = "New password is required"
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters"
    }

    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required"
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setPasswordErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpdateProfile = async () => {
    setProfileSuccess("")

    if (!validateProfileForm()) return

    try {
      const res = await axios.put("/api/profile", profileData)
      setProfileSuccess("Profile updated successfully")

      // Update user context if name changed
      if (user && res.data.name !== user.name) {
        setUser({
          ...user,
          name: res.data.name,
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setProfileErrors({ submit: "Failed to update profile" })
    }
  }

  const handleChangePassword = async () => {
    setPasswordSuccess("")

    if (!validatePasswordForm()) return

    try {
      await axios.put("/api/profile/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      setPasswordSuccess("Password changed successfully")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      if (error.response && error.response.status === 401) {
        setPasswordErrors({ currentPassword: "Current password is incorrect" })
      } else {
        setPasswordErrors({ submit: "Failed to change password" })
      }
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Profile
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Avatar sx={{ width: 100, height: 100, mb: 2, fontSize: "2.5rem" }}>{profileData.name.charAt(0)}</Avatar>
              <Typography variant="h5" gutterBottom>
                {profileData.name}
              </Typography>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                {profileData.email}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {profileData.position}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {profileData.department}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>

              {profileSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {profileSuccess}
                </Alert>
              )}

              {profileErrors.submit && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {profileErrors.submit}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    error={!!profileErrors.name}
                    helperText={profileErrors.name}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    error={!!profileErrors.email}
                    helperText={profileErrors.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    error={!!profileErrors.department}
                    helperText={profileErrors.department}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Position"
                    name="position"
                    value={profileData.position}
                    onChange={handleProfileChange}
                    error={!!profileErrors.position}
                    helperText={profileErrors.position}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" color="primary" onClick={handleUpdateProfile}>
                    Update Profile
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>

              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {passwordSuccess}
                </Alert>
              )}

              {passwordErrors.submit && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {passwordErrors.submit}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.currentPassword}
                    helperText={passwordErrors.currentPassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" color="primary" onClick={handleChangePassword}>
                    Change Password
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default Profile

