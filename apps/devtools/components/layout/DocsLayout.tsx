import TopBar from './TopBar'
import Sidebar from './Sidebar'

interface DocsLayoutProps {
  children: React.ReactNode
  toc?: React.ReactNode
}

export default function DocsLayout({ children, toc }: DocsLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 overflow-y-auto">
          <main className="flex-1 min-w-0">
            {children}
          </main>
          {toc && (
            <div className="hidden xl:block flex-shrink-0">
              {toc}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
