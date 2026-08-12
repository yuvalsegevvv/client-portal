"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  name: string;
  taskType: string | null;
  status: string | null;
  deadline: string | null;
  daysDelayed: number;
}

const TASK_TYPES = [
  "Monthly Report",
  "Annual Report",
  "Task Reduction",
  "Periodic Tax",
  "Annual Tax Return"
];

function statusStyle(status: string | null): string {
  if (!status) return "bg-border text-ink/60";
  if (status.includes("In Delay")) return "bg-rose/10 text-rose";
  if (status === "In Progress") return "bg-navy-light/10 text-navy-light";
  return "bg-border text-ink/70";
}

export default function DashboardClient({
  clientName,
  email
}: {
  clientName: string;
  email: string;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [taskType, setTaskType] = useState(TASK_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const [file, setFile] = useState<globalThis.File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  async function loadTasks() {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load your open work.");
      setTasks(data.tasks);
    } catch (err: any) {
      setTasksError(err.message);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function submitRequest(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setRequestMessage(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit your request.");
      setRequestMessage("Request submitted. It now appears in your open work below.");
      setNotes("");
      loadTasks();
    } catch (err: any) {
      setRequestMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setUploadMessage(`"${file.name}" was uploaded.`);
      setFile(null);
    } catch (err: any) {
      setUploadMessage(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-navy">{clientName}</p>
            <p className="text-xs text-ink/50">{email}</p>
          </div>
          <button
            onClick={signOut}
            className="focus-ring rounded-lg border border-border px-3 py-1.5 text-sm text-ink/70 hover:bg-mist"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {/* Open tasks */}
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Your open work</h2>
          {tasksError && <p className="text-sm text-rose">{tasksError}</p>}
          {!tasks && !tasksError && <p className="text-sm text-ink/50">Loading...</p>}
          {tasks && tasks.length === 0 && (
            <p className="text-sm text-ink/50">Nothing open right now — you're all caught up.</p>
          )}
          {tasks && tasks.length > 0 && (
            <ul className="divide-y divide-border">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{t.name}</p>
                    <p className="text-xs text-ink/50">
                      {t.taskType || "—"}
                      {t.deadline ? ` · Due ${t.deadline}` : ""}
                      {t.daysDelayed > 0 ? ` · ${t.daysDelayed}d overdue` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(t.status)}`}>
                    {t.status || "Unknown"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* New request */}
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Ask for something new</h2>
          <form onSubmit={submitRequest} className="space-y-4">
            <div>
              <label htmlFor="taskType" className="mb-1 block text-sm font-medium text-ink">
                Request type
              </label>
              <select
                id="taskType"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="focus-ring w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-ink">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything we should know before we start?"
                className="focus-ring w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
              />
            </div>
            {requestMessage && <p className="text-sm text-ink/70">{requestMessage}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="focus-ring rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-light disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit request"}
            </button>
          </form>
        </section>

        {/* Document upload */}
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">Upload a document</h2>
          <form onSubmit={submitUpload} className="space-y-4">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="focus-ring w-full text-sm"
            />
            {uploadMessage && <p className="text-sm text-ink/70">{uploadMessage}</p>}
            <button
              type="submit"
              disabled={!file || uploading}
              className="focus-ring rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-light disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
