"use client"

import { useTranslation } from "react-i18next"
import { LanguageSwitcher } from "@/components/language-switcher"

export function Header() {
  const { t } = useTranslation()

  return (
    <header className="flex justify-between items-center p-4">
      <h1 className="text-2xl font-bold">{t("dashboardTitle")}</h1>
      <LanguageSwitcher />
    </header>
  )
}
