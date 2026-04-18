"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./manager.module.css";

type Comment = {
  id: number;
  userId: number;
  message: string;
  createdAt: string;
};

type Task = {
  id: number;
  title: string;
  assignedTo: number;
  priority: string;
  status: string;
  completed: boolean;
  dueDate: string;
  attachments?: string[];
  comments?: Comment[];
};

export default function ManagerDashboard() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "assign" | "reports"
  >("dashboard");

  const [form, setForm] = useState({
    title: "",
    assignedTo: "",
    priority: "",
    dueDate: "",
    attachments: "",
  });

  const [activeTaskChat, setActiveTaskChat] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // FETCH TASKS
  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // INPUT HANDLER
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ADD TASK
  const addTask = async () => {
    if (!form.title || !form.assignedTo) {
      alert("Fill all required fields");
      return;
    }

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        assignedTo: Number(form.assignedTo),
        priority: form.priority,
        dueDate: form.dueDate,
        status: "pending",
        attachments: form.attachments
          ? form.attachments.split(",").map((a) => a.trim())
          : [],
        comments: [],
      }),
    });

    setForm({
      title: "",
      assignedTo: "",
      priority: "",
      dueDate: "",
      attachments: "",
    });

    fetchTasks();
    setActiveTab("dashboard");
  };

  // SEND MESSAGE
  const sendMessage = async (taskId: number) => {
    if (!newMessage) return;

    await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: 1,
        message: newMessage,
      }),
    });

    setNewMessage("");
    fetchTasks();
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  // STATS
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in-progress").length;
  const overdue = tasks.filter((t) => t.status === "overdue").length;

  const max = Math.max(total, completed, inProgress, overdue) || 1;
  const getHeight = (v: number) => `${(v / max) * 100}%`;

  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <div className={styles.sidebar}>
        <h2>Manager</h2>
        <ul>
          <li onClick={() => setActiveTab("dashboard")}>Dashboard</li>
          <li onClick={() => setActiveTab("assign")}>Assign Task</li>
          <li onClick={() => setActiveTab("reports")}>Reports</li>
          <li onClick={logout} style={{ color: "red", marginTop: "20px" }}>
            Logout
          </li>
        </ul>
      </div>

      <div className={styles.main}>
        <div className={styles.topbar}>
          <h2>Manager Dashboard</h2>
        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <div className={styles.stats}>
              <div className={styles.card}>Total <h3>{total}</h3></div>
              <div className={styles.card}>In Progress <h3>{inProgress}</h3></div>
              <div className={styles.card}>Completed <h3>{completed}</h3></div>
              <div className={styles.cardRed}>Overdue <h3>{overdue}</h3></div>
            </div>

            <div className={styles.table}>
              <h3>All Tasks</h3>

              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Attachments</th>
                    <th>Chat</th>
                  </tr>
                </thead>

                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td>{t.assignedTo}</td>
                      <td>{t.status}</td>
                      <td>{t.dueDate}</td>

                      <td>
                        {t.attachments?.map((link, i) => (
                          <div key={i}>
                            <a href={link} target="_blank">
                              View
                            </a>
                          </div>
                        ))}
                      </td>

                      <td>
                        <button onClick={() => setActiveTaskChat(t.id)}>
                          💬 Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>


              {activeTaskChat && (
                <div className={styles.chatBox}>
                  <h3>Team Communication</h3>

                  <div className={styles.chatMessages}>
                  {tasks
                    .find((t) => t.id === activeTaskChat)
                    ?.comments?.map((c) => (
                      <div key={c.id} className={styles.chatMessage}>
                        <b>User {c.userId}:</b> {c.message}
                      </div>
                    ))}
                    </div>

                  <div className={styles.chatInput}>
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type message..."
                    />
                    <button onClick={() => sendMessage(activeTaskChat)}>
                      Send
                    </button>
                    </div>
                    <div className={styles.chatactions}>
                    <button
                     className={styles.cancelBtn}
                     onClick={() => setActiveTaskChat(null)}>
                      cancel
                     </button>
                     </div>
                  </div>
              )}
            </div>
          </>
        )}

        {/* ASSIGN */}
        {activeTab === "assign" && (
          <div className={styles.form}>
            <h3>Assign Task</h3>

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Task Title"
            />

            <input
              name="assignedTo"
              value={form.assignedTo}
              onChange={handleChange}
              placeholder="User ID"
            />

            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
            >
              <option value="">Priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
            />

            <input
              name="attachments"
              value={form.attachments}
              onChange={handleChange}
              placeholder="Attachment links (comma separated)"
            />

            <button onClick={addTask}>Create Task</button>
          </div>
        )}

        {activeTab === "reports" && (
          <div className={styles.chartBox}>
            <h3>Analytics</h3>

            <div className={styles.barChart}>
              <div className={styles.barItem}>
                <div className={styles.bar} style={{ height: getHeight(total) }} />
                <span>Total</span>
                <b>{total}</b>
              </div>

              <div className={styles.barItem}>
                <div className={styles.barGreen} style={{ height: getHeight(completed) }} />
                <span>Completed</span>
                <b>{completed}</b>
              </div>

              <div className={styles.barItem}>
                <div className={styles.barBlue} style={{ height: getHeight(inProgress) }} />
                <span>In Progress</span>
                <b>{inProgress}</b>
              </div>

              <div className={styles.barItem}>
                <div className={styles.barRed} style={{ height: getHeight(overdue) }} />
                <span>Overdue</span>
                <b>{overdue}</b>
              </div>
            </div>

            <hr />

            <p>Completion Rate</p>
            <h3>
              {total > 0 ? ((completed / total) * 100).toFixed(1) : 0}%
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}