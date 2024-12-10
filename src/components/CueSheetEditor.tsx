"use client"

import * as React from "react"
import { ChevronDown, Clock, Edit2, Plus, Search, Settings } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function CueSheetEditor() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">CueFlow: Event Name</h1>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Live Mode
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Cue List</h2>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Cue
            </Button>
          </div>
          <div className="mb-4 flex items-center space-x-2">
            <Input className="flex-grow" placeholder="Search cues..." />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Filter by Role</DropdownMenuItem>
                <DropdownMenuItem>Filter by Department</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Cue ID</TableHead>
                  <TableHead className="w-[100px]">Time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[150px]">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: "Q1", time: "00:00:00", description: "Show Start", role: "All" },
                  { id: "Q2", time: "00:01:30", description: "Intro Video", role: "AV Tech" },
                  { id: "Q3", time: "00:03:00", description: "Welcome Speech", role: "Host" },
                  { id: "Q4", time: "00:10:00", description: "Lighting Change", role: "Lighting Tech" },
                ].map((cue, index) => (
                  <TableRow key={index}>
                    <TableCell>{cue.id}</TableCell>
                    <TableCell>{cue.time}</TableCell>
                    <TableCell>{cue.description}</TableCell>
                    <TableCell>{cue.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex-1 p-4">
          <h2 className="mb-4 text-xl font-semibold">Cue Details</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Cue ID</label>
              <Input defaultValue="Q3" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Time</label>
              <Input defaultValue="00:03:00" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <Input defaultValue="Welcome Speech" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Role</label>
              <Input defaultValue="Host" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Notes</label>
              <textarea
                className="w-full rounded-md border p-2"
                rows={4}
                defaultValue="Remind the host to welcome VIP guests in the front row."
              />
            </div>
            <Button>
              <Edit2 className="mr-2 h-4 w-4" />
              Update Cue
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
