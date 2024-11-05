"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { type UserRole } from "@prisma/client";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

interface MainNavProps {
  userRole: UserRole;
}

export function MainNav({ userRole }: MainNavProps) {
  const pathname = usePathname();

  const items = [
    {
      title: "Ana Sayfa",
      href: "/dashboard",
      roles: [
        "SUPERADMIN",
        "LECTURER",
        "RESIDENT",
        "TECHNICIAN",
        "NURSE",
        "STAFF",
      ],
    },
    {
      title: "Hastalar",
      href: "/dashboard/patients",
      roles: ["SUPERADMIN", "LECTURER", "RESIDENT", "TECHNICIAN", "NURSE"],
    },
    {
      title: "Mesajlar",
      href: "/dashboard/messages",
      roles: [
        "SUPERADMIN",
        "LECTURER",
        "RESIDENT",
        "TECHNICIAN",
        "NURSE",
        "STAFF",
      ],
    },
    {
      title: "Kullanıcılar",
      href: "/dashboard/users",
      roles: ["SUPERADMIN"],
    },
  ];

  const filteredItems = items.filter((item) => item.roles.includes(userRole));

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {filteredItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-muted-foreground"
          )}
        >
          {item.title}
        </Link>
      ))}
      <NotificationDropdown />
    </nav>
  );
}
