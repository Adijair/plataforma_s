
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Plus, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusColors = {
  em_aberto: "bg-yellow-100 text-yellow-800 border-yellow-300",
  aguardando_cliente: "bg-blue-100 text-blue-800 border-blue-300",
  concluido: "bg-green-100 text-green-800 border-green-300",
  finalizado: "bg-gray-100 text-gray-800 border-gray-300"
};

const statusLabels = {
  em_aberto: "Em Aberto",
  aguardando_cliente: "Aguardando Cliente",
  concluido: "Concluído",
  finalizado: "Finalizado"
};

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchData, setSearchData] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");

  const { data: ordens, isLoading } = useQuery({
    queryKey: ['ordens'],
    queryFn: () => base44.entities.OrdemServico.list('-created_date'),
    initialData: [],
  });

  const filteredOrdens = ordens.filter(ordem => {
    const matchSearch = searchTerm ? (
      ordem.cliente_cpf?.includes(searchTerm) ||
      ordem.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ordem.cliente_telefone?.includes(searchTerm)
    ) : true;
    const matchData = searchData ? ordem.data_entrada === searchData : true;
    const matchStatus = filterStatus !== "todos" ? ordem.status === filterStatus : true;
    return matchSearch && matchData && matchStatus;
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Ordens de Serviço</h2>
          <p className="text-xs md:text-sm text-gray-600 mt-1">Gerencie todas as suas ordens de serviço</p>
        </div>
        <Link to={createPageUrl("NovaOS")} className="w-full sm:w-auto">
          <Button className="bg-gradient-to-r from-[#cf1d2d] to-[#a01623] hover:from-[#e02638] hover:to-[#cf1d2d] shadow-md w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded border border-gray-300">
        <div>
          <label className="text-xs md:text-sm font-medium text-gray-700 mb-2 block">Buscar por CPF, Nome ou Telefone</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Digite CPF, nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 border-gray-300"
            />
          </div>
        </div>
        <div>
          <label className="text-xs md:text-sm font-medium text-gray-700 mb-2 block">Buscar por Data</label>
          <Input
            type="date"
            value={searchData}
            onChange={(e) => setSearchData(e.target.value)}
            className="border-2 border-gray-300"
          />
        </div>
        <div>
          <label className="text-xs md:text-sm font-medium text-gray-700 mb-2 block">Filtrar por Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="border-2 border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="em_aberto">Em Aberto</SelectItem>
              <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Ordens */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : filteredOrdens.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Filter className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
          </div>
          <p className="text-sm md:text-base text-gray-500">Nenhuma ordem de serviço encontrada</p>
        </div>
      ) : (
        <>
          {/* Versão Desktop - Tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Nº OS</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">CPF</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Data Entrada</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Aparelho</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrdens.map((ordem, index) => (
                  <tr
                    key={ordem.id}
                    className={`border-b border-gray-200 hover:bg-red-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-sm font-bold">{ordem.numero_os}</td>
                    <td className="px-4 py-3 font-medium">{ordem.cliente_nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ordem.cliente_cpf}</td>
                    <td className="px-4 py-3 text-sm">
                      {ordem.data_entrada ? format(new Date(ordem.data_entrada), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">{ordem.marca} {ordem.modelo}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[ordem.status]}`}>
                        {statusLabels[ordem.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link to={createPageUrl(`VisualizarOS?id=${ordem.id}`)}>
                        <Button variant="outline" size="sm" className="border-2 border-gray-300 hover:bg-red-50">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Versão Mobile - Cards */}
          <div className="md:hidden space-y-3">
            {filteredOrdens.map((ordem) => (
              <Link key={ordem.id} to={createPageUrl(`VisualizarOS?id=${ordem.id}`)}>
                <div className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:bg-red-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-mono text-lg font-bold text-gray-800 mb-1">
                        OS {ordem.numero_os}
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[ordem.status]}`}>
                        {statusLabels[ordem.status]}
                      </span>
                    </div>
                    <Eye className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Cliente:</span>
                      <div className="text-gray-900">{ordem.cliente_nome}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium text-gray-700">CPF:</span>
                        <div className="text-gray-900">{ordem.cliente_cpf}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Data:</span>
                        <div className="text-gray-900">
                          {ordem.data_entrada ? format(new Date(ordem.data_entrada), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Aparelho:</span>
                      <div className="text-gray-900">{ordem.marca} {ordem.modelo}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
