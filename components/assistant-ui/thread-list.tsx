"use client";
import type { FC } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import {
  ArchiveIcon,
  MessageSquare,
  ChevronRight,
  MapPin,
  List,
} from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import SidebarLanguageToggle from "@/components/language-toggle";
import Link from "next/link";
export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root>
      <SidebarGroup>
        <SidebarLanguageToggle></SidebarLanguageToggle>
        <SidebarGroupLabel>Conversations</SidebarGroupLabel>
        <SidebarMenu>
          <ThreadListNew />
          <Collapsible asChild defaultOpen={true} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Recent Threads">
                  <MessageSquare className="w-4 h-4" />
                  <span>Recent Threads</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <ThreadListItems />
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    </ThreadListPrimitive.Root>
  );
};
const ThreadListNew: FC = () => {
  return (
    <>
      <ThreadListPrimitive.New asChild>
        <Link href="/location">
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Location" className="cursor-pointer">
              <MapPin className="w-4 h-4" />
              <span>Location</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </Link>
      </ThreadListPrimitive.New>
      <ThreadListPrimitive.New asChild>
        <Link href="/remember-list">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Remember List"
              className="cursor-pointer"
            >
              <List className="w-4 h-4" />
              <span>Remember List</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </Link>
      </ThreadListPrimitive.New>
    </>
  );
};
const ThreadListItems: FC = () => {
  return <ThreadListPrimitive.Items components={{ ThreadListItem }} />;
};
const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root>
      <SidebarMenuSubItem className="group flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:bg-muted/30 data-[active]:bg-muted/50">
        <ThreadListItemPrimitive.Trigger asChild>
          <SidebarMenuSubButton className="flex-grow px-3 py-2 text-start text-foreground">
            <ThreadListItemTitle />
          </SidebarMenuSubButton>
        </ThreadListItemPrimitive.Trigger>
        <ThreadListItemArchive />
      </SidebarMenuSubItem>
    </ThreadListItemPrimitive.Root>
  );
};
const ThreadListItemTitle: FC = () => {
  return (
    <span className="text-sm text-foreground">
      <ThreadListItemPrimitive.Title fallback="New Chat" />
    </span>
  );
};
const ThreadListItemArchive: FC = () => {
  return (
    <ThreadListItemPrimitive.Archive asChild>
      <TooltipIconButton
        className="p-0 mr-3 ml-auto opacity-0 transition-opacity size-4 text-muted-foreground group-hover:opacity-100 hover:text-primary"
        variant="ghost"
        tooltip="Archive thread"
      >
        <ArchiveIcon className="w-3 h-3" />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Archive>
  );
};
