import type { Metadata } from "next";
import "./globals.css";
import "./flow.css";

export const metadata: Metadata = {
  title: "ПроектСмета — расчёт стоимости проектирования",
  description: "Расчёт нормативной и коммерческой стоимости проектных работ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
