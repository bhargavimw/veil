export const metadata = {
  title: "VEIL Dashboard",
  description: "Privacy monitoring for AI agents",
}

export default function RootLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <nav>
          <a href="/">Activity</a>{" "}
          <a href="/permissions">Permissions</a>{" "}
          <a href="/approvals">Approvals</a>{" "}
          <a href="/identities">Identities</a>
        </nav>
        {children}
      </body>
    </html>
  )
}
