"use client"

import { motion } from "framer-motion"
import { FaHome, FaCog, FaChartBar } from "react-icons/fa"
import { plugins } from "@/plugins"
import type { DashboardPlugin } from "@/plugins/plugin"

const navItems = [
  { name: "Home", icon: FaHome },
  { name: "Settings", icon: FaCog },
  { name: "Analytics", icon: FaChartBar },
]

interface SidebarProps {
  onSelectPlugin: (plugin: DashboardPlugin | null) => void
}

export function Sidebar({ onSelectPlugin }: SidebarProps) {
  return (
    <aside className="w-64 p-4 pr-0">
      <nav>
        <ul>
          {navItems.map((item) => (
            <motion.li
              key={item.name}
              whileHover={{ scale: 1.05, x: 5 }}
              className="mb-2"
            >
              <a
                href="#"
                onClick={() => onSelectPlugin(null)}
                className="flex items-center p-2 rounded-l-lg text-lg"
              >
                <item.icon className="mr-4" />
                {item.name}
              </a>
            </motion.li>
          ))}
          <hr className="my-4" />
          {plugins.map((plugin) => (
            <motion.li
              key={plugin.name}
              whileHover={{ scale: 1.05, x: 5 }}
              className="mb-2"
            >
              <a
                href="#"
                onClick={() => onSelectPlugin(plugin)}
                className="flex items-center p-2 rounded-l-lg text-lg"
              >
                <plugin.icon className="mr-4" />
                {plugin.name}
              </a>
            </motion.li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
