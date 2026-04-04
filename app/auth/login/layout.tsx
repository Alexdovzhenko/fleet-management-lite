/**
 * Login-specific layout — covers the parent auth dark layout entirely.
 * The sign-in page has its own full-screen map design that supersedes
 * the shared auth card wrapper.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, overflow: "hidden" }}>
      {children}
    </div>
  )
}
