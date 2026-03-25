
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Users, Settings, Printer, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { localClient } from "@/api/localClient";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const configs = await localClient.getConfiguracoes();
      return configs[0] || null;
    }
  });

  const menuItems = [
    { name: "Início", path: createPageUrl("Dashboard"), icon: Home },
    { name: "Nova OS", path: createPageUrl("NovaOS"), icon: FileText },
    { name: "Clientes", path: createPageUrl("Clientes"), icon: Users },
    { name: "Configurações", path: createPageUrl("Configuracoes"), icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F0F8] to-[#D4E4F7] flex flex-col">
      <style>{`
        :root {
          --win7-border: #8B9DC3;
          --win7-bg: #F0F0F0;
          --win7-blue: #cf1d2d;
          --win7-blue-hover: #e02638;
        }
        
        * {
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      {/* Header estilo Windows 7 */}
      <header className="bg-gradient-to-b from-[#cf1d2d] to-[#a01623] border-b-4 border-[#a01623] shadow-lg">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-3">
            {config?.logo_url ? (
              <img 
                src={config.logo_url} 
                alt="Logo" 
                className="h-8 md:h-10 w-auto object-contain bg-white rounded border-2 border-[#e02638] shadow-md p-1"
              />
            ) : (
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded border-2 border-[#e02638] flex items-center justify-center shadow-md">
                <Printer className="w-4 h-4 md:w-6 md:h-6 text-[#cf1d2d]" />
              </div>
            )}
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white drop-shadow-md">Costumaq OS</h1>
              <p className="text-xs md:text-sm text-red-100 hidden sm:block">Gestão Completa de Assistência Técnica</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar estilo Windows 7 */}
        <aside className="w-full md:w-56 bg-gradient-to-b from-[#F0F0F0] to-[#E0E0E0] border-b md:border-b-0 md:border-r-2 border-[#A0A0A0] shadow-lg">
          <nav className="p-2 flex md:flex-col overflow-x-auto md:overflow-x-visible">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 mb-0 md:mb-1 rounded transition-all whitespace-nowrap ${
                    active
                      ? "bg-gradient-to-r from-[#cf1d2d] to-[#e02638] text-white shadow-md border-l-4 border-[#a01623]"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-[#FDE8EA] hover:to-[#FCD4D7] border-l-4 border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-medium text-sm md:text-base">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-3 md:p-6 flex flex-col">
          <div className="bg-white rounded border-2 border-[#A0A0A0] shadow-lg flex-1 overflow-auto">
            {children}
          </div>
          
          {/* Rodapé fixo */}
          <div className="mt-3 md:mt-4 p-2 md:p-3 bg-white rounded border border-gray-300 shadow-sm text-center">
            <div className="text-xs text-gray-500">
              <p className="font-medium text-gray-700">Costumaq OS 2025</p>
              <p className="mt-1">Desenvolvido por Costumaq Drive</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
