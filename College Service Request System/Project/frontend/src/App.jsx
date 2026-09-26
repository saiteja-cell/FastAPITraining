import { useEffect, useState } from "react";
import "./index.css";

const API = "http://127.0.0.1:8000";

const categoryNames = {
  cat001: "Bonafide Certificate",
  cat002: "ID Card",
  cat003: "Hostel",
  cat004: "Transport",
  cat005: "Library",
  cat006: "IT Support",
};

const statusLabels = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  on_hold: "On Hold",
  resolved: "Resolved",
  closed: "Closed",
};

const roleNames = {
  student: "Student",
  faculty: "Faculty",
  service_staff: "Service Staff",
  service_lead: "Service Lead",
  admin: "Administrator",
};

function App() {
  // =========================
  // AUTH
  // =========================

  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // SIDEBAR
  // =========================

  const [activePage, setActivePage] = useState("dashboard");

  // =========================
  // REQUESTS
  // =========================

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // =========================
  // CREATE REQUEST
  // =========================

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("cat001");

  // =========================
  // SERVICE LEAD
  // =========================

  const [staffList, setStaffList] = useState([]);
  const [staffIds, setStaffIds] = useState({});

  // =========================
  // ADMIN
  // =========================

  const [users, setUsers] = useState([]);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("student");

  // =========================
  // HELPERS
  // =========================

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  const showError = (message) => {
    alert(message);
  };

  // =========================
  // SIDEBAR NAVIGATION
  // =========================

  const navigateTo = (page) => {
    setActivePage(page);

    setTimeout(() => {
      const element = document.getElementById(page);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 0);
  };

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.detail || "Login failed");
        return;
      }

      const token = data.access_token;

      localStorage.setItem("access_token", token);

      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.sub;

      const userResponse = await fetch(`${API}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        showError(userData.detail || "Could not load user");
        return;
      }

      setUser(userData);
      setActivePage("dashboard");
    } catch (error) {
      showError("Could not connect to backend");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD REQUESTS
  // =========================

  const loadRequests = async () => {
    const token = getToken();

    if (!token) return;

    setRequestsLoading(true);

    try {
      const response = await fetch(`${API}/service-requests/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.detail || "Could not load requests");
        return;
      }

      setRequests(data);
    } catch (error) {
      showError("Could not connect to backend");
    } finally {
      setRequestsLoading(false);
    }
  };

  // =========================
  // LOAD STAFF
  // =========================

  const loadStaff = async () => {
    const token = getToken();

    if (!token) return;

    try {
      const response = await fetch(`${API}/users/staff`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.detail || "Could not load staff");
        return;
      }

      setStaffList(data);
    } catch (error) {
      showError("Could not connect to backend");
    }
  };

  // =========================
  // LOAD USERS
  // =========================

  const loadUsers = async () => {
    const token = getToken();

    if (!token) return;

    try {
      const response = await fetch(`${API}/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.detail || "Could not load users");
        return;
      }

      setUsers(data);
    } catch (error) {
      showError("Could not connect to backend");
    }
  };

  // =========================
  // INITIAL ROLE DATA
  // =========================

  useEffect(() => {
    if (!user) return;

    setActivePage("dashboard");

    if (
      user.role === "student" ||
      user.role === "faculty" ||
      user.role === "service_staff" ||
      user.role === "service_lead"
    ) {
      loadRequests();
    }

    if (user.role === "service_lead") {
      loadStaff();
    }

    if (user.role === "admin") {
      loadUsers();
    }
  }, [user]);

  // =========================
  // CREATE REQUEST
  // =========================

  const createRequest = async (e) => {
    e.preventDefault();

    const token = getToken();

    try {
      const response = await fetch(`${API}/service-requests/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          category_id: categoryId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.detail || "Could not create request");
        return;
      }

      alert("Service request created successfully.");

      setTitle("");
      setDescription("");
      setCategoryId("cat001");

      loadRequests();
    } catch (error) {
      showError("Could not connect to backend");
    }
  };

  // =========================
  // UPDATE STATUS
  // =========================

  const updateStatus = async (requestId, newStatus) => {
    const token = getToken();

    try {
      const response = await fetch(
        `${API}/service-requests/${requestId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showError(data.detail || "Could not update status");
        return;
      }

      loadRequests();
    } catch (error) {
      showError("Could not connect to backend");
    }
  };

  // =========================
  // STAFF SELECTION
  // =========================

  const handleStaffChange = (requestId, value) => {
    setStaffIds((previous) => ({
      ...previous,
      [requestId]: value,
    }));
  };

  // =========================
  // ASSIGN REQUEST
  // =========================

  const assignRequest = async (requestId) => {
    const token = getToken();
    const selectedStaffId = staffIds[requestId];

    if (!selectedStaffId) {
      showError("Please select a staff member.");
      return;
    }

    try {
      const response = await fetch(
        `${API}/service-requests/${requestId}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            assigned_to: selectedStaffId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showError(data.detail || "Could not assign request");
        return;
      }

      alert("Request assigned successfully.");

      setStaffIds((previous) => ({
        ...previous,
        [requestId]: "",
      }));

      loadRequests();
    } catch (error) {
      showError("Could not connect to backend");
    }
  };

  // =========================
  // CREATE USER
  // =========================

  const createUser = async (e) => {
    e.preventDefault();

    const token = getToken();

    try {
      const response = await fetch(`${API}/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.detail || "Could not create user");
        return;
      }

      alert("User created successfully.");

      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("student");

      loadUsers();
    } catch (error) {
      showError("Could not connect to backend");
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setUser(null);
    setEmail("");
    setPassword("");

    setRequests([]);
    setStaffList([]);
    setUsers([]);
    setStaffIds({});

    setTitle("");
    setDescription("");
    setCategoryId("cat001");

    setActivePage("dashboard");
  };

  // =========================
  // LOGIN SCREEN
  // =========================

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-background">
          <div className="login-glow glow-one"></div>
          <div className="login-glow glow-two"></div>
        </div>

        <div className="login-card">
          <div className="login-brand">
            <div className="brand-icon">CS</div>

            <div>
              <h1>College Service</h1>
              <p>Request Management System</p>
            </div>
          </div>

          <div className="login-heading">
            <span className="eyebrow">SECURE ACCESS</span>
            <h2>Welcome back</h2>
            <p>
              Sign in to manage your college service requests.
            </p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your college email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button full-width"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <span className="footer-dot"></span>
            College Service Request System
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // COUNTS
  // =========================

  const totalRequests = requests.length;

  const openRequests = requests.filter(
    (request) =>
      request.status !== "resolved" &&
      request.status !== "closed"
  ).length;

  const completedRequests = requests.filter(
    (request) =>
      request.status === "resolved" ||
      request.status === "closed"
  ).length;

  const assignedRequests = requests.filter(
    (request) =>
      request.assigned_to &&
      request.assigned_to !== "unassigned"
  ).length;

  const staffCount = users.filter(
    (item) => item.role === "service_staff"
  ).length;

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div className="app-layout">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-brand">
          <div className="brand-icon small">CS</div>

          <div className="brand-text">
            <h2>College Service</h2>
            <span>Request System</span>
          </div>
        </div>

        <div className="sidebar-divider"></div>

        <div className="sidebar-section-title">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">

          <div
            className={`nav-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => navigateTo("dashboard")}
          >
            <span className="nav-icon">⌂</span>
            <span>Dashboard</span>
          </div>

          {(user.role === "student" ||
            user.role === "faculty") && (
            <>
              <div
                className={`nav-item ${
                  activePage === "my-requests" ? "active" : ""
                }`}
                onClick={() => navigateTo("my-requests")}
              >
                <span className="nav-icon">▣</span>
                <span>My Requests</span>
              </div>

              <div
                className={`nav-item ${
                  activePage === "create-request"
                    ? "active"
                    : ""
                }`}
                onClick={() => navigateTo("create-request")}
              >
                <span className="nav-icon">＋</span>
                <span>Create Request</span>
              </div>
            </>
          )}

          {user.role === "service_staff" && (
            <div
              className={`nav-item ${
                activePage === "assigned-requests"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                navigateTo("assigned-requests")
              }
            >
              <span className="nav-icon">✓</span>
              <span>Assigned Requests</span>
            </div>
          )}

          {user.role === "service_lead" && (
            <>
              <div
                className={`nav-item ${
                  activePage === "all-requests"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  navigateTo("all-requests")
                }
              >
                <span className="nav-icon">≡</span>
                <span>All Requests</span>
              </div>

              <div
                className={`nav-item ${
                  activePage === "staff-directory"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  navigateTo("staff-directory")
                }
              >
                <span className="nav-icon">◉</span>
                <span>Staff Directory</span>
              </div>
            </>
          )}

          {user.role === "admin" && (
            <>
              <div
                className={`nav-item ${
                  activePage === "administration"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  navigateTo("administration")
                }
              >
                <span className="nav-icon">⚙</span>
                <span>Administration</span>
              </div>

              <div
                className={`nav-item ${
                  activePage === "user-management"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  navigateTo("user-management")
                }
              >
                <span className="nav-icon">♙</span>
                <span>User Management</span>
              </div>

              <div
                className={`nav-item ${
                  activePage === "system-overview"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  navigateTo("system-overview")
                }
              >
                <span className="nav-icon">▤</span>
                <span>System Overview</span>
              </div>
            </>
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-profile">
            <div className="avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div className="user-mini-info">
              <strong>{user.name}</strong>
              <span>{roleNames[user.role]}</span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main
        className="main-content"
        id="dashboard"
      >

        {/* TOPBAR */}

        <header className="topbar">

          <div className="topbar-left">
            <p className="topbar-label">Dashboard</p>

            <h1>
              Welcome back, {user.name}
            </h1>

            <p className="topbar-subtitle">
              Here's what's happening in your service workspace.
            </p>
          </div>

          <div className="topbar-user">

            <div className="avatar large">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{user.name}</strong>
              <span>{roleNames[user.role]}</span>
            </div>

          </div>

        </header>

        {/* =====================================
            STUDENT / FACULTY
        ===================================== */}

        {(user.role === "student" ||
          user.role === "faculty") && (
          <>
            <section className="stats-grid">

              <StatCard
                icon="▣"
                label="Total Requests"
                value={totalRequests}
                variant="blue"
              />

              <StatCard
                icon="◷"
                label="Open Requests"
                value={openRequests}
                variant="orange"
              />

              <StatCard
                icon="✓"
                label="Completed"
                value={completedRequests}
                variant="green"
              />

            </section>

            <section
              className="content-grid"
              id="create-request"
            >

              <div className="panel">

                <PanelHeader
                  eyebrow="NEW REQUEST"
                  title="Create Service Request"
                  description="Submit a new request to the college service office."
                />

                <form
                  onSubmit={createRequest}
                  className="request-form"
                >

                  <div className="form-group">
                    <label>Request Title</label>

                    <input
                      type="text"
                      placeholder="Example: Need Bonafide Certificate"
                      value={title}
                      onChange={(e) =>
                        setTitle(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>

                    <textarea
                      placeholder="Describe your request clearly..."
                      value={description}
                      onChange={(e) =>
                        setDescription(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Service Category</label>

                    <select
                      value={categoryId}
                      onChange={(e) =>
                        setCategoryId(e.target.value)
                      }
                    >
                      {Object.entries(categoryNames).map(
                        ([id, name]) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Submit Request
                  </button>

                </form>

              </div>

              <div
                className="panel"
                id="my-requests"
              >

                <PanelHeader
                  eyebrow="ACTIVITY"
                  title="My Requests"
                  description="Track the status of your submitted requests."
                  action={
                    <button
                      className="secondary-button"
                      onClick={loadRequests}
                    >
                      Refresh
                    </button>
                  }
                />

                <RequestList
                  requests={requests}
                  categoryNames={categoryNames}
                  statusLabels={statusLabels}
                  getStatusClass={getStatusClass}
                />

              </div>

            </section>
          </>
        )}

        {/* =====================================
            SERVICE STAFF
        ===================================== */}

        {user.role === "service_staff" && (
          <>
            <section className="stats-grid">

              <StatCard
                icon="▣"
                label="Assigned Requests"
                value={totalRequests}
                variant="blue"
              />

              <StatCard
                icon="◷"
                label="In Progress"
                value={
                  requests.filter(
                    (r) => r.status === "in_progress"
                  ).length
                }
                variant="orange"
              />

              <StatCard
                icon="✓"
                label="Resolved"
                value={completedRequests}
                variant="green"
              />

            </section>

            <section
              className="panel full-panel"
              id="assigned-requests"
            >

              <PanelHeader
                eyebrow="SERVICE WORKSPACE"
                title="Assigned Requests"
                description="Process the service requests assigned to you."
                action={
                  <button
                    className="secondary-button"
                    onClick={loadRequests}
                  >
                    Refresh
                  </button>
                }
              />

              {requests.length === 0 ? (
                <EmptyState message="No requests are currently assigned to you." />
              ) : (
                <div className="request-list">

                  {requests.map((request) => (
                    <div
                      className="request-card"
                      key={request.id}
                    >

                      <div className="request-card-top">

                        <div>
                          <span className="request-category">
                            {categoryNames[
                              request.category_id
                            ] || request.category_id}
                          </span>

                          <h3>{request.title}</h3>
                        </div>

                        <span
                          className={getStatusClass(
                            request.status
                          )}
                        >
                          {statusLabels[
                            request.status
                          ] || request.status}
                        </span>

                      </div>

                      <p className="request-description">
                        {request.description}
                      </p>

                      <div className="request-meta">
                        <div>
                          <span>Request ID</span>
                          <strong>{request.id}</strong>
                        </div>

                        <div>
                          <span>Assigned To</span>
                          <strong>
                            {request.assigned_to ||
                              "Not assigned"}
                          </strong>
                        </div>
                      </div>

                      <div className="request-actions">

                        {request.status === "assigned" && (
                          <button
                            className="primary-button"
                            onClick={() =>
                              updateStatus(
                                request.id,
                                "in_progress"
                              )
                            }
                          >
                            Start Processing
                          </button>
                        )}

                        {request.status === "in_progress" && (
                          <>
                            <button
                              className="warning-button"
                              onClick={() =>
                                updateStatus(
                                  request.id,
                                  "on_hold"
                                )
                              }
                            >
                              Put On Hold
                            </button>

                            <button
                              className="success-button"
                              onClick={() =>
                                updateStatus(
                                  request.id,
                                  "resolved"
                                )
                              }
                            >
                              Resolve
                            </button>
                          </>
                        )}

                        {request.status === "on_hold" && (
                          <button
                            className="primary-button"
                            onClick={() =>
                              updateStatus(
                                request.id,
                                "in_progress"
                              )
                            }
                          >
                            Resume
                          </button>
                        )}

                        {request.status === "resolved" && (
                          <button
                            className="success-button"
                            onClick={() =>
                              updateStatus(
                                request.id,
                                "closed"
                              )
                            }
                          >
                            Close Request
                          </button>
                        )}

                        {request.status === "closed" && (
                          <span className="completed-text">
                            ✓ Request completed
                          </span>
                        )}

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </section>
          </>
        )}

        {/* =====================================
            SERVICE LEAD
        ===================================== */}

        {user.role === "service_lead" && (
          <>
            <section className="stats-grid">

              <StatCard
                icon="▣"
                label="Total Requests"
                value={totalRequests}
                variant="blue"
              />

              <StatCard
                icon="◉"
                label="Assigned"
                value={assignedRequests}
                variant="purple"
              />

              <StatCard
                icon="◷"
                label="Pending"
                value={
                  requests.filter(
                    (r) =>
                      r.status === "new" ||
                      r.status === "assigned"
                  ).length
                }
                variant="orange"
              />

              <StatCard
                icon="✓"
                label="Completed"
                value={completedRequests}
                variant="green"
              />

            </section>

            {/* STAFF DIRECTORY */}

            <section
              className="panel"
              id="staff-directory"
            >

              <PanelHeader
                eyebrow="TEAM"
                title="Staff Directory"
                description="View available service staff before assigning requests."
                action={
                  <button
                    className="secondary-button"
                    onClick={loadStaff}
                  >
                    Refresh Staff
                  </button>
                }
              />

              {staffList.length === 0 ? (
                <EmptyState message="No service staff found." />
              ) : (
                <div className="staff-grid">

                  {staffList.map((staff) => (
                    <div
                      className="staff-card"
                      key={staff.id}
                    >

                      <div className="staff-avatar">
                        {staff.name
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="staff-details">
                        <h3>{staff.name}</h3>

                        <span className="staff-role">
                          Service Staff
                        </span>

                        <p>
                          <strong>ID:</strong>{" "}
                          {staff.id}
                        </p>

                        <p>
                          <strong>Email:</strong>{" "}
                          {staff.email}
                        </p>
                      </div>

                    </div>
                  ))}

                </div>
              )}

            </section>

            {/* SERVICE REQUESTS */}

            <section
              className="panel"
              id="all-requests"
            >

              <PanelHeader
                eyebrow="OPERATIONS"
                title="Service Requests"
                description="Monitor requests and assign them to the appropriate staff member."
                action={
                  <button
                    className="secondary-button"
                    onClick={loadRequests}
                  >
                    Refresh Requests
                  </button>
                }
              />

              {requests.length === 0 ? (
                <EmptyState message="No service requests found." />
              ) : (
                <div className="request-list">

                  {requests.map((request) => (
                    <div
                      className="request-card lead-request"
                      key={request.id}
                    >

                      <div className="request-card-top">

                        <div>
                          <span className="request-category">
                            {categoryNames[
                              request.category_id
                            ] || request.category_id}
                          </span>

                          <h3>{request.title}</h3>
                        </div>

                        <span
                          className={getStatusClass(
                            request.status
                          )}
                        >
                          {statusLabels[
                            request.status
                          ] || request.status}
                        </span>

                      </div>

                      <p className="request-description">
                        {request.description}
                      </p>

                      <div className="assignment-current">
                        <span>Current Assignment</span>

                        <strong>
                          {request.assigned_to &&
                          request.assigned_to !==
                            "unassigned"
                            ? request.assigned_to
                            : "Not Assigned"}
                        </strong>
                      </div>

                      <div className="assignment-area">

                        <div className="form-group compact">
                          <label>
                            Assign to Staff
                          </label>

                          <select
                            value={
                              staffIds[request.id] || ""
                            }
                            onChange={(e) =>
                              handleStaffChange(
                                request.id,
                                e.target.value
                              )
                            }
                          >
                            <option value="">
                              Select Staff Member
                            </option>

                            {staffList.map((staff) => (
                              <option
                                key={staff.id}
                                value={staff.id}
                              >
                                {staff.name} — {staff.id}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          className="primary-button"
                          onClick={() =>
                            assignRequest(request.id)
                          }
                        >
                          Assign / Reassign
                        </button>

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </section>
          </>
        )}

        {/* =====================================
            ADMIN
        ===================================== */}

        {user.role === "admin" && (
          <>
            <section className="stats-grid">

              <StatCard
                icon="♙"
                label="System Users"
                value={users.length}
                variant="blue"
              />

              <StatCard
                icon="◉"
                label="Service Staff"
                value={staffCount}
                variant="purple"
              />

              <StatCard
                icon="▤"
                label="Service Categories"
                value={6}
                variant="orange"
              />

              <StatCard
                icon="✓"
                label="System Status"
                value="Active"
                variant="green"
              />

            </section>

            <section
              className="admin-layout"
              id="administration"
            >

              {/* CREATE USER */}

              <div className="panel admin-create-panel">

                <PanelHeader
                  eyebrow="ADMINISTRATION"
                  title="Create User"
                  description="Add a new account to the college service system."
                />

                <form
                  onSubmit={createUser}
                  className="admin-user-form"
                >

                  <div className="form-group">
                    <label>Full Name</label>

                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={newUserName}
                      onChange={(e) =>
                        setNewUserName(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>

                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={newUserEmail}
                      onChange={(e) =>
                        setNewUserEmail(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>

                    <input
                      type="password"
                      placeholder="Create password"
                      value={newUserPassword}
                      onChange={(e) =>
                        setNewUserPassword(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Role</label>

                    <select
                      value={newUserRole}
                      onChange={(e) =>
                        setNewUserRole(e.target.value)
                      }
                    >
                      <option value="student">
                        Student
                      </option>

                      <option value="faculty">
                        Faculty
                      </option>

                      <option value="service_staff">
                        Service Staff
                      </option>

                      <option value="service_lead">
                        Service Lead
                      </option>

                      <option value="admin">
                        Administrator
                      </option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="primary-button full-width"
                  >
                    Create User
                  </button>

                </form>

              </div>

              {/* SYSTEM OVERVIEW */}

              <div
                className="panel"
                id="system-overview"
              >

                <PanelHeader
                  eyebrow="SYSTEM"
                  title="System Overview"
                  description="Current configuration of the service management system."
                />

                <div className="overview-list">

                  <OverviewItem
                    icon="♙"
                    title="User Management"
                    text="Create and manage college service accounts."
                  />

                  <OverviewItem
                    icon="▤"
                    title="Service Categories"
                    text="6 service categories are currently configured."
                  />

                  <OverviewItem
                    icon="✓"
                    title="System Status"
                    text="All core application services are active."
                  />

                  <OverviewItem
                    icon="⚙"
                    title="Access Control"
                    text="Role-based access is enabled for all users."
                  />

                </div>

              </div>

            </section>

            {/* USER TABLE */}

            <section
              className="panel"
              id="user-management"
            >

              <PanelHeader
                eyebrow="USER MANAGEMENT"
                title="System Users"
                description="View all registered accounts and their assigned roles."
                action={
                  <button
                    className="secondary-button"
                    onClick={loadUsers}
                  >
                    Refresh Users
                  </button>
                }
              />

              {users.length === 0 ? (
                <EmptyState message="No users found." />
              ) : (
                <div className="user-table-wrapper">

                  <div className="user-table">

                    <div className="user-table-header">
                      <span>User</span>
                      <span>User ID</span>
                      <span>Email</span>
                      <span>Role</span>
                    </div>

                    {users.map((item) => (
                      <div
                        className="user-table-row"
                        key={item.id}
                      >

                        <div className="user-cell">
                          <div className="table-avatar">
                            {item.name
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <strong>
                            {item.name}
                          </strong>
                        </div>

                        <span className="muted-text">
                          {item.id}
                        </span>

                        <span className="muted-text">
                          {item.email}
                        </span>

                        <span
                          className={`role-badge role-${item.role}`}
                        >
                          {roleNames[item.role] ||
                            item.role}
                        </span>

                      </div>
                    ))}

                  </div>

                </div>
              )}

            </section>
          </>
        )}

      </main>
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon,
  label,
  value,
  variant,
}) {
  return (
    <div className="stat-card">

      <div className={`stat-icon ${variant}`}>
        {icon}
      </div>

      <div className="stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

    </div>
  );
}

// =====================================================
// PANEL HEADER
// =====================================================

function PanelHeader({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="panel-header">

      <div>
        <span className="panel-eyebrow">
          {eyebrow}
        </span>

        <h2>{title}</h2>

        <p>{description}</p>
      </div>

      {action && (
        <div className="panel-action">
          {action}
        </div>
      )}

    </div>
  );
}

// =====================================================
// REQUEST LIST
// =====================================================

function RequestList({
  requests,
  categoryNames,
  statusLabels,
  getStatusClass,
}) {
  if (requests.length === 0) {
    return (
      <EmptyState message="No service requests found." />
    );
  }

  return (
    <div className="request-table">

      <div className="table-header">
        <span>Request</span>
        <span>Category</span>
        <span>Status</span>
      </div>

      {requests.map((request) => (
        <div
          className="table-row"
          key={request.id}
        >

          <div className="table-request">

            <strong>{request.title}</strong>

            <span>
              {request.description}
            </span>

          </div>

          <span className="request-category">
            {categoryNames[
              request.category_id
            ] || request.category_id}
          </span>

          <span
            className={getStatusClass(
              request.status
            )}
          >
            {statusLabels[
              request.status
            ] || request.status}
          </span>

        </div>
      ))}

    </div>
  );
}

// =====================================================
// OVERVIEW ITEM
// =====================================================

function OverviewItem({
  icon,
  title,
  text,
}) {
  return (
    <div className="overview-item">

      <div className="overview-icon">
        {icon}
      </div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

    </div>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================

function EmptyState({ message }) {
  return (
    <div className="empty-state">

      <div className="empty-icon">
        ○
      </div>

      <h3>Nothing here yet</h3>

      <p>{message}</p>

    </div>
  );
}

export default App;