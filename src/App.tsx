import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { DashboardView } from './components/DashboardView';
import { OmnichannelView } from './components/OmnichannelView';
import { AutomationsView } from './components/AutomationsView';
import { AdminView } from './components/AdminView';
import { AuditLogView } from './components/AuditLogView';
import { CardModal } from './components/CardModal';
import { NewCardModal } from './components/NewCardModal';
import { ExportModal } from './components/ExportModal';
import { PhaseTransitionModal } from './components/PhaseTransitionModal';
import { IntegrationsModal } from './components/IntegrationsModal';

const MainContent: React.FC = () => {
  const { currentView, isIntegrationsModalOpen, setIsIntegrationsModalOpen } = useCRM();

  return (
    <main className="min-h-[calc(100vh-60px)]">
      {currentView === 'kanban' && <KanbanBoard />}
      {currentView === 'table' && <TableView />}
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'omnichannel' && <OmnichannelView />}
      {currentView === 'automations' && <AutomationsView />}
      {currentView === 'admin' && <AdminView />}
      {currentView === 'audit' && <AuditLogView />}

      {/* Global Modals */}
      <CardModal />
      <NewCardModal />
      <ExportModal />
      <PhaseTransitionModal />
      <IntegrationsModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
      />
    </main>
  );
};

const MainLayout: React.FC = () => {
  const { theme } = useCRM();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-[#f4f6f8] dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-rose-500 selection:text-white transition-colors duration-200`}>
      <Header />
      <MainContent />
    </div>
  );
};

export default function App() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] dark:bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <CRMProvider>
      <MainLayout />
    </CRMProvider>
  );
}
