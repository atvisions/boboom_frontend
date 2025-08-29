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

function SuccessIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12l2 2 4-4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="2" fill="none"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="2" fill="none"/>
      <path d="M12 16v-4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 8h.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="2" fill="none"/>
      <path d="M15 9l-6 6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 9l6 6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function BaseToast({ id, title, description, bg, icon }: { id: number; title: string; description?: string; bg: string; icon: React.ReactNode }) {
  return (
    <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-xl ${bg}`}>
      <div className="flex items-center">
        {icon}
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
    <BaseToast id={t.id} title={title} description={description} bg="bg-red-500" icon={<ErrorIcon />} />
  ), { duration });
}

export function notifySuccess(title: string, description?: string, duration = 3000) {
  return toast.custom((t) => (
    <BaseToast id={t.id} title={title} description={description} bg="bg-emerald-500" icon={<SuccessIcon />} />
  ), { duration });
}

export function notifyInfo(title: string, description?: string, duration = 3000) {
  return toast.custom((t) => (
    <BaseToast id={t.id} title={title} description={description} bg="bg-blue-500" icon={<InfoIcon />} />
  ), { duration });
}
