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
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Tooltip,
  Avatar,
} from "@mui/material"
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from "@mui/icons-material"
import axios from "axios"
import Sidebar from "../components/Sidebar"

const Employees = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState("add") // 'add', 'edit', or 'view'
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "employee",
    department: "",
    position: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("/api/employees")
        setEmployees(res.data)
      } catch (error) {
        console.error("Error fetching employees:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenDialog = (mode, employee = null) => {
    setDialogMode(mode)
    setSelectedEmployee(employee)

    if ((mode === "edit" || mode === "view") && employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        position: employee.position,
        password: "", // Don't populate password for security reasons
      })
    } else {
      setFormData({
        name: "",
        email: "",
        role: "employee",
        department: "",
        position: "",
        password: "",
      })
    }

    setErrors({})
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedEmployee(null)
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
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.department.trim()) {
      newErrors.department = "Department is required"
    }

    if (!formData.position.trim()) {
      newErrors.position = "Position is required"
    }

    if (dialogMode === "add" && !formData.password.trim()) {
      newErrors.password = "Password is required"
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      if (dialogMode === "add") {
        const res = await axios.post("/api/employees", formData)
        setEmployees([...employees, res.data])
      } else if (dialogMode === "edit") {
        // Only include password if it was changed
        const dataToUpdate = { ...formData }
        if (!dataToUpdate.password) {
          delete dataToUpdate.password
        }

        const res = await axios.put(`/api/employees/${selectedEmployee.id}`, dataToUpdate)
        setEmployees(employees.map((emp) => (emp.id === selectedEmployee.id ? res.data : emp)))
      }

      handleCloseDialog()
    } catch (error) {
      console.error(`Error ${dialogMode === "add" ? "adding" : "updating"} employee:`, error)
    }
  }

  const handleOpenDeleteDialog = (employee) => {
    setEmployeeToDelete(employee)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setEmployeeToDelete(null)
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/employees/${employeeToDelete.id}`)
      setEmployees(employees.filter((emp) => emp.id !== employeeToDelete.id))
      handleCloseDeleteDialog()
    } catch (error) {
      console.error("Error deleting employee:", error)
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
          <Typography variant="h4">Employees</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog("add")}>
            Add Employee
          </Button>
        </Box>

        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: "calc(100vh - 200px)" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.length > 0 ? (
                  employees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((employee) => (
                    <TableRow key={employee.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar sx={{ mr: 2 }}>{employee.name.charAt(0)}</Avatar>
                          {employee.name}
                        </Box>
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}</TableCell>
                      <TableCell>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleOpenDialog("view", employee)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog("edit", employee)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(employee)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No employees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={employees.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

      {/* Add/Edit/View Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === "add" ? "Add Employee" : dialogMode === "edit" ? "Edit Employee" : "Employee Details"}
        </DialogTitle>
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
              disabled={dialogMode === "view"}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 2 }}
              disabled={dialogMode === "view"}
            />
            <FormControl fullWidth sx={{ mb: 2 }} disabled={dialogMode === "view"}>
              <InputLabel id="role-label">Role</InputLabel>
              <Select labelId="role-label" name="role" value={formData.role} label="Role" onChange={handleInputChange}>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              error={!!errors.department}
              helperText={errors.department}
              sx={{ mb: 2 }}
              disabled={dialogMode === "view"}
            />
            <TextField
              fullWidth
              label="Position"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              error={!!errors.position}
              helperText={errors.position}
              sx={{ mb: 2 }}
              disabled={dialogMode === "view"}
            />
            {dialogMode !== "view" && (
              <TextField
                fullWidth
                label={dialogMode === "edit" ? "New Password (leave blank to keep current)" : "Password"}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{dialogMode === "view" ? "Close" : "Cancel"}</Button>
          {dialogMode !== "view" && (
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {dialogMode === "add" ? "Add" : "Update"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the employee "{employeeToDelete?.name}"? This action cannot be undone.
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

export default Employees

