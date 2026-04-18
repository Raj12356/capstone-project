import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface User {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user" | "manager";
}

const usersFile = path.join(process.cwd(), "users.json");

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const data = fs.readFileSync(usersFile, "utf-8");
    const users: User[] = JSON.parse(data || "[]");

    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!foundUser) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = foundUser;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}