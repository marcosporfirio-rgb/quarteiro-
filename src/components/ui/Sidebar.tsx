import React from 'react';
import {
  BarChart3,
  Calculator,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  Settings,
  Upload,
  X,
} from 'lucide-react';
import { NavSection } from '../../types/ads';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'daily', label: 'Desempenho diário', icon: FileSpreadsheet },
  { id: 'weekly', label: 'Comparativo semanal', icon: GitCompareArrows },
  { id: 'weekday', label: 'Análise por dia da semana', icon: CalendarDays },
  { id: 'simulator', label: 'Simulador de resultados', icon: Calculator },
  { id: 'reports', label: 'Relatórios', icon: FileText },
  { id: 'import', label: 'Importação de dados', icon: Upload },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const handleClick = (id: NavSection) => {
    onSelectSection(id);
    onCloseMobile();
  };

  const navContent = (isMobile: boolean) => (
    <div className="flex h-full flex-col bg-[#142B46] text-slate-100 select-none">
      {/* Brand header */}
      <div
        className={`flex items-center justify-between border-b border-white/10 px-4 py-4 ${
          collapsed && !isMobile ? 'justify-center px-2' : ''
        }`}
      >
        <div className={`flex items-center gap-3 min-w-0 ${collapsed && !isMobile ? 'justify-center' : ''}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white font-bold tracking-tight text-sm shadow-sm">
            Q
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-wider text-white whitespace-nowrap">
                QUARTEIRO
              </div>
              <div className="text-[11px] font-medium text-slate-300 truncate">
                Performance Intelligence
              </div>
            </div>
          )}
        </div>

        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fechar menu"
            className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={`hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white transition-colors ${
              collapsed ? 'mt-0 ml-1' : ''
            }`}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1" aria-label="Menu principal">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              title={collapsed && !isMobile ? item.label : undefined}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white'
              } ${collapsed && !isMobile ? 'justify-center px-2' : ''}`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}
              />
              {(!collapsed || isMobile) && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer note */}
      {(!collapsed || isMobile) && (
        <div className="border-t border-white/10 px-4 py-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 font-medium text-slate-300">
            <BarChart3 className="h-3.5 w-3.5 text-[#60A5FA]" />
            <span>Meta Ads · B2B WPP</span>
          </div>
          <div className="mt-0.5 text-slate-400">Dados locais e auditáveis</div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-[260px]'
        }`}
      >
        <div className="sticky top-0 h-screen">{navContent(false)}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 shadow-xl">
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
