
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Upload, Save, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";

export default function NovaOS() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Verificar se há CPF na URL
  const urlParams = new URLSearchParams(window.location.search);
  const cpfFromUrl = urlParams.get('cpf');

  const [cpfBusca, setCpfBusca] = useState(cpfFromUrl || "");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    data_entrada: new Date().toISOString().split('T')[0],
    marca: "",
    modelo: "",
    defeito: "",
    observacoes: "",
    valor_servico: "",
    checklist: {
      pedal: false,
      calcador: false,
      caixa_bobina: false,
      avaria: false
    },
    fotos: []
  });

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const configs = await base44.entities.Configuracao.list();
      return configs[0] || null;
    }
  });

  // Auto-buscar cliente se CPF vier da URL
  useEffect(() => {
    if (cpfFromUrl && clientes.length > 0 && !clienteSelecionado) {
      buscarCliente();
    }
  }, [cpfFromUrl, clientes, clienteSelecionado]);

  const createOSMutation = useMutation({
    mutationFn: async (data) => {
      // Gerar número sequencial da OS
      const configs = await base44.entities.Configuracao.list();
      const config = configs[0];
      const ultimoNumero = config?.ultimo_numero_os || 0;
      const novoNumero = ultimoNumero + 1;
      const numeroOS = String(novoNumero).padStart(4, '0');
      
      // Atualizar configuração com novo número
      if (config) {
        await base44.entities.Configuracao.update(config.id, { ultimo_numero_os: novoNumero });
      } else {
        await base44.entities.Configuracao.create({ ultimo_numero_os: novoNumero });
      }
      
      // Criar OS com número
      return base44.entities.OrdemServico.create({ ...data, numero_os: numeroOS });
    },
    onSuccess: (newOS) => {
      queryClient.invalidateQueries({ queryKey: ['ordens'] });
      queryClient.invalidateQueries({ queryKey: ['config'] });
      toast.success("OS criada com sucesso!");
      navigate(createPageUrl(`VisualizarOS?id=${newOS.id}`));
    },
    onError: () => {
      toast.error("Erro ao criar OS");
    }
  });

  const buscarCliente = () => {
    const cliente = clientes.find(c => c.cpf === cpfBusca);
    if (cliente) {
      setClienteSelecionado(cliente);
      toast.success(`Cliente encontrado: ${cliente.nome}`);
      // Aplicar valor fixo se existir
      if (config?.valor_servico_fixo) {
        setFormData(prev => ({ ...prev, valor_servico: config.valor_servico_fixo.toString() }));
      }
    } else {
      toast.error("Cliente não encontrado");
      setClienteSelecionado(null);
    }
  };

  const handleUploadFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        fotos: [...prev.fotos, file_url]
      }));
      toast.success("Foto adicionada!");
    } catch (error) {
      toast.error("Erro ao fazer upload da foto");
    }
    setUploading(false);
  };

  const removerFoto = (index) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clienteSelecionado) {
      toast.error("Selecione um cliente primeiro");
      return;
    }

    const osData = {
      ...formData,
      cliente_cpf: clienteSelecionado.cpf,
      cliente_nome: clienteSelecionado.nome,
      cliente_telefone: clienteSelecionado.telefone,
      status: "em_aberto",
      historico_status: [{
        status: "em_aberto",
        data: new Date().toISOString()
      }],
      valor_servico: parseFloat(formData.valor_servico) || 0,
      pecas: []
    };

    createOSMutation.mutate(osData);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 md:gap-4 mb-6 pb-4 border-b-2 border-gray-200">
        <Button
          variant="outline"
          onClick={() => navigate(cpfFromUrl ? createPageUrl(`PerfilCliente?cpf=${cpfFromUrl}`) : createPageUrl("Dashboard"))}
          className="border-2 border-gray-300"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Nova Ordem de Serviço</h2>
          <p className="text-xs md:text-sm text-gray-600 mt-1">Cadastre uma nova ordem de serviço</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Busca de Cliente */}
        <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded border-2 border-red-200">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm md:text-base">
            <Search className="w-4 h-4 md:w-5 md:h-5" />
            Buscar Cliente por CPF
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="000.000.000-00"
              value={cpfBusca}
              onChange={(e) => setCpfBusca(e.target.value)}
              className="border-2 border-red-300"
            />
            <Button type="button" onClick={buscarCliente} className="bg-[#cf1d2d] hover:bg-[#e02638]">
              Buscar
            </Button>
          </div>
          {clienteSelecionado && (
            <div className="mt-3 p-3 bg-white rounded border border-red-300">
              <p className="font-bold text-gray-800 text-sm md:text-base">{clienteSelecionado.nome}</p>
              <p className="text-xs md:text-sm text-gray-600">Telefone: {clienteSelecionado.telefone}</p>
              <p className="text-xs md:text-sm text-gray-600">CPF: {clienteSelecionado.cpf}</p>
            </div>
          )}
        </div>

        {clienteSelecionado && (
          <>
            <div>
              <Label>Data de Entrada</Label>
              <Input
                type="date"
                value={formData.data_entrada}
                onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
                className="border-2 border-gray-300"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Marca do Aparelho</Label>
                <Input
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  className="border-2 border-gray-300"
                  required
                />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  className="border-2 border-gray-300"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Defeito / Relato do Cliente</Label>
              <Textarea
                value={formData.defeito}
                onChange={(e) => setFormData({ ...formData, defeito: e.target.value })}
                className="border-2 border-gray-300 min-h-24"
                required
              />
            </div>

            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded border-2 border-gray-300">
              <h3 className="font-bold text-gray-800 mb-3">Checklist de Acessórios</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {['pedal', 'calcador', 'caixa_bobina', 'avaria'].map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={item}
                      checked={formData.checklist[item]}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          checklist: { ...formData.checklist, [item]: checked }
                        })
                      }
                    />
                    <label htmlFor={item} className="text-sm font-medium capitalize cursor-pointer">
                      {item.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Fotos do Aparelho</Label>
              <div className="mt-2">
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded p-4 hover:bg-gray-50 transition-colors text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Clique para adicionar fotos</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFoto}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {formData.fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {formData.fotos.map((foto, index) => (
                    <div key={index} className="relative group">
                      <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded border-2 border-gray-300" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removerFoto(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="border-2 border-gray-300 min-h-20"
                placeholder="Observações adicionais..."
              />
            </div>

            <div>
              <Label>Valor do Serviço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_servico}
                onChange={(e) => setFormData({ ...formData, valor_servico: e.target.value })}
                className="border-2 border-gray-300"
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="border-2 border-gray-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createOSMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md"
              >
                <Save className="w-4 h-4 mr-2" />
                {createOSMutation.isPending ? "Salvando..." : "Salvar OS"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
