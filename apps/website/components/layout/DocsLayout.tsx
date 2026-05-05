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
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="flex">
            <div className="flex-1 min-w-0">
              {children}
            </div>
            {toc && (
              <div className="hidden xl:block flex-shrink-0">
                <div className="sticky top-0 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
                  {toc}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
