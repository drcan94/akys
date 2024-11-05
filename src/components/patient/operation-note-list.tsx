// Update role checks in the component
const canCreateNote = ["LECTURER", "RESIDENT"].includes(session?.user.role || "");

const canEditNote = (createdById: string) => {
  return (
    createdById === session?.user.id ||
    ["LECTURER", "SUPERADMIN"].includes(session?.user.role || "")
  );
};

// Rest of the component remains the same