"use client"

import { useSidebar } from "@/components/ui/sidebar"

export function SidebarOverlay() {
  const { isOpen, setIsOpen } = useSidebar()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-10 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
  )
}
