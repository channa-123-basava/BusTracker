import Sidebar from './Sidebar';

const DashboardLayout = ({ children, sidebarLinks, role }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar links={sidebarLinks} role={role} />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
