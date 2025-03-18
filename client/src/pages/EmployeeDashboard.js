"use client"

import { useState, useEffect, useContext } from "react"
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { format, differenceInDays } from "date-fns"
import axios from "axios"
import Sidebar from "../components/Sidebar"
import { AuthContext } from "../context/AuthContext"

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext)
  const [leaveTypes, setLeaveTypes] = useState([])
  const [leaveBalance, setLeaveBalance] = useState([])
  const [recentLeaves, setRecentLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [leaveRequest, setLeaveRequest] = useState({
    leaveTypeId: "",
    startDate: null,
    endDate: null,
    reason: "",
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, balanceRes, leavesRes] = await Promise.all([
          axios.get("/api/leave-types"),
          axios.get("/api/leave-balance"),
          axios.get("/api/leaves/recent"),
        ])

        setLeaveTypes(typesRes.data)
        setLeaveBalance(balanceRes.data)
        setRecentLeaves(leavesRes.data)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleOpenDialog = () => {
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setLeaveRequest({
      leaveTypeId: "",
      startDate: null,
      endDate: null,
      reason: "",
    })
    setErrors({})
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setLeaveRequest({
      ...leaveRequest,
      [name]: value,
    })
  }

  const handleDateChange = (name, date) => {
    setLeaveRequest({
      ...leaveRequest,
      [name]: date,
    })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!leaveRequest.leaveTypeId) {
      newErrors.leaveTypeId = "Please select a leave type"
    }

    if (!leaveRequest.startDate) {
      newErrors.startDate = "Please select a start date"
    }

    if (!leaveRequest.endDate) {
      newErrors.endDate = "Please select an end date"
    } else if (leaveRequest.startDate && leaveRequest.endDate < leaveRequest.startDate) {
      newErrors.endDate = "End date cannot be before start date"
    }

    if (!leaveRequest.reason.trim()) {
      newErrors.reason = "Please provide a reason for leave"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      const days = differenceInDays(leaveRequest.endDate, leaveRequest.startDate) + 1

      await axios.post("/api/leaves", {
        ...leaveRequest,
        startDate: format(leaveRequest.startDate, "yyyy-MM-dd"),
        endDate: format(leaveRequest.endDate, "yyyy-MM-dd"),
        days,
      })

      // Refresh recent leaves
      const leavesRes = await axios.get("/api/leaves/recent")
      setRecentLeaves(leavesRes.data)

      handleCloseDialog()
    } catch (error) {
      console.error("Error submitting leave request:", error)
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
          Employee Dashboard
        </Typography>

        <Box sx={{ mb: 4, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" color="primary" onClick={handleOpenDialog}>
            Apply for Leave
          </Button>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Leave Balance
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {leaveBalance.map((balance) => (
            <Grid item xs={12} sm={6} md={4} key={balance.id}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1">{balance.leaveType}</Typography>
                <Typography variant="h4">{balance.remaining}</Typography>
                <Typography variant="body2" color="textSecondary">
                  of {balance.total} days available
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Leave Requests
        </Typography>

        <Grid container spacing={3}>
          {recentLeaves.length > 0 ? (
            recentLeaves.map((leave) => (
              <Grid item xs={12} key={leave.id}>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Type
                      </Typography>
                      <Typography variant="body1">{leave.leaveType}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Period
                      </Typography>
                      <Typography variant="body1">
                        {format(new Date(leave.startDate), "MMM dd, yyyy")} -{" "}
                        {format(new Date(leave.endDate), "MMM dd, yyyy")}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Days
                      </Typography>
                      <Typography variant="body1">{leave.days}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Status
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color:
                            leave.status === "Approved"
                              ? "success.main"
                              : leave.status === "Rejected"
                                ? "error.main"
                                : "warning.main",
                        }}
                      >
                        {leave.status}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Applied On
                      </Typography>
                      <Typography variant="body1">{format(new Date(leave.createdAt), "MMM dd, yyyy")}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body1">No recent leave requests</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Apply for Leave Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Apply for Leave</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth error={!!errors.leaveTypeId} sx={{ mb: 2 }}>
              <InputLabel id="leave-type-label">Leave Type</InputLabel>
              <Select
                labelId="leave-type-label"
                id="leaveTypeId"
                name="leaveTypeId"
                value={leaveRequest.leaveTypeId}
                label="Leave Type"
                onChange={handleInputChange}
              >
                {leaveTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.leaveTypeId && (
                <Typography variant="caption" color="error">
                  {errors.leaveTypeId}
                </Typography>
              )}
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <DatePicker
                    label="Start Date"
                    value={leaveRequest.startDate}
                    onChange={(date) => handleDateChange("startDate", date)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth error={!!errors.startDate} helperText={errors.startDate} />
                    )}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <DatePicker
                    label="End Date"
                    value={leaveRequest.endDate}
                    onChange={(date) => handleDateChange("endDate", date)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth error={!!errors.endDate} helperText={errors.endDate} />
                    )}
                  />
                </Box>
              </Box>
            </LocalizationProvider>

            <TextField
              fullWidth
              id="reason"
              name="reason"
              label="Reason for Leave"
              multiline
              rows={4}
              value={leaveRequest.reason}
              onChange={handleInputChange}
              error={!!errors.reason}
              helperText={errors.reason}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeeDashboard

