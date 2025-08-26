"use client";
import { toast } from "sonner";
import React from "react";

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#ffffff"/>
      <path d="M12 8v5" stroke="#000000" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="16.5" r="1" fill="#000000"/>
    </svg>
  );
}

function BaseToast({ id, title, description, bg }: { id: number; title: string; description?: string; bg: string }) {
  return (
    <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-xl ${bg}`}>
      <div className="flex items-center">
        <AlertIcon />
      </div>
      <div className="min-w-0">
        <div className="font-semibold">{title}</div>
        {description ? <div className="text-white/90 text-sm break-words">{description}</div> : null}
      </div>
      <button type="button" onClick={() => toast.dismiss(id)} className="ml-auto h-6 w-6 flex items-center justify-center text-white/90 hover:text-white">
        <CloseIcon />
      </button>
    </div>
  );
}

export function notifyError(title: string, description?: string, duration = 3500) {
  return toast.custom((t) => (
    <BaseToast id={t.id} title={title} description={description} bg="bg-red-500" />
  ), { duration });
}

export function notifySuccess(title: string, description?: string, duration = 3000) {
  return toast.custom((t) => (
    <BaseToast id={t.id} title={title} description={description} bg="bg-emerald-500" />
  ), { duration });
}

export function notifyInfo(title: string, description?: string, duration = 3000) {
  return toast.custom((t) => (
    <BaseToast id={t.id} title={title} description={description} bg="bg-blue-500" />
  ), { duration });
}
