const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const mysql = require("mysql2/promise")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "leave_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    // Get user from database
    const [rows] = await pool.query("SELECT id, name, email, role FROM employees WHERE id = ?", [decoded.id])

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid token." })
    }

    req.user = rows[0]
    next()
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." })
  }
}

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin role required." })
  }
  next()
}

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." })
    }

    // Check if user exists
    const [rows] = await pool.query("SELECT * FROM employees WHERE email = ?", [email])

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." })
    }

    const user = rows[0]

    // Check password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password." })
    }

    // Create and assign token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" })

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json(req.user)
})

// Employee Routes
app.get("/api/employees", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, department, position, created_at FROM employees ORDER BY name",
    )

    res.json(rows)
  } catch (error) {
    console.error("Error fetching employees:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.post("/api/employees", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, role, department, position, password } = req.body

    // Validate input
    if (!name || !email || !role || !department || !position || !password) {
      return res.status(400).json({ message: "All fields are required." })
    }

    // Check if email already exists
    const [existingUser] = await pool.query("SELECT id FROM employees WHERE email = ?", [email])

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already in use." })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Insert new employee
    const [result] = await pool.query(
      "INSERT INTO employees (name, email, role, department, position, password) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, role, department, position, hashedPassword],
    )

    // Get the created employee
    const [newEmployee] = await pool.query(
      "SELECT id, name, email, role, department, position, created_at FROM employees WHERE id = ?",
      [result.insertId],
    )

    res.status(201).json(newEmployee[0])
  } catch (error) {
    console.error("Error creating employee:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.put("/api/employees/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, role, department, position, password } = req.body

    // Validate input
    if (!name || !email || !role || !department || !position) {
      return res.status(400).json({ message: "Required fields are missing." })
    }

    // Check if employee exists
    const [existingEmployee] = await pool.query("SELECT id FROM employees WHERE id = ?", [id])

    if (existingEmployee.length === 0) {
      return res.status(404).json({ message: "Employee not found." })
    }

    // Check if email is already in use by another employee
    const [existingEmail] = await pool.query("SELECT id FROM employees WHERE email = ? AND id != ?", [email, id])

    if (existingEmail.length > 0) {
      return res.status(400).json({ message: "Email already in use." })
    }

    // Update employee
    if (password) {
      // Hash new password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      await pool.query(
        "UPDATE employees SET name = ?, email = ?, role = ?, department = ?, position = ?, password = ? WHERE id = ?",
        [name, email, role, department, position, hashedPassword, id],
      )
    } else {
      await pool.query(
        "UPDATE employees SET name = ?, email = ?, role = ?, department = ?, position = ? WHERE id = ?",
        [name, email, role, department, position, id],
      )
    }

    // Get the updated employee
    const [updatedEmployee] = await pool.query(
      "SELECT id, name, email, role, department, position, created_at FROM employees WHERE id = ?",
      [id],
    )

    res.json(updatedEmployee[0])
  } catch (error) {
    console.error("Error updating employee:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.delete("/api/employees/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if employee exists
    const [existingEmployee] = await pool.query("SELECT id FROM employees WHERE id = ?", [id])

    if (existingEmployee.length === 0) {
      return res.status(404).json({ message: "Employee not found." })
    }

    // Delete employee
    await pool.query("DELETE FROM employees WHERE id = ?", [id])

    res.json({ message: "Employee deleted successfully." })
  } catch (error) {
    console.error("Error deleting employee:", error)
    res.status(500).json({ message: "Server error." })
  }
})

// Profile Routes
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, department, position FROM employees WHERE id = ?", [
      req.user.id,
    ])

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." })
    }

    res.json(rows[0])
  } catch (error) {
    console.error("Error fetching profile:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, department, position } = req.body

    // Validate input
    if (!name || !email || !department || !position) {
      return res.status(400).json({ message: "All fields are required." })
    }

    // Check if email is already in use by another employee
    const [existingEmail] = await pool.query("SELECT id FROM employees WHERE email = ? AND id != ?", [
      email,
      req.user.id,
    ])

    if (existingEmail.length > 0) {
      return res.status(400).json({ message: "Email already in use." })
    }

    // Update profile
    await pool.query("UPDATE employees SET name = ?, email = ?, department = ?, position = ? WHERE id = ?", [
      name,
      email,
      department,
      position,
      req.user.id,
    ])

    // Get the updated profile
    const [updatedProfile] = await pool.query(
      "SELECT id, name, email, department, position FROM employees WHERE id = ?",
      [req.user.id],
    )

    res.json(updatedProfile[0])
  } catch (error) {
    console.error("Error updating profile:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.put("/api/profile/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." })
    }

    // Get user with password
    const [user] = await pool.query("SELECT password FROM employees WHERE id = ?", [req.user.id])

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found." })
    }

    // Check current password
    const validPassword = await bcrypt.compare(currentPassword, user[0].password)
    if (!validPassword) {
      return res.status(401).json({ message: "Current password is incorrect." })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password
    await pool.query("UPDATE employees SET password = ? WHERE id = ?", [hashedPassword, req.user.id])

    res.json({ message: "Password updated successfully." })
  } catch (error) {
    console.error("Error updating password:", error)
    res.status(500).json({ message: "Server error." })
  }
})

// Leave Type Routes
app.get("/api/leave-types", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM leave_types ORDER BY name")

    res.json(rows)
  } catch (error) {
    console.error("Error fetching leave types:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.post("/api/leave-types", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, defaultDays } = req.body

    // Validate input
    if (!name || !description || !defaultDays) {
      return res.status(400).json({ message: "All fields are required." })
    }

    // Insert new leave type
    const [result] = await pool.query("INSERT INTO leave_types (name, description, default_days) VALUES (?, ?, ?)", [
      name,
      description,
      defaultDays,
    ])

    // Get the created leave type
    const [newLeaveType] = await pool.query("SELECT * FROM leave_types WHERE id = ?", [result.insertId])

    res.status(201).json(newLeaveType[0])
  } catch (error) {
    console.error("Error creating leave type:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.put("/api/leave-types/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, defaultDays } = req.body

    // Validate input
    if (!name || !description || !defaultDays) {
      return res.status(400).json({ message: "All fields are required." })
    }

    // Check if leave type exists
    const [existingLeaveType] = await pool.query("SELECT id FROM leave_types WHERE id = ?", [id])

    if (existingLeaveType.length === 0) {
      return res.status(404).json({ message: "Leave type not found." })
    }

    // Update leave type
    await pool.query("UPDATE leave_types SET name = ?, description = ?, default_days = ? WHERE id = ?", [
      name,
      description,
      defaultDays,
      id,
    ])

    // Get the updated leave type
    const [updatedLeaveType] = await pool.query("SELECT * FROM leave_types WHERE id = ?", [id])

    res.json(updatedLeaveType[0])
  } catch (error) {
    console.error("Error updating leave type:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.delete("/api/leave-types/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if leave type exists
    const [existingLeaveType] = await pool.query("SELECT id FROM leave_types WHERE id = ?", [id])

    if (existingLeaveType.length === 0) {
      return res.status(404).json({ message: "Leave type not found." })
    }

    // Delete leave type
    await pool.query("DELETE FROM leave_types WHERE id = ?", [id])

    res.json({ message: "Leave type deleted successfully." })
  } catch (error) {
    console.error("Error deleting leave type:", error)
    res.status(500).json({ message: "Server error." })
  }
})

// Leave Routes
app.get("/api/leaves", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.employee_id, l.leave_type_id, lt.name as leave_type, 
       l.start_date, l.end_date, l.days, l.reason, l.status, l.comment, l.created_at
       FROM leaves l
       JOIN leave_types lt ON l.leave_type_id = lt.id
       WHERE l.employee_id = ?
       ORDER BY l.created_at DESC`,
      [req.user.id],
    )

    res.json(rows)
  } catch (error) {
    console.error("Error fetching leaves:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.get("/api/leaves/recent", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.employee_id, l.leave_type_id, lt.name as leave_type, 
       l.start_date, l.end_date, l.days, l.reason, l.status, l.comment, l.created_at
       FROM leaves l
       JOIN leave_types lt ON l.leave_type_id = lt.id
       WHERE l.employee_id = ?
       ORDER BY l.created_at DESC
       LIMIT 5`,
      [req.user.id],
    )

    res.json(rows)
  } catch (error) {
    console.error("Error fetching recent leaves:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.post("/api/leaves", authenticateToken, async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, days, reason } = req.body

    // Validate input
    if (!leaveTypeId || !startDate || !endDate || !days || !reason) {
      return res.status(400).json({ message: "All fields are required." })
    }

    // Insert new leave request
    const [result] = await pool.query(
      `INSERT INTO leaves (employee_id, leave_type_id, start_date, end_date, days, reason, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [req.user.id, leaveTypeId, startDate, endDate, days, reason],
    )

    // Get the created leave request
    const [newLeave] = await pool.query(
      `SELECT l.id, l.employee_id, l.leave_type_id, lt.name as leave_type, 
       l.start_date, l.end_date, l.days, l.reason, l.status, l.comment, l.created_at
       FROM leaves l
       JOIN leave_types lt ON l.leave_type_id = lt.id
       WHERE l.id = ?`,
      [result.insertId],
    )

    res.status(201).json(newLeave[0])
  } catch (error) {
    console.error("Error creating leave request:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.get("/api/admin/leaves", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.employee_id, e.name as employee_name, l.leave_type_id, 
       lt.name as leave_type, l.start_date, l.end_date, l.days, l.reason, 
       l.status, l.comment, l.created_at
       FROM leaves l
       JOIN employees e ON l.employee_id = e.id
       JOIN leave_types lt ON l.leave_type_id = lt.id
       ORDER BY l.created_at DESC`,
    )

    res.json(rows)
  } catch (error) {
    console.error("Error fetching all leaves:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.put("/api/admin/leaves/:id/approve", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { comment } = req.body

    // Check if leave request exists
    const [existingLeave] = await pool.query("SELECT id FROM leaves WHERE id = ?", [id])

    if (existingLeave.length === 0) {
      return res.status(404).json({ message: "Leave request not found." })
    }

    // Update leave request status
    await pool.query("UPDATE leaves SET status = ?, comment = ? WHERE id = ?", ["Approved", comment || null, id])

    res.json({ message: "Leave request approved successfully." })
  } catch (error) {
    console.error("Error approving leave request:", error)
    res.status(500).json({ message: "Server error." })
  }
})

app.put("/api/admin/leaves/:id/reject", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { comment } = req.body

    // Check if leave request exists
    const [existingLeave] = await pool.query("SELECT id FROM leaves WHERE id = ?", [id])

    if (existingLeave.length === 0) {
      return res.status(404).json({ message: "Leave request not found." })
    }

    // Update leave request status
    await pool.query("UPDATE leaves SET status = ?, comment = ? WHERE id = ?", ["Rejected", comment || null, id])

    res.json({ message: "Leave request rejected successfully." })
  } catch (error) {
    console.error("Error rejecting leave request:", error)
    res.status(500).json({ message: "Server error." })
  }
})

// Leave Balance Routes
app.get("/api/leave-balance", authenticateToken, async (req, res) => {
  try {
    // Get all leave types
    const [leaveTypes] = await pool.query("SELECT * FROM leave_types")

    // Get leave balance for each type
    const leaveBalance = await Promise.all(
      leaveTypes.map(async (type) => {
        // Get total days taken for this leave type in the current year
        const [takenLeaves] = await pool.query(
          `SELECT SUM(days) as total_days
           FROM leaves
           WHERE employee_id = ? AND leave_type_id = ? AND status = 'Approved'
           AND YEAR(start_date) = YEAR(CURDATE())`,
          [req.user.id, type.id],
        )

        const takenDays = takenLeaves[0].total_days || 0
        const remainingDays = type.default_days - takenDays

        return {
          id: type.id,
          leaveType: type.name,
          total: type.default_days,
          taken: takenDays,
          remaining: remainingDays,
        }
      }),
    )

    res.json(leaveBalance)
  } catch (error) {
    console.error("Error fetching leave balance:", error)
    res.status(500).json({ message: "Server error." })
  }
})

// Admin Dashboard Routes
app.get("/api/admin/dashboard", authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get total employees
    const [totalEmployeesResult] = await pool.query('SELECT COUNT(*) as count FROM employees WHERE role = "employee"')
    const totalEmployees = totalEmployeesResult[0].count

    // Get pending requests
    const [pendingRequestsResult] = await pool.query('SELECT COUNT(*) as count FROM leaves WHERE status = "Pending"')
    const pendingRequests = pendingRequestsResult[0].count

    // Get approved leaves
    const [approvedLeavesResult] = await pool.query('SELECT COUNT(*) as count FROM leaves WHERE status = "Approved"')
    const approvedLeaves = approvedLeavesResult[0].count

    // Get rejected leaves
    const [rejectedLeavesResult] = await pool.query('SELECT COUNT(*) as count FROM leaves WHERE status = "Rejected"')
    const rejectedLeaves = rejectedLeavesResult[0].count

    // Get leaves by status for pie chart
    const [leavesByStatusResult] = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM leaves
       GROUP BY status`,
    )

    const leavesByStatus = leavesByStatusResult.map((item) => ({
      name: item.status,
      value: item.count,
    }))

    // Get leaves by type for bar chart
    const [leavesByTypeResult] = await pool.query(
      `SELECT lt.name, COUNT(l.id) as count
       FROM leaves l
       JOIN leave_types lt ON l.leave_type_id = lt.id
       GROUP BY l.leave_type_id`,
    )

    const leavesByType = leavesByTypeResult.map((item) => ({
      name: item.name,
      value: item.count,
    }))

    // Get recent leave requests
    const [recentRequests] = await pool.query(
      `SELECT l.id, e.name as employeeName, lt.name as leaveType, 
       l.start_date as startDate, l.end_date as endDate, l.days, l.status, l.created_at as createdAt
       FROM leaves l
       JOIN employees e ON l.employee_id = e.id
       JOIN leave_types lt ON l.leave_type_id = lt.id
       ORDER BY l.created_at DESC
       LIMIT 6`,
    )

    res.json({
      totalEmployees,
      pendingRequests,
      approvedLeaves,
      rejectedLeaves,
      leavesByStatus,
      leavesByType,
      recentRequests,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    res.status(500).json({ message: "Server error." })
  }
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

