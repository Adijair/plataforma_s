
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Eye, Trash2, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

export default function PerfilCliente() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const cpf = urlParams.get('cpf');

  const [comentariosLocal, setComentariosLocal] = useState("");

  const { data: cliente, isLoading: loadingCliente } = useQuery({
    queryKey: ['cliente', cpf],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.cpf === cpf);
    },
    enabled: !!cpf
  });

  const { data: ordens, isLoading: loadingOrdens } = useQuery({
    queryKey: ['ordens-cliente', cpf],
    queryFn: async () => {
      const ordens = await base44.entities.OrdemServico.list('-created_date');
      return ordens.filter(o => o.cliente_cpf === cpf);
    },
    enabled: !!cpf,
    initialData: []
  });

  useEffect(() => {
    if (cliente) {
      setComentariosLocal(cliente.comentarios_privados || "");
    }
  }, [cliente]);

  const updateComentariosMutation = useMutation({
    mutationFn: ({ id, comentarios }) => base44.entities.Cliente.update(id, { comentarios_privados: comentarios }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente', cpf] });
      toast.success("Comentários salvos com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar comentários");
    }
  });

  const deleteClienteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cliente.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success("Cliente deletado com sucesso!");
      navigate(createPageUrl("Clientes"));
    },
    onError: () => {
      toast.error("Erro ao deletar cliente");
    }
  });

  const handleSaveComentarios = () => {
    updateComentariosMutation.mutate({
      id: cliente.id,
      comentarios: comentariosLocal
    });
  };

  const handleDeleteCliente = () => {
    if (ordens.length > 0) {
      toast.error("Não é possível deletar cliente com ordens de serviço vinculadas");
      return;
    }
    deleteClienteMutation.mutate(cliente.id);
  };

  if (loadingCliente) {
    return <div className="p-4 md:p-6 text-center">Carregando...</div>;
  }

  if (!cliente) {
    return <div className="p-4 md:p-6 text-center">Cliente não encontrado</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b-2 border-gray-200">
        <div className="flex items-center gap-3 md:gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Clientes"))}
            className="border-2 border-gray-300"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Perfil do Cliente</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1">{cliente.nome}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => navigate(createPageUrl(`NovaOS?cpf=${cliente.cpf}`))}
            className="bg-gradient-to-r from-[#cf1d2d] to-[#a01623] hover:from-[#e02638] hover:to-[#cf1d2d] shadow-md flex-1 sm:flex-none"
            size="sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Nova OS
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  {ordens.length > 0 ? (
                    <span className="text-red-600 font-medium">
                      Este cliente possui {ordens.length} ordem(ns) de serviço vinculada(s). 
                      Não é possível deletá-lo.
                    </span>
                  ) : (
                    "Tem certeza que deseja deletar este cliente? Esta ação não pode ser desfeita."
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                {ordens.length === 0 && (
                  <AlertDialogAction onClick={handleDeleteCliente} className="bg-red-600 hover:bg-red-700">
                    Deletar
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="mb-6 p-4 md:p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300">
        <h3 className="font-bold text-base md:text-lg mb-4 text-gray-800">Informações do Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs md:text-sm text-gray-600">Nome Completo</p>
            <p className="font-medium text-sm md:text-base text-gray-800">{cliente.nome}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-600">CPF</p>
            <p className="font-medium text-sm md:text-base text-gray-800">{cliente.cpf}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-600">Telefone</p>
            <p className="font-medium text-sm md:text-base text-gray-800">{cliente.telefone}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-600">Data de Cadastro</p>
            <p className="font-medium text-sm md:text-base text-gray-800">
              {cliente.data_cadastro ? format(new Date(cliente.data_cadastro), "dd/MM/yyyy", { locale: ptBR }) : "-"}
            </p>
          </div>
          {cliente.endereco && (
            <div className="md:col-span-2">
              <p className="text-xs md:text-sm text-gray-600">Endereço</p>
              <p className="font-medium text-sm md:text-base text-gray-800">
                {cliente.endereco}
                {cliente.numero && `, ${cliente.numero}`}
                {cliente.complemento && ` - ${cliente.complemento}`}
                {cliente.cep && ` | CEP: ${cliente.cep}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comentários Privados */}
      <div className="mb-6 p-4 md:p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base md:text-lg text-gray-800">Comentários e Lembretes Privados</h3>
          <Button
            onClick={handleSaveComentarios}
            disabled={updateComentariosMutation.isPending}
            size="sm"
            className="bg-[#cf1d2d] hover:bg-[#e02638]"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateComentariosMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
        <Textarea
          value={comentariosLocal}
          onChange={(e) => setComentariosLocal(e.target.value)}
          placeholder="Adicione observações, lembretes ou comentários privados sobre este cliente..."
          className="border-2 border-yellow-300 bg-white min-h-32"
        />
        <p className="text-xs text-gray-500 mt-2">
          ℹ️ Estes comentários são privados e não aparecem nas ordens de serviço
        </p>
      </div>

      {/* Ordens de Serviço */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
          <h3 className="font-bold text-base md:text-lg text-gray-800">
            Ordens de Serviço ({ordens.length})
          </h3>
        </div>

        {loadingOrdens ? (
          <div className="text-center py-12 text-gray-500">Carregando ordens...</div>
        ) : ordens.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded border-2 border-gray-300">
            <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 text-gray-300" />
            <p className="text-sm md:text-base text-gray-500">Nenhuma ordem de serviço encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ordens.map((ordem) => (
              <div
                key={ordem.id}
                onClick={() => navigate(createPageUrl(`VisualizarOS?id=${ordem.id}`))}
                className="p-3 md:p-4 bg-white border-2 border-gray-300 rounded cursor-pointer hover:bg-red-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                      <span className="font-mono font-bold text-base md:text-lg">OS {ordem.numero_os}</span>
                      <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium border ${statusColors[ordem.status]}`}>
                        {statusLabels[ordem.status]}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Aparelho:</span> {ordem.marca} {ordem.modelo}</p>
                      <p><span className="font-medium">Data Entrada:</span> {format(new Date(ordem.data_entrada), "dd/MM/yyyy", { locale: ptBR })}</p>
                      <p><span className="font-medium">Defeito:</span> {ordem.defeito}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-2 border-gray-300 w-full sm:w-auto">
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
