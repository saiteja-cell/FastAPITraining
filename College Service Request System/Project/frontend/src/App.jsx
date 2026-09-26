import { useState } from "react";
import "./index.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  const [requests, setRequests] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("cat001");

  // Each request now has its own staff input
  const [staffIds, setStaffIds] = useState({});

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

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const loginResponse = await fetch(
        "http://127.0.0.1:8000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        alert(loginData.detail || "Login failed");
        return;
      }

      const token = loginData.access_token;

      localStorage.setItem("access_token", token);

      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.sub;

      const userResponse = await fetch(
        `http://127.0.0.1:8000/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        alert("Could not get user details");
        return;
      }

      setUser(userData);

      // Load requests immediately after login
      const requestResponse = await fetch(
        "http://127.0.0.1:8000/service-requests/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const requestData = await requestResponse.json();

      if (requestResponse.ok) {
        setRequests(requestData);
      }
    } catch (error) {
      alert("Could not connect to backend");
    }
  };

  // =========================================================
  // LOAD REQUESTS
  // =========================================================

  const loadRequests = async () => {
    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/service-requests/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Could not load requests");
        return;
      }

      setRequests(data);
    } catch (error) {
      alert("Could not connect to backend");
    }
  };

  // =========================================================
  // CREATE REQUEST
  // =========================================================

  const createRequest = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/service-requests/",
        {
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Could not create request");
        return;
      }

      alert("Service request created successfully!");

      setTitle("");
      setDescription("");
      setCategoryId("cat001");

      loadRequests();
    } catch (error) {
      alert("Could not connect to backend");
    }
  };

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  const updateStatus = async (requestId, newStatus) => {
    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/service-requests/${requestId}/status`,
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
        alert(data.detail || "Could not update status");
        return;
      }

      loadRequests();
    } catch (error) {
      alert("Could not connect to backend");
    }
  };

  // =========================================================
  // ASSIGN / REASSIGN REQUEST
  // =========================================================

  const assignRequest = async (requestId) => {
    const token = localStorage.getItem("access_token");

    const staffId = staffIds[requestId] || "";

    if (!staffId.trim()) {
      alert("Enter staff ID");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/service-requests/${requestId}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            assigned_to: staffId.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Could not assign request");
        return;
      }

      alert("Request assigned successfully!");

      // Clear only this request's input
      setStaffIds((prev) => ({
        ...prev,
        [requestId]: "",
      }));

      loadRequests();
    } catch (error) {
      alert("Could not connect to backend");
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setUser(null);
    setEmail("");
    setPassword("");
    setRequests([]);
    setTitle("");
    setDescription("");
    setCategoryId("cat001");
    setStaffIds({});
  };

  // =========================================================
  // LOGIN SCREEN
  // =========================================================

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-icon">CS</div>

            <div>
              <h1>College Service</h1>
              <p>Request Management System</p>
            </div>
          </div>

          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>Sign in to access your service dashboard.</p>
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
            >
              Sign In
            </button>
          </form>

          <div className="login-footer">
            College Service Request System
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ROLE INFORMATION
  // =========================================================

  const roleNames = {
    student: "Student",
    faculty: "Faculty",
    service_staff: "Service Staff",
    service_lead: "Service Lead",
    admin: "Administrator",
  };

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="app-layout">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon small">CS</div>

          <div>
            <h2>College Service</h2>
            <span>Request System</span>
          </div>
        </div>

        <div className="sidebar-divider"></div>

        <nav className="sidebar-nav">

          <div className="nav-item active">
            <span className="nav-icon">⌂</span>
            Dashboard
          </div>

          {(user.role === "student" ||
            user.role === "faculty") && (
            <div className="nav-item">
              <span className="nav-icon">▣</span>
              My Requests
            </div>
          )}

          {user.role === "service_staff" && (
            <div className="nav-item">
              <span className="nav-icon">✓</span>
              Assigned Requests
            </div>
          )}

          {user.role === "service_lead" && (
            <div className="nav-item">
              <span className="nav-icon">≡</span>
              All Requests
            </div>
          )}

          {user.role === "admin" && (
            <div className="nav-item">
              <span className="nav-icon">⚙</span>
              Administration
            </div>
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="user-mini">
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

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">

        <header className="topbar">

          <div>
            <p className="topbar-label">Dashboard</p>
            <h1>Welcome back, {user.name}</h1>
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

        {/* ===================================================
            STUDENT
        =================================================== */}

        {user.role === "student" && (
          <>

            <section className="stats-grid">

              <div className="stat-card">
                <div className="stat-icon blue">▣</div>

                <div>
                  <span>Total Requests</span>
                  <strong>{requests.length}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">◷</div>

                <div>
                  <span>Open Requests</span>

                  <strong>
                    {
                      requests.filter(
                        (r) =>
                          r.status !== "closed" &&
                          r.status !== "resolved"
                      ).length
                    }
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">✓</div>

                <div>
                  <span>Completed</span>

                  <strong>
                    {
                      requests.filter(
                        (r) =>
                          r.status === "resolved" ||
                          r.status === "closed"
                      ).length
                    }
                  </strong>
                </div>
              </div>

            </section>

            <section className="content-grid">

              <div className="panel">

                <div className="panel-header">

                  <div>
                    <h2>Create Service Request</h2>
                    <p>
                      Submit a new request to the service office.
                    </p>
                  </div>

                </div>

                <form
                  onSubmit={createRequest}
                  className="request-form"
                >

                  <div className="form-group">

                    <label>Request Title</label>

                    <input
                      type="text"
                      placeholder="Enter request title"
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
                      placeholder="Describe your request"
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

                      <option value="cat001">
                        Bonafide Certificate
                      </option>

                      <option value="cat002">
                        ID Card
                      </option>

                      <option value="cat003">
                        Hostel
                      </option>

                      <option value="cat004">
                        Transport
                      </option>

                      <option value="cat005">
                        Library
                      </option>

                      <option value="cat006">
                        IT Support
                      </option>

                    </select>

                  </div>

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Create Request
                  </button>

                </form>

              </div>

            </section>

            <section className="panel requests-panel">

              <div className="panel-header">

                <div>
                  <h2>My Service Requests</h2>
                  <p>
                    Track the status of your submitted requests.
                  </p>
                </div>

                <button
                  onClick={loadRequests}
                  className="secondary-button"
                >
                  Refresh Requests
                </button>

              </div>

              <RequestList
                requests={requests}
                categoryNames={categoryNames}
                statusLabels={statusLabels}
                getStatusClass={getStatusClass}
              />

            </section>

          </>
        )}

        {/* ===================================================
            FACULTY
        =================================================== */}

        {user.role === "faculty" && (
          <>

            <section className="stats-grid">

              <div className="stat-card">
                <div className="stat-icon blue">▣</div>

                <div>
                  <span>Total Requests</span>
                  <strong>{requests.length}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">◷</div>

                <div>
                  <span>Open Requests</span>

                  <strong>
                    {
                      requests.filter(
                        (r) =>
                          r.status !== "closed" &&
                          r.status !== "resolved"
                      ).length
                    }
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">✓</div>

                <div>
                  <span>Completed</span>

                  <strong>
                    {
                      requests.filter(
                        (r) =>
                          r.status === "resolved" ||
                          r.status === "closed"
                      ).length
                    }
                  </strong>
                </div>
              </div>

            </section>

            <section className="content-grid">

              <div className="panel">

                <div className="panel-header">

                  <div>
                    <h2>Create Service Request</h2>
                    <p>
                      Submit a new request to the service office.
                    </p>
                  </div>

                </div>

                <form
                  onSubmit={createRequest}
                  className="request-form"
                >

                  <div className="form-group">

                    <label>Request Title</label>

                    <input
                      type="text"
                      placeholder="Enter request title"
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
                      placeholder="Describe your request"
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

                      <option value="cat001">
                        Bonafide Certificate
                      </option>

                      <option value="cat002">
                        ID Card
                      </option>

                      <option value="cat003">
                        Hostel
                      </option>

                      <option value="cat004">
                        Transport
                      </option>

                      <option value="cat005">
                        Library
                      </option>

                      <option value="cat006">
                        IT Support
                      </option>

                    </select>

                  </div>

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Create Request
                  </button>

                </form>

              </div>

            </section>

            <section className="panel requests-panel">

              <div className="panel-header">

                <div>
                  <h2>My Service Requests</h2>
                  <p>
                    Track the status of your submitted requests.
                  </p>
                </div>

                <button
                  onClick={loadRequests}
                  className="secondary-button"
                >
                  Refresh Requests
                </button>

              </div>

              <RequestList
                requests={requests}
                categoryNames={categoryNames}
                statusLabels={statusLabels}
                getStatusClass={getStatusClass}
              />

            </section>

          </>
        )}

        {/* ===================================================
            SERVICE STAFF
        =================================================== */}

        {user.role === "service_staff" && (
          <>

            <section className="page-intro">

              <div>
                <h2>Assigned Requests</h2>

                <p>
                  View and process service requests assigned to you.
                </p>
              </div>

              <button
                onClick={loadRequests}
                className="primary-button"
              >
                Refresh Requests
              </button>

            </section>

            <section className="request-list">

              {requests.length === 0 ? (

                <EmptyState
                  message="No assigned requests found."
                />

              ) : (

                requests.map((request) => (

                  <div
                    className="request-card"
                    key={request.id}
                  >

                    <div className="request-card-top">

                      <div>

                        <span className="request-category">
                          {categoryNames[request.category_id] ||
                            request.category_id}
                        </span>

                        <h3>{request.title}</h3>

                      </div>

                      <span
                        className={getStatusClass(
                          request.status
                        )}
                      >
                        {statusLabels[request.status] ||
                          request.status}
                      </span>

                    </div>

                    <p className="request-description">
                      {request.description}
                    </p>

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

                ))

              )}

            </section>

          </>
        )}

        {/* ===================================================
            SERVICE LEAD
        =================================================== */}

        {user.role === "service_lead" && (
          <>

            <section className="page-intro">

              <div>

                <h2>Service Requests</h2>

                <p>
                  Monitor requests and assign them to service staff.
                </p>

              </div>

              <button
                onClick={loadRequests}
                className="primary-button"
              >
                Refresh Requests
              </button>

            </section>

            <section className="request-list">

              {requests.length === 0 ? (

                <EmptyState
                  message="No service requests found."
                />

              ) : (

                requests.map((request) => (

                  <div
                    className="request-card"
                    key={request.id}
                  >

                    <div className="request-card-top">

                      <div>

                        <span className="request-category">
                          {categoryNames[request.category_id] ||
                            request.category_id}
                        </span>

                        <h3>{request.title}</h3>

                      </div>

                      <span
                        className={getStatusClass(
                          request.status
                        )}
                      >
                        {statusLabels[request.status] ||
                          request.status}
                      </span>

                    </div>

                    <p className="request-description">
                      {request.description}
                    </p>

                    <div className="assignment-info">

                      <span>Assigned Staff</span>

                      <strong>
                        {request.assigned_to ||
                          "Not Assigned"}
                      </strong>

                    </div>

                    <div className="assignment-area">

                      {/* IMPORTANT:
                          Each request uses its own value
                      */}

                      <input
                        type="text"
                        placeholder="Enter staff ID e.g. staff001"
                        value={staffIds[request.id] || ""}
                        onChange={(e) =>
                          setStaffIds((prev) => ({
                            ...prev,
                            [request.id]: e.target.value,
                          }))
                        }
                      />

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

                ))

              )}

            </section>

          </>
        )}

        {/* ===================================================
            ADMIN
        =================================================== */}

        {user.role === "admin" && (
          <>

            <section className="stats-grid">

              <div className="stat-card">

                <div className="stat-icon blue">
                  U
                </div>

                <div>
                  <span>System Users</span>
                  <strong>5</strong>
                </div>

              </div>

              <div className="stat-card">

                <div className="stat-icon purple">
                  S
                </div>

                <div>
                  <span>Service Categories</span>
                  <strong>6</strong>
                </div>

              </div>

              <div className="stat-card">

                <div className="stat-icon green">
                  ✓
                </div>

                <div>
                  <span>System Status</span>
                  <strong>Active</strong>
                </div>

              </div>

            </section>

            <section className="admin-grid">

              <div className="panel">

                <div className="admin-icon blue-bg">
                  U
                </div>

                <h2>User Management</h2>

                <p>
                  Manage student, faculty, service staff,
                  service lead, and administrator accounts.
                </p>

                <div className="feature-label">
                  Available
                </div>

              </div>

              <div className="panel">

                <div className="admin-icon purple-bg">
                  S
                </div>

                <h2>Service Categories</h2>

                <p>
                  Manage the service categories available
                  in the college service system.
                </p>

                <div className="feature-label">
                  Available
                </div>

              </div>

              <div className="panel">

                <div className="admin-icon green-bg">
                  ⚙
                </div>

                <h2>System Configuration</h2>

                <p>
                  Administrative configuration for the
                  college service request system.
                </p>

                <div className="feature-label">
                  Available
                </div>

              </div>

            </section>

          </>
        )}

      </main>
    </div>
  );
}

// =========================================================
// REQUEST LIST COMPONENT
// =========================================================

function RequestList({
  requests,
  categoryNames,
  statusLabels,
  getStatusClass,
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        message="No service requests found. Click Refresh Requests to load your requests."
      />
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

          <span>
            {categoryNames[request.category_id] ||
              request.category_id}
          </span>

          <span
            className={getStatusClass(request.status)}
          >
            {statusLabels[request.status] ||
              request.status}
          </span>

        </div>

      ))}

    </div>
  );
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">▣</div>
      <p>{message}</p>
    </div>
  );
}

export default App;