"use client";

import { useState, useCallback } from "react";
import { api } from "@/trpc/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

export function useMentions() {
  const [mentions, setMentions] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [search, setSearch] = useState("");

  const { data: users } = api.user.search.useQuery(
    { query: search },
    { enabled: showMentions },
  );

  const MentionList = useCallback(() => {
    if (!showMentions) return null;

    return (
      <div className="absolute bottom-full left-0 mb-1 w-64">
        <Command>
          <CommandInput
            placeholder="Kullanıcı ara..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Kullanıcı bulunamadı</CommandEmpty>
            <CommandGroup>
              {users?.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    setMentions((prev) => {
                      if (prev.some((m) => m.id === user.id)) return prev;
                      return [...prev, user];
                    });
                    setShowMentions(false);
                    setSearch("");
                  }}
                >
                  <Avatar className="mr-2 h-6 w-6">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback>
                      {user.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {user.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    );
  }, [showMentions, users, search]);

  return {
    mentions,
    setMentions,
    showMentions,
    setShowMentions,
    MentionList,
  };
}
