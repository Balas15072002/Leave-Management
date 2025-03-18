"use client"

import React, { useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import { Typography, Box } from "@mui/material"
import { useNavigate } from "react-router-dom"

const Dashboard = () => {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!user) {
      navigate("/")
    } else if (user.role === "admin") {
      navigate("/admin-dashboard")
    } else {
      navigate("/employee-dashboard")
    }
  }, [user, navigate])

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Typography variant="h4">Redirecting...</Typography>
    </Box>
  )
}

export default Dashboard

