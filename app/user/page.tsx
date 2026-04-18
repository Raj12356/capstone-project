"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./user.module.css";

type User = {
  id: number;
  name: string;
  role: string;
};

type Task = {
  id: number;
  userId: number;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  category: string;
  completed: boolean;
  attachments?: string[];
};

export default function UserDashboard() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "create" | "tasks"
  >("dashboard");

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    category: "",
    attachments: "",
  });

  const [activeFilters, setActiveFilters] = useState({
    status: "all",
    priority: "all",
    sort: "latest",
  });

  // AUTH
  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) return;

    const user = JSON.parse(stored);
    setCurrentUser(user);
    setAuthorized(true);
	
	 if ("Notification" in window) {
   Notification.requestPermission();
   }
  }, []);
  
  // FETCH TASKS
  useEffect(() => {
    if (!currentUser?.id) return;

    fetch(`/api/tasks?userId=${currentUser.id}`)
      .then((res) => res.json())
      .then(setTasks);
  }, [currentUser]);

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  // ADD TASK
  const addTask = async () => {
    if (!form.title || !currentUser) return;

    const res = await fetch(`/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        attachments: form.attachments
          ? form.attachments.split(",").map((a) => a.trim())
          : [],
        userId: currentUser.id,
        completed: false,
      }),
    });

    const newTask = await res.json();
    setTasks((prev) => [newTask, ...prev]);

    setActiveTab("dashboard");

    setForm({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      category: "",
      attachments: "",
    });
  };
  
  useEffect(() => {
  if (!tasks.length) return;

  const now = new Date();

  tasks.forEach((task) => {
    if (!task.dueDate || task.completed) return;

    const due = new Date(task.dueDate);
    const diff =
      (due.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24);

    if (diff <= 1 && diff > 0) {
      if (Notification.permission === "granted") {
        new Notification("⏰ Task Reminder", {
          body: `${task.title} is due tomorrow!`,
        });
      }
    }
  });
}, [tasks]);

  // TOGGLE TASK
  const toggleTask = async (task: Task) => {
    await fetch(`/api/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        completed: !task.completed,
      }),
    });

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, completed: !task.completed }
          : t
      )
    );
  };

  // DELETE TASK
  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks?id=${id}`, {
      method: "DELETE",
    });

    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // SAVE EDIT
  const saveEdit = async () => {
    if (!editingTask) return;

    await fetch(`/api/tasks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingTask),
    });

    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingTask.id ? editingTask : t
      )
    );

    setEditingTask(null);
  };

  // STATS
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;

  const overdue = tasks.filter(
    (t) => new Date(t.dueDate) < new Date() && !t.completed
  ).length;

  const dueSoon = tasks.filter((t) => {
    const diff =
      (new Date(t.dueDate).getTime() -
        new Date().getTime()) /
      (1000 * 60 * 60 * 24);

    return diff <= 2 && diff >= 0 && !t.completed;
  }).length;

  const recentTasks = [...tasks]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  if (!authorized) return null;

  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <h2>User Panel</h2>
        <ul>
          <li onClick={() => setActiveTab("dashboard")}>Dashboard</li>
          <li onClick={() => setActiveTab("create")}>Create Task</li>
          <li onClick={() => setActiveTab("tasks")}>My Tasks</li>
          <li onClick={logout} style={{ color: "#f87171" }}>
            Logout
          </li>
        </ul>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <h2>User Dashboard</h2>
          <span>{currentUser?.name}</span>
        </div>

        {activeTab === "dashboard" && (
          <>
            <div className={styles.cards}>
              <div className={`${styles.card} ${styles.purple}`}>
                <h3>Total Tasks</h3>
                <h2>{total}</h2>
              </div>

              <div className={`${styles.card} ${styles.blue}`}>
                <h3>Completed</h3>
                <h2>{completed}</h2>
              </div>

              <div className={`${styles.card} ${styles.orange}`}>
                <h3>Due Soon</h3>
                <h2>{dueSoon}</h2>
              </div>

              <div className={`${styles.card} ${styles.green}`}>
                <h3>Overdue</h3>
                <h2>{overdue}</h2>
              </div>
            </div>

            <div className={styles.content}>
              <h3>Recent Tasks</h3>

              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className={`${styles.taskCard} ${
                    task.completed ? styles.done : ""
                  }`}
                >
                  <h4>{task.title}</h4>
                  <p>Priority: {task.priority}</p>
                  <p>
                    Status:{" "}
                    {task.completed ? "Done" : "Pending"}
                  </p>

                  <div className={styles.taskActions}>
                    <button onClick={() => setEditingTask(task)}>
                      Edit Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "create" && (
          <div className={`${styles.content} ${styles.form}`}>
            <h3>Create Task</h3>

            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <input
              type="date"
              min={new Date().toISOString().split("T")[0]} 
              value={form.dueDate}
              onChange={(e) =>
                setForm({ ...form, dueDate: e.target.value })
              }
            />

            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            />

            <input
              placeholder="Attachments"
              value={form.attachments}
              onChange={(e) =>
                setForm({
                  ...form,
                  attachments: e.target.value,
                })
              }
            />

            <select
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value })
              }
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>

            <button onClick={addTask}>Create Task</button>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className={styles.content}>
            <h3>My Tasks</h3>

            {/* INTERACTIVE FILTERS */}
            <div className={styles.filters}>
              <select
                value={activeFilters.status}
                onChange={(e) =>
                  setActiveFilters({
                    ...activeFilters,
                    status: e.target.value,
                  })
                }
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={activeFilters.priority}
                onChange={(e) =>
                  setActiveFilters({
                    ...activeFilters,
                    priority: e.target.value,
                  })
                }
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <select
                value={activeFilters.sort}
                onChange={(e) =>
                  setActiveFilters({
                    ...activeFilters,
                    sort: e.target.value,
                  })
                }
              >
                <option value="latest">Latest</option>
                <option value="dueDate">Due Date</option>
                <option value="title">Title</option>
              </select>
            </div>

            {tasks
              .filter((task) => {
                if (activeFilters.status === "completed")
                  return task.completed;
                if (activeFilters.status === "pending")
                  return !task.completed;
                return true;
              })
              .filter((task) => {
                if (activeFilters.priority === "all")
                  return true;
                return task.priority === activeFilters.priority;
              })
              .sort((a, b) => {
                if (activeFilters.sort === "dueDate") {
                  return (
                    new Date(a.dueDate).getTime() -
                    new Date(b.dueDate).getTime()
                  );
                }
                if (activeFilters.sort === "title") {
                  return a.title.localeCompare(b.title);
                }
                return b.id - a.id;
              })
              .map((task) => (
                <div
                  key={task.id}
                  className={`${styles.taskCard} ${
                    task.completed ? styles.done : ""
                  }`}
                >
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <p>Status: {task.completed ? "Done" : "Pending"}</p>

                  <div className={styles.taskActions}>
                    <button onClick={() => toggleTask(task)}>
                      {task.completed
                        ? "Mark Pending"
                        : "Mark Complete"}
                    </button>

                    <button
                      onClick={() => setEditingTask(task)}
                    >
                      Edit Task
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete Task
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {editingTask && (
          <div className={`${styles.content} ${styles.form}`}>
            <h3>Edit Task</h3>

            <input
              value={editingTask.title}
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  title: e.target.value,
                })
              }
            />

            <input
              value={editingTask.description}
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  description: e.target.value,
                })
              }
            />
             
            <input
              type="date"
              value={editingTask.dueDate}
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  dueDate: e.target.value,
                })
              }
            />

            <button onClick={saveEdit}>Save</button>
            <button onClick={() => setEditingTask(null)}>
              Cancel
            </button>
          </div>
        )}
      </main>
    </div>
  );
}