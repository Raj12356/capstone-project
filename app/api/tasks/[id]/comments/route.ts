import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "tasks.json");

// READ
const readData = () => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ tasks: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

// WRITE
const writeData = (data: any) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

//  GET COMMENTS
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const data = readData();

  const task = data.tasks.find(
    (t: any) => String(t.id) === String(id)
  );

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task.comments || []);
}

//  ADD COMMENT
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json();
  const data = readData();

  const taskIndex = data.tasks.findIndex(
    (t: any) => String(t.id) === String(id)
  );

  if (taskIndex === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const newComment = {
    id: Date.now(),
    userId: body.userId,
    message: body.message,
    createdAt: new Date().toISOString(),
  };

  if (!data.tasks[taskIndex].comments) {
    data.tasks[taskIndex].comments = [];
  }

  data.tasks[taskIndex].comments.push(newComment);

  writeData(data);

  return NextResponse.json({ comment: newComment });
}