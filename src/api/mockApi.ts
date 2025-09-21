export type AvatarType = "human" | "cat" | "robot" | "wizard" | "dragon" | "bug";

export interface AvatarOption {
  id: AvatarType;
  label: string;
  unlockLevel: number;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "human", label: "ヒト", unlockLevel: 1 },
  { id: "cat", label: "ネコ", unlockLevel: 2 },
  { id: "robot", label: "ロボ", unlockLevel: 3 },
  { id: "wizard", label: "まほうつかい", unlockLevel: 5 },
  { id: "dragon", label: "ドラゴン", unlockLevel: 10 },
  { id: "bug", label: "バグ", unlockLevel: 10 }
];

export interface UserRecord {
  userId: string;
  name: string;
  avatarType: AvatarType;
  message: string;
  xp: number;
  level: number;
  lastLogin?: string;
  encounters: Record<string, string>;
}

export interface PublicUser {
  userId: string;
  name: string;
  avatarType: AvatarType;
  message: string;
  level: number;
  xp: number;
}

export interface LoginPayload {
  userId: string;
  name: string;
  avatarType: AvatarType;
  message: string;
}

export interface LoginResponse {
  user: PublicUser;
  users: PublicUser[];
  xp: number;
  level: number;
  xpGained: number;
  leveledUp: boolean;
}

export interface EncounterResponse {
  xp: number;
  level: number;
  xpGained: number;
  leveledUp: boolean;
  user: PublicUser;
}

const users = new Map<string, UserRecord>();
const loginSubscribers = new Set<(user: PublicUser) => void>();

const XP_PER_LOGIN = 10;
const XP_PER_ENCOUNTER = 5;

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getPublicUser(record: UserRecord): PublicUser {
  const { userId, name, avatarType, message, level, xp } = record;
  return { userId, name, avatarType, message, level, xp };
}

function xpForNextLevel(level: number): number {
  return 50 * level * level;
}

function calculateLevel(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  nextThreshold: number;
} {
  let level = 1;
  let remaining = totalXp;
  let requirement = xpForNextLevel(level);

  while (remaining >= requirement) {
    remaining -= requirement;
    level += 1;
    requirement = xpForNextLevel(level);
  }

  return { level, xpIntoLevel: remaining, nextThreshold: requirement };
}

export function getProgress(xp: number): {
  level: number;
  currentIntoLevel: number;
  neededForNext: number;
} {
  const { level, xpIntoLevel, nextThreshold } = calculateLevel(xp);
  return { level, currentIntoLevel: xpIntoLevel, neededForNext: nextThreshold };
}

function updateLevel(record: UserRecord): { leveledUp: boolean } {
  const before = record.level;
  const { level } = calculateLevel(record.xp);
  record.level = level;
  return { leveledUp: level > before };
}

export function getUnlockedAvatars(level: number): AvatarType[] {
  return AVATAR_OPTIONS.filter((option) => option.unlockLevel <= level).map(
    (option) => option.id
  );
}

function seedDemoUsers(todayKey: string) {
  if (users.size > 0) return;
  const demo: Array<Omit<UserRecord, "encounters"> & { encounters?: Record<string, string> }> = [
    {
      userId: "demo-1",
      name: "アキラ",
      avatarType: "human",
      message: "今日もがんばろう！",
      xp: 30,
      level: 1,
      lastLogin: todayKey
    },
    {
      userId: "demo-2",
      name: "ミケ",
      avatarType: "cat",
      message: "にゃーん",
      xp: 120,
      level: 2,
      lastLogin: todayKey
    },
    {
      userId: "demo-3",
      name: "ロボス",
      avatarType: "robot",
      message: "0110 おはよう",
      xp: 260,
      level: 3,
      lastLogin: todayKey
    }
  ];
  demo.forEach((record) => {
    users.set(record.userId, {
      ...record,
      encounters: {},
      xp: record.xp,
      level: calculateLevel(record.xp).level
    });
  });
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const today = getTodayKey();
  seedDemoUsers(today);
  let record = users.get(payload.userId);
  let xpGained = 0;
  if (!record) {
    record = {
      userId: payload.userId,
      name: payload.name,
      avatarType: payload.avatarType,
      message: payload.message,
      xp: 0,
      level: 1,
      encounters: {}
    };
    users.set(payload.userId, record);
  }

  record.name = payload.name;
  record.avatarType = payload.avatarType;
  record.message = payload.message;

  if (record.lastLogin !== today) {
    record.lastLogin = today;
    record.encounters = {};
    record.xp += XP_PER_LOGIN;
    xpGained += XP_PER_LOGIN;
  }

  const { leveledUp } = updateLevel(record);

  const response: LoginResponse = {
    user: getPublicUser(record),
    users: Array.from(users.values())
      .filter((item) => item.lastLogin === today)
      .map(getPublicUser),
    xp: record.xp,
    level: record.level,
    xpGained,
    leveledUp
  };

  queueMicrotask(() => {
    loginSubscribers.forEach((subscriber) => subscriber(getPublicUser(record!)));
  });

  return new Promise((resolve) => {
    setTimeout(() => resolve(response), 400);
  });
}

export async function fetchTodayUsers(): Promise<PublicUser[]> {
  const today = getTodayKey();
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        Array.from(users.values())
          .filter((item) => item.lastLogin === today)
          .map(getPublicUser)
      );
    }, 200);
  });
}

export async function encounter(
  userId: string,
  otherUserId: string
): Promise<EncounterResponse> {
  const record = users.get(userId);
  if (!record) throw new Error("User not found");
  const today = getTodayKey();
  let xpGained = 0;
  if (record.encounters[otherUserId] !== today && userId !== otherUserId) {
    record.encounters[otherUserId] = today;
    record.xp += XP_PER_ENCOUNTER;
    xpGained += XP_PER_ENCOUNTER;
  }
  const { leveledUp } = updateLevel(record);
  const response: EncounterResponse = {
    xp: record.xp,
    level: record.level,
    xpGained,
    leveledUp,
    user: getPublicUser(record)
  };
  return new Promise((resolve) => {
    setTimeout(() => resolve(response), 200);
  });
}

export function subscribeToLogins(callback: (user: PublicUser) => void) {
  loginSubscribers.add(callback);
  return () => loginSubscribers.delete(callback);
}
