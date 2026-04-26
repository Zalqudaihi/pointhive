import type { ImageSourcePropType } from "react-native";

export type DemoIdentity = {
  id: number;
  name: string;
  role: "user" | "admin";
  avatar: ImageSourcePropType;
  tagline: string;
};

export const DEMO_IDENTITIES: DemoIdentity[] = [
  {
    id: 1,
    name: "Zoe Tanaka",
    role: "admin",
    avatar: require("@/assets/seed/avatar1.png"),
    tagline: "Hive admin",
  },
  {
    id: 2,
    name: "Marcus Reyes",
    role: "user",
    avatar: require("@/assets/seed/avatar2.png"),
    tagline: "Vintage seller",
  },
  {
    id: 3,
    name: "Priya Bennett",
    role: "user",
    avatar: require("@/assets/seed/avatar3.png"),
    tagline: "Plant parent",
  },
  {
    id: 4,
    name: "Sam Okafor",
    role: "user",
    avatar: require("@/assets/seed/avatar4.png"),
    tagline: "Coupon collector",
  },
];

const AVATAR_BY_ID: Record<number, ImageSourcePropType> = Object.fromEntries(
  DEMO_IDENTITIES.map((u) => [u.id, u.avatar]),
);

export function avatarForUserId(id: number | null | undefined): ImageSourcePropType | null {
  if (id == null) return null;
  return AVATAR_BY_ID[id] ?? null;
}
