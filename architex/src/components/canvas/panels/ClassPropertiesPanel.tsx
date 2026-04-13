"use client";

import { memo, useState, useCallback } from "react";
import {
  Trash2,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import type { UMLAttribute, UMLMethod } from "@/lib/lld";
import type { ClassNodeData } from "@/components/canvas/nodes/lld/ClassNode";

// -- Visibility options -------------------------------------------

type Visibility = "+" | "-" | "#" | "~";

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "+", label: "+ public" },
  { value: "-", label: "- private" },
  { value: "#", label: "# protected" },
  { value: "~", label: "~ package" },
];

const STEREOTYPE_OPTIONS: { value: ClassNodeData["stereotype"]; label: string }[] = [
  { value: "class", label: "Class" },
  { value: "interface", label: "Interface" },
  { value: "abstract", label: "Abstract" },
  { value: "enum", label: "Enum" },
];

// -- UID helper ---------------------------------------------------

let _panelCounter = 0;
function panelUid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${(++_panelCounter).toString(36)}`;
}

// -- Drag reorder helpers -----------------------------------------

function reorder<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

// -- Attribute Row ------------------------------------------------

interface AttributeRowProps {
  attribute: UMLAttribute;
  index: number;
  onUpdate: (index: number, updates: Partial<UMLAttribute>) => void;
  onRemove: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragTarget: boolean;
}

const AttributeRow = memo(function AttributeRow({
  attribute,
  index,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragTarget,
}: AttributeRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded px-1 py-1",
        "hover:bg-accent/50 transition-colors",
        isDragTarget && "border-t-2 border-primary",
      )}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
    >
      <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100" />
      <Select
        value={attribute.visibility}
        onValueChange={(v) => onUpdate(index, { visibility: v as Visibility })}
      >
        <SelectTrigger className="h-7 w-16 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VISIBILITY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        inputSize="sm"
        value={attribute.name}
        onChange={(e) => onUpdate(index, { name: e.target.value })}
        placeholder="name"
        className="h-7 flex-1 min-w-0"
      />
      <Input
        inputSize="sm"
        value={attribute.type}
        onChange={(e) => onUpdate(index, { type: e.target.value })}
        placeholder="type"
        className="h-7 w-20"
      />
      <button
        type="button"
        aria-label="Remove attribute"
        onClick={() => onRemove(index)}
        className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
});

// -- Method Row ---------------------------------------------------

interface MethodRowProps {
  method: UMLMethod;
  index: number;
  onUpdate: (index: number, updates: Partial<UMLMethod>) => void;
  onRemove: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragTarget: boolean;
}

const MethodRow = memo(function MethodRow({
  method,
  index,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragTarget,
}: MethodRowProps) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-1 rounded px-1 py-1",
        "hover:bg-accent/50 transition-colors",
        isDragTarget && "border-t-2 border-primary",
      )}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100" />
        <Select
          value={method.visibility}
          onValueChange={(v) => onUpdate(index, { visibility: v as Visibility })}
        >
          <SelectTrigger className="h-7 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          inputSize="sm"
          value={method.name}
          onChange={(e) => onUpdate(index, { name: e.target.value })}
          placeholder="name"
          className="h-7 flex-1 min-w-0"
        />
        <button
          type="button"
          aria-label="Remove method"
          onClick={() => onRemove(index)}
          className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="ml-6 flex items-center gap-1">
        <Input
          inputSize="sm"
          value={method.params.join(", ")}
          onChange={(e) =>
            onUpdate(index, {
              params: e.target.value
                ? e.target.value.split(",").map((p) => p.trim())
                : [],
            })
          }
          placeholder="params (comma-separated)"
          className="h-7 flex-1 min-w-0"
        />
        <span className="shrink-0 text-xs text-muted-foreground">:</span>
        <Input
          inputSize="sm"
          value={method.returnType}
          onChange={(e) => onUpdate(index, { returnType: e.target.value })}
          placeholder="return"
          className="h-7 w-20"
        />
      </div>
    </div>
  );
});

// -- ClassPropertiesPanel (main) ----------------------------------

export const ClassPropertiesPanel = memo(function ClassPropertiesPanel() {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const removeNodes = useCanvasStore((s) => s.removeNodes);

  // Sections collapsed state
  const [attrsOpen, setAttrsOpen] = useState(true);
  const [methodsOpen, setMethodsOpen] = useState(true);

  // Drag state
  const [dragAttrIndex, setDragAttrIndex] = useState<number | null>(null);
  const [dragAttrTarget, setDragAttrTarget] = useState<number | null>(null);
  const [dragMethodIndex, setDragMethodIndex] = useState<number | null>(null);
  const [dragMethodTarget, setDragMethodTarget] = useState<number | null>(null);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Find selected class node
  const selectedNode =
    selectedNodeIds.length === 1
      ? nodes.find(
          (n) =>
            n.id === selectedNodeIds[0] && n.type === "uml-class",
        )
      : null;

  // -- Helper: update data on the selected node -------------------

  const patchData = useCallback(
    (patch: Partial<ClassNodeData>) => {
      if (!selectedNode) return;
      updateNodeData(selectedNode.id, patch);
    },
    [selectedNode, updateNodeData],
  );

  // -- Attribute handlers -----------------------------------------

  const handleAddAttribute = useCallback(() => {
    if (!selectedNode) return;
    const data = selectedNode.data as ClassNodeData;
    const newAttr: UMLAttribute = {
      id: panelUid("attr"),
      name: "",
      type: "string",
      visibility: "-",
    };
    patchData({ attributes: [...data.attributes, newAttr] });
  }, [selectedNode, patchData]);

  const handleUpdateAttribute = useCallback(
    (index: number, updates: Partial<UMLAttribute>) => {
      if (!selectedNode) return;
      const data = selectedNode.data as ClassNodeData;
      const attrs = data.attributes.map((a, i) =>
        i === index ? { ...a, ...updates } : a,
      );
      patchData({ attributes: attrs });
    },
    [selectedNode, patchData],
  );

  const handleRemoveAttribute = useCallback(
    (index: number) => {
      if (!selectedNode) return;
      const data = selectedNode.data as ClassNodeData;
      patchData({ attributes: data.attributes.filter((_, i) => i !== index) });
    },
    [selectedNode, patchData],
  );

  const handleAttrDragEnd = useCallback(() => {
    if (
      selectedNode &&
      dragAttrIndex !== null &&
      dragAttrTarget !== null &&
      dragAttrIndex !== dragAttrTarget
    ) {
      const data = selectedNode.data as ClassNodeData;
      patchData({ attributes: reorder(data.attributes, dragAttrIndex, dragAttrTarget) });
    }
    setDragAttrIndex(null);
    setDragAttrTarget(null);
  }, [selectedNode, patchData, dragAttrIndex, dragAttrTarget]);

  // -- Method handlers --------------------------------------------

  const handleAddMethod = useCallback(() => {
    if (!selectedNode) return;
    const data = selectedNode.data as ClassNodeData;
    const newMethod: UMLMethod = {
      id: panelUid("mth"),
      name: "",
      returnType: "void",
      params: [],
      visibility: "+",
    };
    patchData({ methods: [...data.methods, newMethod] });
  }, [selectedNode, patchData]);

  const handleUpdateMethod = useCallback(
    (index: number, updates: Partial<UMLMethod>) => {
      if (!selectedNode) return;
      const data = selectedNode.data as ClassNodeData;
      const methods = data.methods.map((m, i) =>
        i === index ? { ...m, ...updates } : m,
      );
      patchData({ methods });
    },
    [selectedNode, patchData],
  );

  const handleRemoveMethod = useCallback(
    (index: number) => {
      if (!selectedNode) return;
      const data = selectedNode.data as ClassNodeData;
      patchData({ methods: data.methods.filter((_, i) => i !== index) });
    },
    [selectedNode, patchData],
  );

  const handleMethodDragEnd = useCallback(() => {
    if (
      selectedNode &&
      dragMethodIndex !== null &&
      dragMethodTarget !== null &&
      dragMethodIndex !== dragMethodTarget
    ) {
      const data = selectedNode.data as ClassNodeData;
      patchData({ methods: reorder(data.methods, dragMethodIndex, dragMethodTarget) });
    }
    setDragMethodIndex(null);
    setDragMethodTarget(null);
  }, [selectedNode, patchData, dragMethodIndex, dragMethodTarget]);

  // -- Delete handler ---------------------------------------------

  const handleDeleteClass = useCallback(() => {
    if (!selectedNode) return;
    removeNodes([selectedNode.id]);
    setDeleteOpen(false);
  }, [selectedNode, removeNodes]);

  // -- Empty state ------------------------------------------------

  if (!selectedNode) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <Settings2 className="h-10 w-10 text-foreground-subtle" />
        <div>
          <p className="text-sm font-medium text-foreground-muted">
            No class selected
          </p>
          <p className="mt-1 text-xs text-foreground-subtle">
            Click a UML class node on the canvas to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const data = selectedNode.data as ClassNodeData;

  return (
    <div className="flex h-full flex-col">
      {/* ---- Header ---- */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Class Properties
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 px-3 py-3">
          {/* ---- Name ---- */}
          <div className="space-y-1.5">
            <Label htmlFor="class-name" className="text-xs text-foreground-muted">
              Class Name
            </Label>
            <Input
              id="class-name"
              inputSize="sm"
              value={data.className}
              onChange={(e) => patchData({ className: e.target.value })}
            />
          </div>

          {/* ---- Stereotype ---- */}
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground-muted">Stereotype</Label>
            <Select
              value={data.stereotype}
              onValueChange={(v) =>
                patchData({ stereotype: v as ClassNodeData["stereotype"] })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STEREOTYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* ---- Attributes ---- */}
          <div>
            <button
              type="button"
              className="flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted"
              onClick={() => setAttrsOpen((o) => !o)}
            >
              {attrsOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Attributes ({data.attributes.length})
            </button>

            {attrsOpen && (
              <div className="mt-2 space-y-0.5">
                {data.attributes.map((attr, i) => (
                  <AttributeRow
                    key={attr.id ?? `attr-${i}`}
                    attribute={attr}
                    index={i}
                    onUpdate={handleUpdateAttribute}
                    onRemove={handleRemoveAttribute}
                    onDragStart={setDragAttrIndex}
                    onDragOver={setDragAttrTarget}
                    onDragEnd={handleAttrDragEnd}
                    isDragTarget={dragAttrTarget === i && dragAttrIndex !== i}
                  />
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full justify-start gap-1 text-xs"
                  onClick={handleAddAttribute}
                >
                  <Plus className="h-3 w-3" />
                  Add Attribute
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* ---- Methods ---- */}
          <div>
            <button
              type="button"
              className="flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted"
              onClick={() => setMethodsOpen((o) => !o)}
            >
              {methodsOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Methods ({data.methods.length})
            </button>

            {methodsOpen && (
              <div className="mt-2 space-y-0.5">
                {data.methods.map((method, i) => (
                  <MethodRow
                    key={method.id ?? `mth-${i}`}
                    method={method}
                    index={i}
                    onUpdate={handleUpdateMethod}
                    onRemove={handleRemoveMethod}
                    onDragStart={setDragMethodIndex}
                    onDragOver={setDragMethodTarget}
                    onDragEnd={handleMethodDragEnd}
                    isDragTarget={dragMethodTarget === i && dragMethodIndex !== i}
                  />
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full justify-start gap-1 text-xs"
                  onClick={handleAddMethod}
                >
                  <Plus className="h-3 w-3" />
                  Add Method
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* ---- Delete ---- */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Class
          </Button>
        </div>
      </ScrollArea>

      {/* ---- Delete Confirmation ---- */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Class"
        description={`Are you sure you want to delete "${data.className}"? This will also remove all relationships connected to it.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteClass}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
});
