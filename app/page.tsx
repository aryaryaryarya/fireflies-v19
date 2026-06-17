"use client"

import { AICoachOrb } from "@/components/ai-coach-orb"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function Home() {
  const [isActive, setIsActive] = useState(true)

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-8 p-8"
      style={{ backgroundColor: "#674E34" }}
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold text-white">AI Coach Orb</h1>
        <p className="text-gray-200 text-center max-w-md">
          A lightweight, looping animation with flowing particles that resembles fireflies in a jar
        </p>
      </div>

      <div className="relative">
        <AICoachOrb size={200} particleCount={900} isActive={isActive} />
      </div>

      <div className="flex gap-4">
        <Button onClick={() => setIsActive(!isActive)} variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Idle"}
        </Button>
      </div>

      <div className="text-sm text-gray-200 text-center max-w-lg">
        <p>Toggle between active and idle states to see the animation speed change.</p>
        <p className="mt-2">The orb has no visible edges and particles flow freely inside like fireflies.</p>
      </div>
    </main>
  )
}
