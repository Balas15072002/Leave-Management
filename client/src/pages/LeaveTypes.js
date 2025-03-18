"use client"

import { useState, useEffect } from "react"
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material"
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material"
import axios from "axios"
import Sidebar from "../components/Sidebar"

const LeaveTypes = () => {
  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState("add") // 'add' or 'edit'
  const [selectedLeaveType, setSelectedLeaveType] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    defaultDays: "",
  })
  const [errors, setErrors] = useState({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState(null)

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const res = await axios.get("/api/leave-types")
        setLeaveTypes(res.data)
      } catch (error) {
        console.error("Error fetching leave types:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaveTypes()
  }, [])

  const handleOpenDialog = (mode, leaveType = null) => {
    setDialogMode(mode)
    setSelectedLeaveType(leaveType)

    if (mode === "edit" && leaveType) {
      setFormData({
        name: leaveType.name,
        description: leaveType.description,
        defaultDays: leaveType.defaultDays.toString(),
      })
    } else {
      setFormData({
        name: "",
        description: "",
        defaultDays: "",
      })
    }

    setErrors({})
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedLeaveType(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Leave type name is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.defaultDays) {
      newErrors.defaultDays = "Default days is required"
    } else if (isNaN(formData.defaultDays) || Number.parseInt(formData.defaultDays) <= 0) {
      newErrors.defaultDays = "Default days must be a positive number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      if (dialogMode === "add") {
        const res = await axios.post("/api/leave-types", {
          ...formData,
          defaultDays: Number.parseInt(formData.defaultDays),
        })

        setLeaveTypes([...leaveTypes, res.data])
      } else {
        const res = await axios.put(`/api/leave-types/${selectedLeaveType.id}`, {
          ...formData,
          defaultDays: Number.parseInt(formData.defaultDays),
        })

        setLeaveTypes(leaveTypes.map((type) => (type.id === selectedLeaveType.id ? res.data : type)))
      }

      handleCloseDialog()
    } catch (error) {
      console.error(`Error ${dialogMode === "add" ? "adding" : "updating"} leave type:`, error)
    }
  }

  const handleOpenDeleteDialog = (leaveType) => {
    setLeaveTypeToDelete(leaveType)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setLeaveTypeToDelete(null)
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/leave-types/${leaveTypeToDelete.id}`)
      setLeaveTypes(leaveTypes.filter((type) => type.id !== leaveTypeToDelete.id))
      handleCloseDeleteDialog()
    } catch (error) {
      console.error("Error deleting leave type:", error)
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography variant="h4">Leave Types</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog("add")}>
            Add Leave Type
          </Button>
        </Box>

        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Default Days</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaveTypes.length > 0 ? (
                  leaveTypes.map((leaveType) => (
                    <TableRow key={leaveType.id} hover>
                      <TableCell>{leaveType.name}</TableCell>
                      <TableCell>{leaveType.description}</TableCell>
                      <TableCell>{leaveType.defaultDays}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog("edit", leaveType)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(leaveType)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No leave types found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === "add" ? "Add Leave Type" : "Edit Leave Type"}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              error={!!errors.description}
              helperText={errors.description}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Default Days"
              name="defaultDays"
              type="number"
              value={formData.defaultDays}
              onChange={handleInputChange}
              error={!!errors.defaultDays}
              helperText={errors.defaultDays}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {dialogMode === "add" ? "Add" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the leave type "{leaveTypeToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LeaveTypes

