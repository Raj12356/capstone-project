"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

interface User {
  name: string;
  email: string;
  role: "admin" | "manager" | "user" | "team member";
  status: "active" | "inactive";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "customization" | "settings"
  >("dashboard");

  const [categories, setCategories] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [labelInput, setLabelInput] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");

    if (!storedUser) {
      alert("Access denied! Admins only.");
      router.push("/login");
      return;
    }

    const parsedUser: User = JSON.parse(storedUser);

    if (!parsedUser || parsedUser.role !== "admin") {
      alert("Access denied! Admins only.");
      router.push("/login");
      return;
    }

    setCurrentUser(parsedUser);
    setAuthorized(true);

    fetch("/api/users")
      .then((res) => res.json())
      .then((data: User[]) => {
        const updated = data.map((u) => ({
          ...u,
          status: u.status || "active",
        }));
        setUsers(updated);
      })
      .catch(() => setUsers([]));
  }, [router]);

  if (!authorized) return null;

  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalManagers = users.filter((u) => u.role === "manager").length;
  const totalTeamMembers = users.filter(
    (u) => u.role === "user" || u.role === "team member"
  ).length;

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  const toggleStatus = (email: string) => {
    const updatedUsers = users.map((u) =>
      u.email === email
        ? {
            ...u,
            status: u.status === "active" ? "inactive" : "active",
          }
        : u
    );

    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h2>Admin</h2>
        <ul>
          <li onClick={() => setActiveTab("dashboard")}>Dashboard</li>
          <li onClick={() => setActiveTab("users")}>User Management</li>
          <li onClick={() => setActiveTab("customization")}>Customization</li>
          <li onClick={() => setActiveTab("settings")}>System Settings</li>
          <li onClick={handleLogout} style={{ color: "red" }}>
            Logout
          </li>
        </ul>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <h2>Admin Dashboard</h2>
          <span>{currentUser?.name}</span>
        </div>

        {activeTab === "dashboard" && (
          <div className={styles.cards}>
            <div className={`${styles.card} ${styles.purple}`}>
              <h3>Total Users</h3>
              <h2>{totalUsers}</h2>
            </div>

            <div className={`${styles.card} ${styles.blue}`}>
              <h3>Admins</h3>
              <h2>{totalAdmins}</h2>
            </div>

            <div className={`${styles.card} ${styles.orange}`}>
              <h3>Managers</h3>
              <h2>{totalManagers}</h2>
            </div>

            <div className={`${styles.card} ${styles.green}`}>
              <h3>Users</h3>
              <h2>{totalTeamMembers}</h2>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className={styles.table}>
            <h3>User Management</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.email}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>

                    <td>
                      <button
                        onClick={() => toggleStatus(user.email)}
                        style={{
                          background:
                            user.status === "active" ? "green" : "gray",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          cursor: "pointer",
                        }}
                      >
                        {user.status === "active"
                          ? "Active"
                          : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "customization" && (
          <div className={styles.content}>
            <h3>Customization</h3>

            <form
              className={styles.form}
              onSubmit={async (e) => {
                e.preventDefault();

                await fetch("/api/categories", {
                  method: "POST",
                  body: JSON.stringify({ categories }),
                });

                await fetch("/api/labels", {
                  method: "POST",
                  body: JSON.stringify({ labels }),
                });

                alert("Saved successfully!");
              }}
            >
              <label>
                Task Categories:
                <input
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => {
                    if (!categoryInput) return;
                    setCategories([...categories, categoryInput]);
                    setCategoryInput("");
                  }}
                >
                  Add
                </button>

                <ul>
                  {categories.map((c, i) => (
                    <li key={i}>
                      {c}
                      <button
                        type="button"
                        onClick={() =>
                          setCategories(
                            categories.filter((_, index) => index !== i)
                          )
                        }
                      ></button>
                    </li>
                  ))}
                </ul>
              </label>

              <label>
                Labels:
                <input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => {
                    if (!labelInput) return;
                    setLabels([...labels, labelInput]);
                    setLabelInput("");
                  }}
                >
                  Add
                </button>

                <ul>
                  {labels.map((l, i) => (
                    <li key={i}>
                      {l}
                      <button
                        type="button"
                        onClick={() =>
                          setLabels(
                            labels.filter((_, index) => index !== i)
                          )
                        }
                      >

                      </button>
                    </li>
                  ))}
                </ul>
              </label>

              <button type="submit" className={styles.button}>
                Save Changes
              </button>
            </form>
          </div>
        )}

        {activeTab === "settings" && (
          <div className={styles.content}>
            <h3>System Settings</h3>
            <p>Manage system configurations here.</p>
          </div>
        )}
      </main>
    </div>
  );
}