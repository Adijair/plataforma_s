import { useState } from "react";
import { localClient } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, UserPlus, Search, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function Clientes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cpfExistente, setCpfExistente] = useState(null);
  const [formData, setFormData] = useState({
    cpf: "",
    nome: "",
    telefone: "",
    endereco: "",
    numero: "",
    complemento: "",
    cep: "",
    data_cadastro: new Date().toISOString().split('T')[0]
  });

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => localClient.getClientes(),
    initialData: [],
  });

  const createClienteMutation = useMutation({
    mutationFn: (data) => localClient.createCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success("Cliente cadastrado com sucesso!");
      setOpen(false);
      setCpfExistente(null);
      setFormData({
        cpf: "",
        nome: "",
        telefone: "",
        endereco: "",
        numero: "",
        complemento: "",
        cep: "",
        data_cadastro: new Date().toISOString().split('T')[0]
      });
    },
    onError: () => {
      toast.error("Erro ao cadastrar cliente");
    }
  });

  const verificarCPF = (cpf) => {
    if (cpf.length >= 11) {
      const clienteExiste = clientes.find(c => c.cpf === cpf);
      if (clienteExiste) {
        setCpfExistente(clienteExiste);
      } else {
        setCpfExistente(null);
      }
    } else {
      setCpfExistente(null);
    }
  };

  const handleCPFChange = (e) => {
    const cpf = e.target.value;
    setFormData({ ...formData, cpf });
    verificarCPF(cpf);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (cpfExistente) {
      toast.error("CPF já cadastrado!");
      return;
    }

    createClienteMutation.mutate(formData);
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpf?.includes(searchTerm) ||
    cliente.telefone?.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Clientes</h2>
          <p className="text-xs md:text-sm text-gray-600 mt-1">Gerencie seus clientes cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#cf1d2d] to-[#a01623] hover:from-[#e02638] hover:to-[#cf1d2d] shadow-md w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Cadastrar Novo Cliente
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* CPF - PRIMEIRO CAMPO */}
              <div>
                <Label>CPF *</Label>
                <Input
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  className="border-2 border-gray-300"
                  required
                />
              </div>

              {/* Alerta de CPF Existente */}
              {cpfExistente && (
                <Alert variant="destructive" className="bg-red-50 border-red-300">
                  <AlertTitle className="text-red-800 font-bold">Cliente já cadastrado!</AlertTitle>
                  <AlertDescription className="text-red-700">
                    <div className="mt-2">
                      <p><strong>Nome:</strong> {cpfExistente.nome}</p>
                      <p><strong>Telefone:</strong> {cpfExistente.telefone}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => {
                          setOpen(false);
                          navigate(createPageUrl(`PerfilCliente?cpf=${cpfExistente.cpf}`));
                        }}
                      >
                        Ver Perfil do Cliente
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="border-2 border-gray-300"
                  required
                  disabled={!!cpfExistente}
                />
              </div>

              <div>
                <Label>Telefone *</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="border-2 border-gray-300"
                  required
                  disabled={!!cpfExistente}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, Avenida..."
                    className="border-2 border-gray-300"
                    disabled={!!cpfExistente}
                  />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="123"
                    className="border-2 border-gray-300"
                    disabled={!!cpfExistente}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    placeholder="Apto, Bloco..."
                    className="border-2 border-gray-300"
                    disabled={!!cpfExistente}
                  />
                </div>
                <div>
                  <Label>CEP</Label>
                  <Input
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="00000-000"
                    className="border-2 border-gray-300"
                    disabled={!!cpfExistente}
                  />
                </div>
              </div>

              <div>
                <Label>Data de Cadastro</Label>
                <Input
                  type="date"
                  value={formData.data_cadastro}
                  onChange={(e) => setFormData({ ...formData, data_cadastro: e.target.value })}
                  className="border-2 border-gray-300"
                  disabled={!!cpfExistente}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setOpen(false);
                  setCpfExistente(null);
                }}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createClienteMutation.isPending || !!cpfExistente} 
                  className="bg-[#cf1d2d] hover:bg-[#e02638]"
                >
                  {createClienteMutation.isPending ? "Salvando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, CPF ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-2 border-gray-300"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : filteredClientes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
          </div>
          <p className="text-sm md:text-base text-gray-500">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredClientes.map((cliente, index) => (
            <div
              key={cliente.id}
              onClick={() => navigate(createPageUrl(`PerfilCliente?cpf=${cliente.cpf}`))}
              className={`flex items-center justify-between p-3 md:p-4 border-2 border-gray-300 rounded cursor-pointer hover:bg-red-50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#cf1d2d] to-[#a01623] rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                  {cliente.nome?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg text-gray-800">{cliente.nome}</h3>
                  <div className="flex flex-col sm:flex-row sm:gap-4 text-xs md:text-sm text-gray-600">
                    <span><span className="font-medium">CPF:</span> {cliente.cpf}</span>
                    <span><span className="font-medium">Tel:</span> {cliente.telefone}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}