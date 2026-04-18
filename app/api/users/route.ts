import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "admin" | "user" | "manager";
}

const usersFile = path.join(process.cwd(), "users.json");

//  READ + CLEAN
const readUsers = (): User[] => {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]");
  }

  const data = fs.readFileSync(usersFile, "utf-8");
  const users: User[] = JSON.parse(data || "[]");

  return users.map((u) => ({
    ...u,
    id: Number(u.id),
  }));
};

// NEXT ID (SAFE) 
const getNextId = (users: User[]) => {
  const validIds = users
    .map((u) => Number(u.id))
    .filter((id) => !isNaN(id));

  return validIds.length > 0 ? Math.max(...validIds) + 1 : 1;
};

//GET 
export async function GET() {
  try {
    const users = readUsers();

    const safeUsers = users.map(({ password, ...rest }) => rest);

    return NextResponse.json(safeUsers);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    const users = readUsers();

    // check duplicate email
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const newUser: User = {
      id: getNextId(users),
      name,
      email,
      password,
      role: role || "user",
    };

    users.push(newUser);

    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    const { password: _, ...safeUser } = newUser;

    return NextResponse.json({ user: safeUser });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}