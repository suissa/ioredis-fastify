"use client"

import { motion } from "framer-motion"
import { RealTimeChart } from "@/components/charts/real-time-chart"
import type { DashboardPlugin } from "@/plugins/plugin"

interface MainContentProps {
  selectedPlugin: DashboardPlugin | null
}

export function MainContent({ selectedPlugin }: MainContentProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 p-4"
    >
      {selectedPlugin ? (
        <selectedPlugin.component />
      ) : (
        <RealTimeChart />
      )}
    </motion.main>
  )
}
