"use client"

import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import { CircularProgress, Box } from "@mui/material"

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/" />
  }

  return children
}

export default PrivateRoute

