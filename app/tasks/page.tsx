"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData, type Task } from "@/lib/data-context";
import { formatDate } from "@/lib/utils";
import {
  SlideOver, Field, inputClass, selectClass,
  btnPrimary, btnSecondary, btnDanger,
} from "@/components/ui/slide-over";

const COLUMNS: Task["status"][] = ["Todo", "In Progress", "Review", "Done", "Blocked"];

const emptyForm = (): Partial<Task> => ({
  projectId: "", deliverableId: "", title: "", assignee: "",
  priority: "Medium", dueDate: "", status: "Todo", notes: "",
});

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, projects, deliverables, getProjectName } = useData();
  const [view, setView] = useState<"board" | "list">("board");
  const [projectFilter, setProjectFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Task>>(emptyForm());

  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))];

  const filtered = tasks.filter((t) => {
    const matchProject = projectFilter === "All" || t.projectId === projectFilter;
    const matchAssignee = assigneeFilter === "All" || t.assignee === assigneeFilter;
    return matchProject && matchAssignee;
  });

  const openNew = (status?: Task["status"]) => {
    setForm({ ...emptyForm(), status: status ?? "Todo" });
    setEditId(null); setShowForm(true);
  };
  const openEdit = (t: Task) => {
    setForm({ projectId: t.projectId, deliverableId: t.deliverableId, title: t.title, assignee: t.assignee, priority: t.priority, dueDate: t.dueDate, status: t.status, notes: t.notes });
    setEditId(t.id); setShowForm(true);
  };
  const handleSave = () => {
    if (!form.title) return;
    if (editId) updateTask(editId, form);
    else addTask(form);
    setShowForm(false);
  };
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const priorityColors: Record<string, string> = {
    Urgent: "bg-rose-500/15 text-rose-400",
    High: "bg-amber-400/15 text-amber-400",
    Medium: "bg-sky-400/15 text-sky-400",
    Low: "bg-stone-700 text-stone-400",
  };

  const columnColors: Record<string, string> = {
    Todo: "border-stone-600",
    "In Progress": "border-amber-500/40",
    Review: "border-sky-500/40",
    Done: "border-emerald-500/40",
    Blocked: "border-rose-500/40",
  };

  return (
    <AppShell>
      <div className="mb-4 flex flex-col gap-4 border-b border-stone-800 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Execution</p>
          <h2 className="mt-2 text-3xl font-semibold">Tasks</h2>
          <p className="mt-2 text-sm text-stone-400">
            {tasks.filter((t) => t.status !== "Done").length} open · {tasks.filter((t) => t.status === "Done").length} completed
          </p>
        </div>
        
        <div className="flex flex-col items-start gap-4 xl:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className={`${selectClass} min-w-[140px] text-xs py-1.5`}>
              <option value="All">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className={`${selectClass} min-w-[140px] text-xs py-1.5`}>
              <option value="All">All Assignees</option>
              {assignees.map((a) => <option key={a}>{a}</option>)}
            </select>
            <div className="flex rounded-lg border border-stone-700 bg-stone-800 p-1 text-xs">
              <button onClick={() => setView("board")} className={`rounded-md px-3 py-1 transition ${view === "board" ? "bg-stone-700 text-white shadow-sm" : "text-stone-400"}`}>Board</button>
              <button onClick={() => setView("list")} className={`rounded-md px-3 py-1 transition ${view === "list" ? "bg-stone-700 text-white shadow-sm" : "text-stone-400"}`}>List</button>
            </div>
            <button onClick={() => openNew()} className={`${btnPrimary} py-2 text-xs md:text-sm md:py-1.5`}>+ New Task</button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {view === "board" && (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          {/* Board Container */}
          <div className="flex gap-4 md:gap-5 w-max items-start">
            {COLUMNS.map((col) => {
              const colTasks = filtered.filter((t) => t.status === col);
              return (
                <div 
                  key={col} 
                  className={`flex flex-col shrink-0 w-[85vw] sm:w-[280px] md:w-[300px] h-[calc(100vh-210px)] max-h-[800px] rounded-3xl border-t-2 ${columnColors[col]} bg-stone-900/60 p-4 shadow-sm transition-all`}
                >
                  <div className="mb-4 flex items-center justify-between px-1 shrink-0">
                    <h4 className="text-base font-semibold text-stone-200">{col}</h4>
                    <span className="rounded-full bg-stone-950 px-2.5 py-1 text-xs font-medium text-stone-400 shadow-sm">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => openEdit(t)}
                        className="cursor-pointer rounded-2xl border border-stone-800 bg-stone-950/80 p-4 transition-all hover:border-stone-700 hover:shadow-lg"
                      >
                        <p className="text-sm font-medium leading-relaxed text-stone-100">{t.title}</p>
                        <p className="mt-1.5 text-xs text-stone-500">{getProjectName(t.projectId)}</p>
                        <div className="mt-3 flex items-center justify-between border-t border-stone-800/50 pt-3">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${priorityColors[t.priority] ?? ""}`}>
                            {t.priority}
                          </span>
                          <div className="flex items-center gap-1.5 font-medium shrink-0">
                            {t.dueDate && <span className="text-[10px] text-stone-500">{formatDate(t.dueDate)}</span>}
                            <span className="text-[10px] text-stone-400">· {t.assignee}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => openNew(col)}
                      className="mt-2 w-full rounded-2xl border border-dashed border-stone-800 p-3 text-sm font-medium text-stone-500 transition hover:border-stone-600 hover:text-stone-300 hover:bg-stone-800/50 shrink-0"
                    >
                      + Add Task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-800 text-left text-stone-500">
                <th className="p-4 font-medium">Task</th>
                <th className="p-4 font-medium">Project</th>
                <th className="p-4 font-medium">Assignee</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Due</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-stone-800/50 transition hover:bg-stone-800/30">
                  <td className="p-4 font-medium">{t.title}</td>
                  <td className="p-4 text-stone-400">{getProjectName(t.projectId)}</td>
                  <td className="p-4 text-stone-400">{t.assignee}</td>
                  <td className="p-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityColors[t.priority] ?? ""}`}>{t.priority}</span></td>
                  <td className="p-4 text-stone-400">{formatDate(t.dueDate)}</td>
                  <td className="p-4">
                    <select
                      value={t.status}
                      onChange={(e) => updateTask(t.id, { status: e.target.value as Task["status"] })}
                      className="rounded-lg border border-stone-700 bg-stone-800 px-2 py-1 text-xs text-stone-300"
                    >
                      {COLUMNS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(t)} className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700">Edit</button>
                      <button onClick={() => { if (confirm("Delete?")) deleteTask(t.id); }} className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-12 text-center text-stone-500">No tasks found</div>}
        </div>
      )}

      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Task" : "New Task"}>
        <div className="space-y-4">
          <Field label="Task Title"><input className={inputClass} value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Edit reel footage" /></Field>
          <Field label="Project">
            <select className={selectClass} value={form.projectId ?? ""} onChange={(e) => set("projectId", e.target.value)}>
              <option value="">Select project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Deliverable">
            <select className={selectClass} value={form.deliverableId ?? ""} onChange={(e) => set("deliverableId", e.target.value)}>
              <option value="">Select deliverable…</option>
              {deliverables.filter((d) => !form.projectId || d.projectId === form.projectId).map((d) => <option key={d.id} value={d.id}>{d.type} ({d.unit})</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Assignee"><input className={inputClass} value={form.assignee ?? ""} onChange={(e) => set("assignee", e.target.value)} /></Field>
            <Field label="Due Date"><input className={inputClass} type="date" value={form.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority">
              <select className={selectClass} value={form.priority ?? "Medium"} onChange={(e) => set("priority", e.target.value)}>
                {["Low", "Medium", "High", "Urgent"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={selectClass} value={form.status ?? "Todo"} onChange={(e) => set("status", e.target.value)}>
                {COLUMNS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes"><textarea className={`${inputClass} min-h-[80px]`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>
          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className={btnPrimary}>{editId ? "Update" : "Add Task"}</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
            {editId && <button onClick={() => { if (confirm("Delete?")) { deleteTask(editId); setShowForm(false); } }} className={btnDanger}>Delete</button>}
          </div>
        </div>
      </SlideOver>
    </AppShell>
  );
}
