"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./TeamMemberDashboard.module.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Comment = {
  id: number;
  userId: number;
  message: string;
  createdAt: string;
};

type Task = {
  id: number;
  title: string;
  dueDate?: string;
  status?: string;
};

const TeamMemberDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState("");

  // prevent SSR/localStorage crash
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "{}"
    );
    setCurrentUserId(currentUser?.id || null);
  }, []);

  //  LOAD TASKS + REMINDER 
  useEffect(() => {
    if (!currentUserId) return;

    fetch(`/api/tasks?assignedTo=${currentUserId}`)
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);

        const pending = data.filter((t: any) => t.status === "pending");
        const progress = data.filter((t: any) => t.status === "in-progress");

        const overdue = data.filter(
          (t: any) =>
            t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            t.status !== "completed"
        );

        let msg = "";

        if (pending.length)
          msg += `📌 ${pending.length} pending task(s). `;
        if (progress.length)
          msg += `🚧 ${progress.length} in progress. `;
        if (overdue.length)
          msg += `⚠️ ${overdue.length} overdue!`;

        if (msg) {
          setNotification(msg);
          setTimeout(() => setNotification(""), 5000);
        }
      });
  }, [currentUserId]);

  const logout = () =>{
    localStorage.removeItem("currentUser");
    router.push("/login");
  }
  //  LOAD COMMENTS 
  useEffect(() => {
    if (!selectedTask) return;

    fetch(`/api/tasks/${selectedTask.id}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
      });
  }, [selectedTask]);

  //  UPDATE STATUS 
const updateStatus = async (id: number, status: string) => {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      completed: status === "completed",
    }),
  });

  if (!res.ok) {
    console.error("Update failed");
    return;
  }

  const data = await res.json();

  setTasks((prev) =>
    prev.map((t) => (t.id === id ? data : t))
  );

  setNotification(`✅ Task marked as ${status}`);
  setTimeout(() => setNotification(""), 2000);
};

  // ADD COMMENT 
  const addComment = async () => {
    if (!selectedTask || newComment.trim() === "" || !currentUserId) return;

    const res = await fetch(
      `/api/tasks/${selectedTask.id}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newComment,
          userId: currentUserId,
        }),
      }
    );

    const data = await res.json();

    setComments((prev) => [...prev, data.comment]);
    setNewComment("");
  };

  //  SUMMARY 
  const summary = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const chartData = [
    { name: "Pending", value: summary.pending },
    { name: "Progress", value: summary.inProgress },
    { name: "Done", value: summary.completed },
  ];

  return (
    <div className={`${styles.container} ${darkMode ? styles.dark : ""}`}>
      <button onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "☀️ Light" : "🌙 Dark"}
      </button>
       <button onClick={logout} className={styles.logoutBtn}>
        Logout
       </button>
      <h1 className={styles.title}>Team Member Dashboard</h1>
      {notification && (
        <div className={styles.toast}>🔔 {notification}</div>
      )}

      <div className={styles.cards}>
        <div className={styles.card}>
          <p>Total</p>
          <h3>{summary.total}</h3>
        </div>
        <div className={styles.card}>
          <p>Pending</p>
          <h3>{summary.pending}</h3>
        </div>
        <div className={styles.card}>
          <p>Progress</p>
          <h3>{summary.inProgress}</h3>
        </div>
        <div className={styles.card}>
          <p>Done</p>
          <h3>{summary.completed}</h3>
        </div>
      </div>

      <div style={{ width: "100%", height: 250 }}>
  <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className={styles.taskListTitle}>Your Tasks</h2>

      {tasks.map((task) => (
        <div
          key={task.id}
          className={styles.taskCard}
          onClick={() => setSelectedTask(task)}
        >
          <h3>{task.title}</h3>
          <p>Due: {task.dueDate}</p>
          <p>Status: {task.status}</p>

          <div className={styles.buttons}>
            <button
              className={`${styles.btn} ${styles.start}`}
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(task.id, "in-progress");
              }}
            >
              Start
            </button>

            <button
              className={`${styles.btn} ${styles.complete}`}
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(task.id, "completed");
              }}
            >
              Complete
            </button>
          </div>
        </div>
      ))}

      {selectedTask && (
        <div className={styles.detailBox}>
          <h3>{selectedTask.title}</h3>
          <p>Status: {selectedTask.status}</p>

          <h4>Comments</h4>

         {comments
             ?.filter((c) => c && c.id)
               .map((c) => (
               <p key={c.id}>
                👤 {c?.userId ?? "Unknown"}: {c?.message ?? ""}
                </p>
               ))}

          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write comment"
          />

          <button onClick={addComment}>Send</button>

          <button onClick={() => setSelectedTask(null)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamMemberDashboard;