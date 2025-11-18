import React from "react"
import { MySubmissions } from "./MySubmission"
import { MyOverview } from "./MyOverview"

export const ActivityTab: React.FC = () => {
  return (
    <section className="mt-6 space-y-6">
      <MySubmissions />
      <MyOverview />
    </section>
  )
}




