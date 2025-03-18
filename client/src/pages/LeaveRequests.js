"use client"

import { useState, useEffect, useContext } from "react"
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material"
import { CheckCircle as ApproveIcon, Cancel as RejectIcon, Visibility as ViewIcon } from "@mui/icons-material"
import { format } from "date-fns"
import axios from "axios"
import Sidebar from "../components/Sidebar"
import { AuthContext } from "../context/AuthContext"

const LeaveRequests = () => {
  const { user } = useContext(AuthContext)
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [comment, setComment] = useState("")
  const [action, setAction] = useState("")

  const isAdmin = user && user.role === "admin"

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const endpoint = isAdmin ? "/api/admin/leaves" : "/api/leaves"
        const res = await axios.get(endpoint)
        setLeaves(res.data)
      } catch (error) {
        console.error("Error fetching leave requests:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaves()
  }, [isAdmin])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenDialog = (leave, actionType) => {
    setSelectedLeave(leave)
    setAction(actionType)
    setComment("")
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedLeave(null)
    setAction("")
    setComment("")
  }

  const handleViewDetails = (leave) => {
    setSelectedLeave(leave)
    setAction("view")
    setOpenDialog(true)
  }

  const handleSubmitAction = async () => {
    try {
      await axios.put(`/api/admin/leaves/${selectedLeave.id}/${action.toLowerCase()}`, { comment })

      // Update the leave status in the UI
      setLeaves(
        leaves.map((leave) =>
          leave.id === selectedLeave.id
            ? {
                ...leave,
                status: action === "approve" ? "Approved" : "Rejected",
                comment,
              }
            : leave,
        ),
      )

      handleCloseDialog()
    } catch (error) {
      console.error(`Error ${action}ing leave request:`, error)
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
          Leave Requests
        </Typography>

        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: "calc(100vh - 200px)" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {isAdmin && <TableCell>Employee</TableCell>}
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Applied On</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.length > 0 ? (
                  leaves.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((leave) => (
                    <TableRow key={leave.id} hover>
                      {isAdmin && <TableCell>{leave.employeeName}</TableCell>}
                      <TableCell>{leave.leaveType}</TableCell>
                      <TableCell>{format(new Date(leave.startDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{format(new Date(leave.endDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{leave.days}</TableCell>
                      <TableCell>
                        <Chip
                          label={leave.status}
                          color={
                            leave.status === "Approved" ? "success" : leave.status === "Rejected" ? "error" : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{format(new Date(leave.createdAt), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(leave)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>

                        {isAdmin && leave.status === "Pending" && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleOpenDialog(leave, "approve")}
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton size="small" color="error" onClick={() => handleOpenDialog(leave, "reject")}>
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} align="center">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={leaves.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

      {/* Action Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {action === "view"
            ? "Leave Request Details"
            : action === "approve"
              ? "Approve Leave Request"
              : "Reject Leave Request"}
        </DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Box sx={{ mt: 2 }}>
              {isAdmin && (
                <Typography variant="subtitle1" gutterBottom>
                  Employee: {selectedLeave.employeeName}
                </Typography>
              )}
              <Typography variant="subtitle1" gutterBottom>
                Leave Type: {selectedLeave.leaveType}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Period: {format(new Date(selectedLeave.startDate), "MMM dd, yyyy")} -{" "}
                {format(new Date(selectedLeave.endDate), "MMM dd, yyyy")}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Days: {selectedLeave.days}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Status: {selectedLeave.status}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Reason:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2">{selectedLeave.reason}</Typography>
              </Paper>

              {selectedLeave.comment && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Comment:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">{selectedLeave.comment}</Typography>
                  </Paper>
                </>
              )}

              {(action === "approve" || action === "reject") && (
                <TextField
                  fullWidth
                  label="Comment"
                  multiline
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{action === "view" ? "Close" : "Cancel"}</Button>
          {(action === "approve" || action === "reject") && (
            <Button onClick={handleSubmitAction} variant="contained" color={action === "approve" ? "success" : "error"}>
              {action === "approve" ? "Approve" : "Reject"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LeaveRequests

