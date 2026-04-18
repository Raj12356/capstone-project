import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "tasks.json");

type Task = {
  id: number;
  completed?: boolean;
  [key: string]: any;
};

type DB = {
  tasks: Task[];
};

const readData = (): DB => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ tasks: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const writeData = (data: DB) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ✅ FIX IS HERE
export async function PUT(
  req: NextRequest,
  context: any
) {
  try {
    const { params } = await context; // 🔥 IMPORTANT FIX (Next 15)

    const taskId = Number(params.id);
    const body = await req.json();

    const data = readData();

    const index = data.tasks.findIndex((t) => t.id === taskId);

    if (index === -1) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const updatedTask = {
      ...data.tasks[index],
      ...body,
      completed:
        body.completed !== undefined
          ? body.completed
          : data.tasks[index].completed,
    };

    data.tasks[index] = updatedTask;

    writeData(data);

    return NextResponse.json(updatedTask);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}