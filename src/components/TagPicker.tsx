import { useState } from "react";
import { useTags, useCreateTag } from "@/lib/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, Tag } from "lucide-react";

interface TagPickerProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

const TAG_COLORS = [
  "hsl(142, 26%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 72%, 51%)",
  "hsl(173, 58%, 39%)",
];

export default function TagPicker({ selectedTagIds, onChange }: TagPickerProps) {
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));
  const availableTags = tags.filter((t) => !selectedTagIds.includes(t.id));

  const handleSelect = (tagId: string) => {
    onChange([...selectedTagIds, tagId]);
  };

  const handleRemove = (tagId: string) => {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const handleCreateAndSelect = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    const color = TAG_COLORS[tags.length % TAG_COLORS.length];
    const newTag = await createTag.mutateAsync({ name: trimmed, color });
    onChange([...selectedTagIds, newTag.id]);
    setNewTagName("");
  };

  return (
    <div className="space-y-2">
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="gap-1 pr-1"
              style={tag.color ? { backgroundColor: tag.color, color: "#fff" } : undefined}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-background/20"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
            <Tag className="w-3.5 h-3.5" />
            Add tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-2">
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleSelect(tag.id)}
                    className="text-xs px-2 py-1 rounded-full border border-border hover:bg-accent transition-colors"
                    style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                placeholder="New tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateAndSelect();
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                disabled={!newTagName.trim() || createTag.isPending}
                onClick={handleCreateAndSelect}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
