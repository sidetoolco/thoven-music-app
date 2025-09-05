"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ParentGreetingCard } from "@/components/parent-greeting-card"
import { StudentsPanel } from "@/components/students-panel"
import { ClassesPanel } from "@/components/classes-panel"
import { MessageCenter } from "@/components/message-center"
import { LeftNavRail } from "@/components/left-nav-rail"

// Dev fixtures
const parentFixture = {
  name: "Keriman Erten",
  email: "kerimanerten@iCloud.com",
  role: "Mother",
  avatar: "/woman-dark-hair.png",
}

const studentsFixture = [
  {
    id: "1",
    name: "Tommy Erten",
    avatar:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/make_him_be_waving_just_waving_1756835489299-viUDIU3Cm4Qdw9BcXS2twEJbeFd7Zt.png",
    interests: ["Piano", "Ukulele"],
    activeClasses: 5,
    modes: ["In-Person", "Online"],
  },
]

const classesFixture = [
  {
    id: "1",
    name: "Piano Classes for Teenagers",
    teacher: "David Chen",
    student: "Tommy Erten",
    lastUpdate: "07/04/2025",
  },
]

const messagesFixture = [
  {
    id: "1",
    isNew: true,
    sender: "Camila Torres",
    subject: "Progress of Pepe during the classes",
    date: "Today",
  },
  {
    id: "2",
    isNew: false,
    sender: "Camila Torres",
    subject: "Payment Updates",
    date: "29 May",
  },
  {
    id: "3",
    isNew: false,
    sender: "David Chen",
    subject: "Welcome to Piano Lesson for teenagers!",
    date: "15 May",
  },
]

export default function ParentDashboard() {
  const [students, setStudents] = useState(studentsFixture)
  const [classes, setClasses] = useState(classesFixture)
  const [messages, setMessages] = useState(messagesFixture)
  const [showArchived, setShowArchived] = useState(false)

  const handleAddStudent = (studentData: any) => {
    const newStudent = {
      id: Date.now().toString(),
      ...studentData,
      avatar:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/make_him_be_waving_just_waving_1756835489299-viUDIU3Cm4Qdw9BcXS2twEJbeFd7Zt.png",
      activeClasses: 0,
      modes: [],
    }
    setStudents([...students, newStudent])
  }

  const handleJoinClass = (classCode: string) => {
    const newClass = {
      id: Date.now().toString(),
      name: "New Class",
      teacher: "Teacher Name",
      student: students[0]?.name || "Student",
      lastUpdate: new Date().toLocaleDateString(),
    }
    setClasses([...classes, newClass])
  }

  const handleDeleteMessage = (messageId: string) => {
    setMessages(messages.filter((msg) => msg.id !== messageId))
  }

  const handleLogout = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-sm">
        <div className="flex items-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logocropped-Ts5Qu9cYp28KPMWeyKi361H6sTD2Qc.png"
            alt="THOVEN - Music Education Platform"
            className="h-16 w-auto"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-sans text-gray-600">Welcome, {parentFixture.name}</span>
          <Button
            variant="outline"
            className="border-orange-400 text-orange-600 hover:bg-orange-50 bg-transparent shadow-[0_4px_0_0_rgb(251,146,60)] hover:shadow-[0_2px_0_0_rgb(251,146,60)] active:shadow-[0_1px_0_0_rgb(251,146,60)] transition-all duration-150 active:translate-y-1 font-sans font-semibold"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Authority Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
        <p className="text-sm text-amber-800 text-center">
          Parents manage payments, messaging, scheduling, and account settings. Students see homework, files, and
          progress.
        </p>
      </div>

      <div className="flex">
        {/* Left Navigation Rail */}
        <LeftNavRail />

        {/* Main Content */}
        <main className="flex-1 p-6 ml-64">
          {/* Row A - Top Panels */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <ParentGreetingCard parent={parentFixture} />
            <StudentsPanel students={students} onAddStudent={handleAddStudent} />
            <ClassesPanel
              classes={classes}
              showArchived={showArchived}
              onToggleArchived={() => setShowArchived(!showArchived)}
              onJoinClass={handleJoinClass}
            />
          </div>

          {/* Row B - Message Center */}
          <MessageCenter messages={messages} onDeleteMessage={handleDeleteMessage} />
        </main>
      </div>
    </div>
  )
}
