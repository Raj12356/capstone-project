import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "tasks.json");

type Comment = {
  id: number;
  userId: number;
  message: string;
  createdAt: string;
};

type Task = {
  id: number;
  userId?: number;
  assignedTo?: number;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  category?: string;
  status?: string; 
  comments?: Comment[];
};

type DB = {
  tasks: Task[];
};

//  READ 
const readData = (): DB => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ tasks: [] }, null, 2));
  }

  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

//  WRITE 
const writeData = (data: DB) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

//  GET 
export async function GET(req: NextRequest) {
  try {
    const data = readData();
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const assignedTo = searchParams.get("assignedTo");

    let tasks = data.tasks;

    if (userId) {
      tasks = tasks.filter((t) => t.userId === Number(userId));
    }

    if (assignedTo) {
      tasks = tasks.filter(
        (t) => t.assignedTo === Number(assignedTo)
      );
    }

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: "GET failed" }, { status: 500 });
  }
}

// POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = readData();

    const newTask: Task = {
      id: Date.now(),
      completed: false,
      status: "pending",
      comments: [],
      ...body,
    };

    data.tasks.push(newTask);
    writeData(data);

    return NextResponse.json(newTask);
  } catch {
    return NextResponse.json({ error: "POST failed" }, { status: 500 });
  }
}

//  PATCH 
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const data = readData();

    const index = data.tasks.findIndex((t) => t.id === body.id);

    if (index === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updatedTask = {
      ...data.tasks[index],
      ...body,
    };

    // KEEP status & completed IN SYNC
    if (body.completed !== undefined) {
      updatedTask.status = body.completed ? "completed" : "pending";
    }

    if (body.status !== undefined) {
      updatedTask.completed = body.status === "completed";
    }

    data.tasks[index] = updatedTask;

    writeData(data);

    return NextResponse.json(updatedTask);
  } catch {
    return NextResponse.json({ error: "PATCH failed" }, { status: 500 });
  }
}

//  PUT 
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const data = readData();

    const index = data.tasks.findIndex((t) => t.id === body.id);

    if (index === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    data.tasks[index] = {
      ...data.tasks[index],
      ...body,
    };

    writeData(data);

    return NextResponse.json(data.tasks[index]);
  } catch {
    return NextResponse.json({ error: "UPDATE failed" }, { status: 500 });
  }
}

//  DELETE 
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    const data = readData();

    data.tasks = data.tasks.filter((t) => t.id !== id);

    writeData(data);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "DELETE failed" }, { status: 500 });
  }
}