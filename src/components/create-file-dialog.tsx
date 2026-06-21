"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFilePath } from "@/lib/vault";
import type { FileNode } from "@/types/file-tree";

interface CreateFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentFolderId: string | null;
  fileTree: FileNode[];
  defaultName?: string;
  onCreate: (name: string, parentFolderId: string | null) => void;
}

export function CreateFileDialog({
  open,
  onOpenChange,
  parentFolderId,
  fileTree,
  defaultName = "Untitled",
  onCreate,
}: CreateFileDialogProps) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (open) {
      setName(defaultName);
    }
  }, [open, defaultName]);

  const locationLabel =
    parentFolderId === null
      ? "Vault root"
      : (getFilePath(fileTree, parentFolderId) ?? "Selected folder");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreate(name, parentFolderId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create new note</DialogTitle>
            <DialogDescription>
              A markdown file will be added to{" "}
              <span className="font-medium text-foreground">{locationLabel}</span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-4">
            <Label htmlFor="file-name">File name</Label>
            <Input
              id="file-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Untitled.md"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
