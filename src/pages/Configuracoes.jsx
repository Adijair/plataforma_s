import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Upload, Building2, Download, FileUp } from "lucide-react";
import { toast } from "sonner";

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);
  const [formData, setFormData] = useState({
    nome_empresa: "",
    cnpj: "",
    telefone: "",
    endereco: "",
    logo_url: "",
    mensagem_os: "",
    valor_servico_fixo: ""
  });

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const configs = await base44.entities.Configuracao.list();
      return configs[0] || null;
    }
  });

  useEffect(() => {
    if (config) {
      setFormData({
        nome_empresa: config.nome_empresa || "",
        cnpj: config.cnpj || "",
        telefone: config.telefone || "",
        endereco: config.endereco || "",
        logo_url: config.logo_url || "",
        mensagem_os: config.mensagem_os || "",
        valor_servico_fixo: config.valor_servico_fixo || ""
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (config) {
        return base44.entities.Configuracao.update(config.id, data);
      } else {
        return base44.entities.Configuracao.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações");
    }
  });

  const handleUploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, logo_url: file_url }));
      toast.success("Logo carregada!");
    } catch (error) {
      toast.error("Erro ao fazer upload");
    }
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      valor_servico_fixo: parseFloat(formData.valor_servico_fixo) || 0
    };
    saveMutation.mutate(dataToSave);
  };

  const handleBackup = async () => {
    setDownloadingBackup(true);
    try {
      const ordens = await base44.entities.OrdemServico.list();
      const clientes = await base44.entities.Cliente.list();
      const configs = await base44.entities.Configuracao.list();

      const backupData = {
        data_backup: new Date().toISOString(),
        configuracoes: configs,
        clientes: clientes,
        ordens_servico: ordens,
        estatisticas: {
          total_ordens: ordens.length,
          total_clientes: clientes.length,
          total_fotos: ordens.reduce((acc, os) => acc + (os.fotos?.length || 0), 0)
        }
      };

      const jsonData = JSON.stringify(backupData, null, 2);
      
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-costumaq-os-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Backup realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer backup:", error);
      toast.error("Erro ao realizar backup");
    }
    setDownloadingBackup(false);
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportingBackup(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      // Validar estrutura do backup
      if (!backupData.clientes || !backupData.ordens_servico) {
        toast.error("Arquivo de backup inválido");
        setImportingBackup(false);
        return;
      }

      let importados = 0;

      // Importar clientes
      for (const cliente of backupData.clientes) {
        try {
          const { id, created_date, updated_date, created_by, ...clienteData } = cliente;
          const clientesExistentes = await base44.entities.Cliente.list();
          const existe = clientesExistentes.find(c => c.cpf === clienteData.cpf);
          
          if (!existe) {
            await base44.entities.Cliente.create(clienteData);
            importados++;
          }
        } catch (error) {
          console.error("Erro ao importar cliente:", error);
        }
      }

      // Importar ordens de serviço
      for (const ordem of backupData.ordens_servico) {
        try {
          const { id, created_date, updated_date, created_by, ...ordemData } = ordem;
          await base44.entities.OrdemServico.create(ordemData);
          importados++;
        } catch (error) {
          console.error("Erro ao importar OS:", error);
        }
      }

      // Atualizar configurações se existirem
      if (backupData.configuracoes && backupData.configuracoes.length > 0) {
        const configBackup = backupData.configuracoes[0];
        const { id, created_date, updated_date, created_by, ultimo_numero_os, ...configData } = configBackup;
        
        if (config) {
          await base44.entities.Configuracao.update(config.id, configData);
        } else {
          await base44.entities.Configuracao.create(configData);
        }
      }

      queryClient.invalidateQueries();
      toast.success(`Backup importado com sucesso! ${importados} registros importados.`);
    } catch (error) {
      console.error("Erro ao importar backup:", error);
      toast.error("Erro ao importar backup. Verifique se o arquivo é válido.");
    }
    setImportingBackup(false);
    e.target.value = '';
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 pb-4 border-b-2 border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Configurações</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1">Personalize sua empresa e a impressão da OS</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleBackup}
              disabled={downloadingBackup}
              variant="outline"
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadingBackup ? "Gerando..." : "Exportar Backup"}
            </Button>
            <label className="flex-1 sm:flex-none">
              <Button
                disabled={importingBackup}
                variant="outline"
                className="border-2 border-green-500 text-green-600 hover:bg-green-50 w-full"
                size="sm"
                type="button"
                asChild
              >
                <div>
                  <FileUp className="w-4 h-4 mr-2" />
                  {importingBackup ? "Importando..." : "Importar Backup"}
                </div>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
                disabled={importingBackup}
              />
            </label>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Logo */}
        <div>
          <Label>Logo da Empresa</Label>
          <div className="mt-2">
            {formData.logo_url ? (
              <div className="mb-3">
                <img src={formData.logo_url} alt="Logo" className="h-24 md:h-32 border-2 border-gray-300 rounded p-2" />
              </div>
            ) : null}
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded p-4 hover:bg-gray-50 transition-colors text-center">
                <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Clique para fazer upload da logo</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadLogo}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Dados da Empresa */}
        <div>
          <Label>Nome da Empresa</Label>
          <Input
            value={formData.nome_empresa}
            onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })}
            className="border-2 border-gray-300"
            placeholder="Minha Empresa LTDA"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>CNPJ</Label>
            <Input
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              className="border-2 border-gray-300"
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="border-2 border-gray-300"
              placeholder="(00) 0000-0000"
            />
          </div>
        </div>

        <div>
          <Label>Endereço</Label>
          <Input
            value={formData.endereco}
            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
            className="border-2 border-gray-300"
            placeholder="Rua, número, bairro, cidade - UF"
          />
        </div>

        {/* Valor Fixo de Serviço */}
        <div>
          <Label>Valor Fixo do Serviço (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.valor_servico_fixo}
            onChange={(e) => setFormData({ ...formData, valor_servico_fixo: e.target.value })}
            className="border-2 border-gray-300"
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">Este valor será aplicado automaticamente em novas OS (pode ser ajustado manualmente)</p>
        </div>

        {/* Mensagem da OS */}
        <div>
          <Label>Mensagem/Recado na OS</Label>
          <Textarea
            value={formData.mensagem_os}
            onChange={(e) => setFormData({ ...formData, mensagem_os: e.target.value })}
            className="border-2 border-gray-300 min-h-24"
            placeholder="Ex: Garantia de 90 dias para serviços realizados. O cliente tem 30 dias para retirar o aparelho após a conclusão do serviço."
          />
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4 border-t-2 border-gray-200">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </form>
    </div>
  );
}