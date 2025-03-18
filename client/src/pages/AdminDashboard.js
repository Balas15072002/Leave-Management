"use client"

import { useState, useEffect } from "react"
import { Box, Typography, Grid, Paper, CircularProgress, Card, CardContent, Divider } from "@mui/material"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import axios from "axios"
import Sidebar from "../components/Sidebar"

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get("/api/admin/dashboard")
        setDashboardData(res.data)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Admin Dashboard
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: "flex", flexDirection: "column", height: 140 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Total Employees
              </Typography>
              <Typography
                variant="h3"
                component="div"
                sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {dashboardData.totalEmployees}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: "flex", flexDirection: "column", height: 140 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Pending Requests
              </Typography>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "warning.main",
                }}
              >
                {dashboardData.pendingRequests}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: "flex", flexDirection: "column", height: 140 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Approved Leaves
              </Typography>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "success.main",
                }}
              >
                {dashboardData.approvedLeaves}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: "flex", flexDirection: "column", height: 140 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Rejected Leaves
              </Typography>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "error.main",
                }}
              >
                {dashboardData.rejectedLeaves}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Leave Requests by Status
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={dashboardData.leavesByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dashboardData.leavesByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Leave Requests by Type
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={dashboardData.leavesByType}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Leave Requests
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {dashboardData.recentRequests.map((request) => (
                  <Grid item xs={12} sm={6} md={4} key={request.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {request.employeeName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {request.leaveType} - {request.days} days
                        </Typography>
                        <Typography variant="body2">
                          {new Date(request.startDate).toLocaleDateString()} -{" "}
                          {new Date(request.endDate).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color:
                                request.status === "Approved"
                                  ? "success.main"
                                  : request.status === "Rejected"
                                    ? "error.main"
                                    : "warning.main",
                            }}
                          >
                            {request.status}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default AdminDashboard

